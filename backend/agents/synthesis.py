from __future__ import annotations

import httpx

from agents.openrouter import call_openrouter_once
from models.schemas import (
    CursorTask,
    DomainTasks,
    EvaluationReport,
    MvpRoadmapWeek,
    PivotSuggestion,
    ScoreBreakdown,
    AgentResult,
)
from utils.parse_json import parse_json

SYNTHESIS_MODEL = "anthropic/claude-sonnet-4-6"
SYNTHESIS_FALLBACK_MODELS = (
    "anthropic/claude-haiku-4-5",
    "openai/gpt-4o-mini",
    "meta-llama/llama-3.1-8b-instruct",
)
MAX_RETRIES = 1

SYNTHESIS_SYSTEM_PROMPT = (
    "You are a startup evaluation synthesis engine. Output only valid JSON matching "
    "the EvaluationReport schema. You MUST always include a cursor_tasks array with "
    "at least 8 tasks spanning frontend, backend, ai_ml, design, marketing, and business "
    "domains. Each task needs a unique id (e.g. FE-001), acceptance_criteria, priority, "
    "and sprint number."
)


def build_synthesis_prompt(idea: str, results: list[AgentResult]) -> str:
    yc, tech, biz, mkt, dem = results

    return f"""You are a senior venture advisor. You have received evaluations from 5 specialist agents.
Synthesize them into a complete Evaluation Report.

Original Idea: "{idea}"

YC Agent ({yc.score}/10): {yc.model_dump_json()}
Tech Agent ({tech.score}/10): {tech.model_dump_json()}
Business Agent ({biz.score}/10): {biz.model_dump_json()}
Marketing Agent ({mkt.score}/10): {mkt.model_dump_json()}
Demand Agent ({dem.score}/10): {dem.model_dump_json()}

Respond ONLY in valid JSON with this EvaluationReport schema:
{{
  "overall_score": number (weighted average 1-10),
  "overall_verdict": string ("strong-yes" | "yes" | "maybe" | "no"),
  "executive_summary": string (4-5 sentences),
  "investor_hook": string (one punchy line),
  "biggest_strength": string,
  "critical_risk": string,
  "final_verdict": string,
  "scores": {{ "yc": number, "tech": number, "biz": number, "mkt": number, "demand": number }},
  "hackathon_tips": string[] (4-6 tips),
  "mvp_roadmap": [{{ "week": number, "title": string, "deliverable": string, "tasks": string[] }}] (exactly 3 weeks),
  "pivot_suggestions": [{{ "title": string, "rationale": string }}],
  "domain_tasks": {{
    "frontend": string[], "backend": string[], "ai_ml": string[],
    "design": string[], "marketing": string[], "business": string[]
  }},
  "cursor_tasks": [{{
    "id": string (e.g. "FE-001", "BE-002"),
    "domain": string ("frontend"|"backend"|"ai_ml"|"design"|"marketing"|"business"),
    "title": string,
    "description": string,
    "acceptance_criteria": string[] (2-4 items),
    "priority": "P0"|"P1"|"P2",
    "sprint": number (1, 2, or 3)
  }}] (minimum 8 tasks)
}}

No markdown fences. No extra text."""


