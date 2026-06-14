from __future__ import annotations

import json

import httpx

from agents.agent_config import AgentDefinition
from config import settings
from models.schemas import AgentResult, Tag
from utils.financial_calibration import calibrate_biz_financials
from utils.parse_json import parse_json

OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions"
MAX_RETRIES = 1
RETRYABLE_STATUS = {401, 402, 404, 429}


def _headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://osiris.app",
        "X-Title": "Osiris",
        "Content-Type": "application/json",
    }


def _error_result(message: str, agent_id: str | None = None) -> AgentResult:
    return AgentResult(
        score=0,
        verdict="error",
        summary=message,
        recommendation="Retry the evaluation.",
        error=True,
        agent_id=agent_id,
        tags=[],
    )


def _missing_key_message(agent_id: str) -> str:
    env_name = settings._env_name_for_agent(agent_id)
    return (
        f"Missing API key for agent '{agent_id}'. "
        f"Set {env_name} or OPENROUTER_API_KEY in backend/.env"
    )


def _parse_api_error(status_code: int, body: str) -> str:
    try:
        data = json.loads(body)
        message = data.get("error", {}).get("message") or body
    except json.JSONDecodeError:
        message = body
    return f"OpenRouter {status_code}: {message[:240]}"


def _normalize_result(parsed: dict, agent_id: str, idea: str = "") -> AgentResult:
    if agent_id == "biz":
        parsed = calibrate_biz_financials(idea, parsed)
    tags_raw = parsed.get("tags") or []
    tags: list[Tag] = []
    if isinstance(tags_raw, list):
        for item in tags_raw:
            if isinstance(item, dict) and "label" in item:
                tags.append(
                    Tag(
                        label=str(item.get("label", "")),
                        type=item.get("type", "neutral"),  # type: ignore[arg-type]
                    )
                )

    verdict = parsed.get("verdict", "maybe")
    if verdict not in ("strong-yes", "yes", "maybe", "no", "error"):
        verdict = "maybe"

    data: dict = {
        "score": float(parsed.get("score", 0) or 0),
        "verdict": verdict,
        "summary": str(parsed.get("summary") or "No summary provided."),
        "recommendation": str(parsed.get("recommendation") or "No recommendation provided."),
        "tags": tags,
        "error": False,
        "agent_id": agent_id,
    }
    for key, value in parsed.items():
        if key not in AgentResult.model_fields:
            data[key] = value
    return AgentResult.model_validate(data)


def _models_for_agent(agent: AgentDefinition) -> list[str]:
    models = [agent.model, *agent.fallback_models]
    seen: set[str] = set()
    ordered: list[str] = []
    for model in models:
        if model and model not in seen:
            seen.add(model)
            ordered.append(model)
    return ordered


async def call_openrouter_once(
    client: httpx.AsyncClient,
    *,
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.4,
    max_tokens: int = 900,
) -> tuple[str | None, str | None]:
    """Returns (content, error_message). error_message is set on HTTP failure."""
    if not api_key:
        return None, "Missing API key"

    try:
        response = await client.post(
            OPENROUTER_BASE,
            headers=_headers(api_key),
            json={
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )
        if not response.is_success:
            return None, _parse_api_error(response.status_code, response.text)

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content") or "{}"
        return content, None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


async def call_openrouter(
    client: httpx.AsyncClient,
    *,
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.4,
    max_tokens: int = 900,
) -> str | None:
    content, error = await call_openrouter_once(
        client,
        api_key=api_key,
        model=model,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    if error:
        raise RuntimeError(error)
    return content


async def call_agent(
    client: httpx.AsyncClient,
    agent: AgentDefinition,
    idea: str,
) -> AgentResult:
    api_keys = settings.get_agent_api_keys_to_try(agent.id)
    if not api_keys:
        return _error_result(_missing_key_message(agent.id), agent.id)

    models = _models_for_agent(agent)
    user_prompt = agent.build_prompt(idea)
    last_error = "Failed to parse agent response as JSON"

    for api_key in api_keys:
        for model in models:
            for attempt in range(MAX_RETRIES + 1):
                content, http_error = await call_openrouter_once(
                    client,
                    api_key=api_key,
                    model=model,
                    system_prompt=agent.system_prompt,
                    user_prompt=user_prompt,
                    max_tokens=agent.max_tokens,
                )

                if http_error:
                    last_error = http_error
                    # Try next model/key on auth, billing, or missing-model errors
                    if any(code in http_error for code in ("401", "402", "404", "429")):
                        break
                    continue

                parsed = parse_json(content or "")
                if parsed:
                    return _normalize_result(parsed, agent.id, idea)

                last_error = f"Invalid JSON from {model} — retrying"
            # exhausted retries for this model; try next model

    return _error_result(f"Agent failed ({agent.id}): {last_error}", agent.id)
