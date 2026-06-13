from __future__ import annotations

import asyncio
import json
import time
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agents.agent_config import AGENTS
from agents.orchestrator import run_all_agents
from agents.synthesis import run_synthesis
from config import settings
from models.schemas import EvaluateRequest, EvaluateResponse

app = FastAPI(
    title="Osiris API",
    description="Multi-agent startup idea evaluator powered by OpenRouter",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_last_evaluation_by_ip: dict[str, float] = defaultdict(float)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _check_rate_limit(request: Request) -> None:
    if settings.rate_limit_seconds <= 0:
        return

    ip = _client_ip(request)
    now = time.time()
    elapsed = now - _last_evaluation_by_ip[ip]
    if elapsed < settings.rate_limit_seconds:
        retry_after = int(settings.rate_limit_seconds - elapsed) + 1
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit: wait {retry_after}s before next evaluation",
            headers={"Retry-After": str(retry_after)},
        )


def _record_evaluation(request: Request) -> None:
    _last_evaluation_by_ip[_client_ip(request)] = time.time()


@app.get("/api/health")
async def health() -> dict[str, str | bool | int | dict[str, bool]]:
    keys = settings.agent_keys_status()
    return {
        "status": "ok",
        "agents": len(AGENTS),
        "keys_configured": keys,
        "all_keys_ready": settings.all_keys_ready(),
        "openrouter_configured": bool(settings.openrouter_api_key),
    }


@app.post("/api/evaluate", response_model=EvaluateResponse)
async def evaluate(request: Request, body: EvaluateRequest) -> EvaluateResponse:
    _check_rate_limit(request)
    _record_evaluation(request)

    idea = body.idea.strip()
    agent_results = await run_all_agents(idea)
    report = await run_synthesis(idea, agent_results)

    return EvaluateResponse(agent_results=agent_results, report=report)


@app.post("/api/evaluate/stream")
async def evaluate_stream(request: Request, body: EvaluateRequest):
    _check_rate_limit(request)
    _record_evaluation(request)

    idea = body.idea.strip()
    queue: asyncio.Queue[dict | None] = asyncio.Queue()

    async def on_agent_complete(index: int, result) -> None:
        agent = AGENTS[index]
        await queue.put(
            {
                "event": "agent_complete",
                "index": index,
                "agent_id": agent.id,
                "result": result.model_dump(),
            }
        )

    async def run_pipeline() -> None:
        try:
            agent_results = await run_all_agents(idea, on_agent_complete)
            report = await run_synthesis(idea, agent_results)
            await queue.put({"event": "synthesis_complete", "report": report.model_dump()})
        except Exception as exc:  # noqa: BLE001
            await queue.put({"event": "error", "message": str(exc)})
        finally:
            await queue.put(None)

    asyncio.create_task(run_pipeline())

    async def event_generator():
        while True:
            item = await queue.get()
            if item is None:
                yield "event: done\ndata: {}\n\n"
                break
            yield f"event: {item['event']}\ndata: {json.dumps(item)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