def normalize_report(parsed: dict, results: list[AgentResult]) -> EvaluationReport:
    scores_raw = parsed.get("scores") or {}
    scores = ScoreBreakdown(
        yc=float(scores_raw.get("yc", results[0].score if results else 0)),
        tech=float(scores_raw.get("tech", results[1].score if len(results) > 1 else 0)),
        biz=float(scores_raw.get("biz", results[2].score if len(results) > 2 else 0)),
        mkt=float(scores_raw.get("mkt", results[3].score if len(results) > 3 else 0)),
        demand=float(scores_raw.get("demand", results[4].score if len(results) > 4 else 0)),
    )

    overall = parsed.get("overall_score")
    if not isinstance(overall, (int, float)):
        overall = (scores.yc + scores.tech + scores.biz + scores.mkt + scores.demand) / 5

    domain_raw = parsed.get("domain_tasks") or {}
    domain_tasks = DomainTasks(
        frontend=list(domain_raw.get("frontend") or []),
        backend=list(domain_raw.get("backend") or []),
        ai_ml=list(domain_raw.get("ai_ml") or []),
        design=list(domain_raw.get("design") or []),
        marketing=list(domain_raw.get("marketing") or []),
        business=list(domain_raw.get("business") or []),
    )

    cursor_tasks: list[CursorTask] = []
    for item in parsed.get("cursor_tasks") or []:
        if isinstance(item, dict) and item.get("id"):
            cursor_tasks.append(
                CursorTask(
                    id=str(item["id"]),
                    domain=str(item.get("domain", "frontend")),
                    title=str(item.get("title", "")),
                    description=str(item.get("description", "")),
                    acceptance_criteria=list(item.get("acceptance_criteria") or []),
                    priority=item.get("priority", "P1"),  # type: ignore[arg-type]
                    sprint=int(item.get("sprint", 1)),
                )
            )

    mvp_roadmap: list[MvpRoadmapWeek] = []
    for item in parsed.get("mvp_roadmap") or []:
        if isinstance(item, dict):
            mvp_roadmap.append(
                MvpRoadmapWeek(
                    week=int(item.get("week", 0)),
                    title=str(item.get("title", "")),
                    deliverable=str(item.get("deliverable", "")),
                    tasks=list(item.get("tasks") or []),
                )
            )

    pivot_suggestions: list[PivotSuggestion] = []
    for item in parsed.get("pivot_suggestions") or []:
        if isinstance(item, dict):
            pivot_suggestions.append(
                PivotSuggestion(
                    title=str(item.get("title", "")),
                    rationale=str(item.get("rationale", "")),
                )
            )

    overall_verdict = str(parsed.get("overall_verdict") or "maybe")

    return EvaluationReport(
        overall_score=round(float(overall), 1),
        overall_verdict=overall_verdict,
        executive_summary=str(parsed.get("executive_summary") or "Evaluation complete."),
        investor_hook=str(
            parsed.get("investor_hook") or "A compelling startup opportunity awaits refinement."
        ),
        biggest_strength=str(parsed.get("biggest_strength") or "Strong foundational concept."),
        critical_risk=str(parsed.get("critical_risk") or "Market validation needed."),
        final_verdict=str(parsed.get("final_verdict") or overall_verdict),
        scores=scores,
        hackathon_tips=list(parsed.get("hackathon_tips") or []),
        mvp_roadmap=mvp_roadmap,
        pivot_suggestions=pivot_suggestions,
        domain_tasks=domain_tasks,
        cursor_tasks=cursor_tasks,
    )


def fallback_report(idea: str, results: list[AgentResult]) -> EvaluationReport:
    scores = ScoreBreakdown(
        yc=results[0].score if results else 0,
        tech=results[1].score if len(results) > 1 else 0,
        biz=results[2].score if len(results) > 2 else 0,
        mkt=results[3].score if len(results) > 3 else 0,
        demand=results[4].score if len(results) > 4 else 0,
    )
    avg = (scores.yc + scores.tech + scores.biz + scores.mkt + scores.demand) / 5
    verdict = "yes" if avg >= 7 else "maybe" if avg >= 5 else "no"

    return EvaluationReport(
        overall_score=round(avg, 1),
        overall_verdict=verdict,
        executive_summary=(
            f'Synthesis agent failed to generate a full report for "{idea[:80]}...". '
            "Individual agent scores are available below."
        ),
        investor_hook="Refine your pitch and retry for a full synthesis report.",
        biggest_strength=str(results[0].summary if results else "See individual agent cards."),
        critical_risk="Synthesis report generation failed — review agent outputs manually.",
        final_verdict=verdict,
        scores=scores,
        hackathon_tips=[
            "Focus on a clear demo",
            "Show live agent evaluation",
            "Highlight your unique insight",
        ],
    )


async def run_synthesis(idea: str, results: list[AgentResult]) -> EvaluationReport:
    from config import settings

    api_keys = settings.get_synthesis_api_keys_to_try()
    if not api_keys:
        return fallback_report(idea, results)

    prompt = build_synthesis_prompt(idea, results)
    models = [SYNTHESIS_MODEL, *SYNTHESIS_FALLBACK_MODELS]

    async with httpx.AsyncClient(timeout=120.0) as client:
        for api_key in api_keys:
            for model in models:
                for _ in range(MAX_RETRIES + 1):
                    raw, http_error = await call_openrouter_once(
                        client,
                        api_key=api_key,
                        model=model,
                        system_prompt=SYNTHESIS_SYSTEM_PROMPT,
                        user_prompt=prompt,
                        temperature=0.3,
                        max_tokens=2000,
                    )
                    if http_error:
                        if any(c in http_error for c in ("401", "402", "404", "429")):
                            break
                        continue

                    parsed = parse_json(raw or "")
                    if parsed:
                        return normalize_report(parsed, results)

    return fallback_report(idea, results)
