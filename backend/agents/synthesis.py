from __future__ import annotations

import httpx

from agents.prompt_guardrails import JUDGE_GUARDRAILS, compose_prompt
from agents.openrouter import call_openrouter_once
from models.schemas import (
    CursorTask,
    DemandValidation,
    DomainTasks,
    EvaluationReport,
    MvpRoadmapWeek,
    PivotSuggestion,
    RadarScores,
    ScoreBreakdown,
    AgentResult,
)
from utils.osiris_verdict import (
    derive_osiris_score,
    derive_radar_scores,
    score_to_osiris_verdict,
)
from utils.parse_json import parse_json
from utils.venture_evaluable import (
    finalize_report,
    scores_from_agents,
    average_agent_score_10,
    judge_score_100,
)

SYNTHESIS_MODEL = "anthropic/claude-sonnet-4-6"
SYNTHESIS_FALLBACK_MODELS = (
    "anthropic/claude-haiku-4-5",
    "openai/gpt-4o-mini",
    "meta-llama/llama-3.1-8b-instruct",
)
MAX_RETRIES = 1

_JUDGE_CORE_PROMPT = (
    "You are The Judge — Osiris's final arbiter. Five specialist evaluators submitted findings. "
    "Synthesize into one authoritative Osiris Evaluation Report. Resolve conflicts, weight evidence, "
    "issue a memorable judge_verdict, and produce an actionable build plan. "
    "Compute osiris_score (0-100) and map to osiris_verdict: Divine Potential (90-100), "
    "Venture Ready (75-89), Promising but Risky (60-74), Needs Refinement (40-59), Reconsider (<40). "
    "Populate radar_scores (market, demand, tech, finance, execution), demand_validation, "
    "an idea-specific 3-week MVP roadmap with elaborated weekly tasks, "
    "and minimum 10 implementation tasks (cursor_tasks) across all domains."
)

SYNTHESIS_SYSTEM_PROMPT = compose_prompt(_JUDGE_CORE_PROMPT, JUDGE_GUARDRAILS)


def build_synthesis_prompt(idea: str, results: list[AgentResult]) -> str:
    yc, tech, biz, mkt, dem = results

    return f"""You are The Judge — Osiris's final arbiter. Five specialist evaluators have submitted findings.
Synthesize them into one authoritative Osiris Evaluation Report.

Original Idea: "{idea}"

IMPORTANT — input may be a long application or document. Extract the CORE PRODUCT (name, problem, solution, key features).
Never paste or echo the full document in roadmap, domain_tasks, or cursor_tasks.
Reference the product by name and build concrete plans for its actual features.

YC Evaluator ({yc.score}/10): {yc.model_dump_json()}
Tech Auditor ({tech.score}/10): {tech.model_dump_json()}
Use Tech Auditor recommended_stack and time_to_mvp when assigning tech_stack on cursor_tasks.
Business CFO ({biz.score}/10): {biz.model_dump_json()}
Marketing ({mkt.score}/10): {mkt.model_dump_json()}
Demand Intel ({dem.score}/10): {dem.model_dump_json()}

Respond ONLY in valid JSON with this EvaluationReport schema:
{{
  "overall_score": number (weighted average 1-10),
  "overall_verdict": string ("strong-yes" | "yes" | "maybe" | "no"),
  "osiris_score": number (0-100 composite venture score),
  "osiris_verdict": string — MUST be one of: "Divine Potential" (90-100), "Venture Ready" (75-89), "Promising but Risky" (60-74), "Needs Refinement" (40-59), "Reconsider" (<40),
  "executive_summary": string (5-7 sentences — synthesize agent findings, resolve conflicts, state verdict rationale),
  "investor_hook": string (one punchy line),
  "biggest_strength": string,
  "critical_risk": string,
  "final_verdict": string,
  "judge_verdict": string (2-3 sentences — The Judge's memorable final ruling),
  "scores": {{ "yc": number, "tech": number, "biz": number, "mkt": number, "demand": number }},
  "radar_scores": {{
    "market": number (0-100),
    "demand": number (0-100),
    "tech": number (0-100),
    "finance": number (0-100),
    "execution": number (0-100)
  }},
  "demand_validation": {{
    "pain_point_severity": string (how acute is the problem?),
    "willingness_to_pay": string (will customers pay, and how much?)
  }},
  "mvp_roadmap": [{{ "week": number, "title": string (must reference the specific startup product by name), "deliverable": string (2-3 sentences — concrete measurable outcome), "tasks": string[] }}] (3 to 10 weeks inclusive — choose week count from Tech Auditor mvp_complexity: low=3-4, medium=5-7, high=8-10; 4-6 elaborated tasks per week),
  "pivot_suggestions": [{{ "title": string, "rationale": string }}],
  "domain_tasks": {{
    "frontend": string[] (3-5 elaborated bullets for THIS idea),
    "backend": string[],
    "ai_ml": string[],
    "design": string[],
    "marketing": string[],
    "business": string[]
  }},
  "cursor_tasks": [{{
    "id": string (e.g. "FE-001", "BE-002"),
    "domain": string ("frontend"|"backend"|"ai_ml"|"design"|"marketing"|"business"),
    "title": string (specific feature for THIS product),
    "description": string (2-4 sentences: what to build, why for THIS product, approach),
    "tech_stack": string[] (libraries/frameworks/services for this task — align with Tech Auditor stack),
    "implementation_steps": string[] (4-8 checkbox-ready steps; include file paths, routes, tables, or components),
    "acceptance_criteria": string[] (3-5 testable criteria),
    "priority": "P0"|"P1"|"P2",
    "sprint": number (1 to N where N equals mvp_roadmap week count — align sprint number with roadmap week)
  }}] (minimum 10 tasks; each must name concrete modules — no generic "improve UI" without specifics)
}}

No markdown fences. No extra text."""


def normalize_report(parsed: dict, results: list[AgentResult]) -> EvaluationReport:
    scores = scores_from_agents(results)
    overall = average_agent_score_10(scores)

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
                    tech_stack=list(item.get("tech_stack") or []),
                    implementation_steps=list(item.get("implementation_steps") or []),
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

    derived_radar = derive_radar_scores(scores)
    radar = derived_radar

    osiris_score = judge_score_100(scores)
    osiris_verdict = score_to_osiris_verdict(osiris_score)

    demand_raw = parsed.get("demand_validation") or {}
    dem_result = results[4] if len(results) > 4 else None
    demand_validation = DemandValidation(
        pain_point_severity=str(
            demand_raw.get("pain_point_severity")
            or (getattr(dem_result, "pain_severity", None) if dem_result else None)
            or "See demand evaluation for details."
        ),
        willingness_to_pay=str(
            demand_raw.get("willingness_to_pay")
            or (getattr(dem_result, "willingness_to_pay", None) if dem_result else None)
            or "Customer payment intent requires validation."
        ),
    )

    judge_verdict = str(
        parsed.get("judge_verdict")
        or parsed.get("final_verdict")
        or overall_verdict
    )

    return EvaluationReport(
        overall_score=round(float(overall), 1),
        overall_verdict=overall_verdict,
        osiris_score=round(float(osiris_score), 1),
        osiris_verdict=osiris_verdict,
        executive_summary=str(parsed.get("executive_summary") or "Evaluation complete."),
        investor_hook=str(
            parsed.get("investor_hook") or "A compelling startup opportunity awaits refinement."
        ),
        biggest_strength=str(parsed.get("biggest_strength") or "Strong foundational concept."),
        critical_risk=str(parsed.get("critical_risk") or "Market validation needed."),
        final_verdict=str(parsed.get("final_verdict") or judge_verdict),
        judge_verdict=judge_verdict,
        scores=scores,
        radar_scores=radar,
        demand_validation=demand_validation,
        mvp_roadmap=mvp_roadmap,
        pivot_suggestions=pivot_suggestions,
        domain_tasks=domain_tasks,
        cursor_tasks=cursor_tasks,
        is_evaluable_venture=True,
    )


def fallback_report(idea: str, results: list[AgentResult]) -> EvaluationReport:
    scores = scores_from_agents(results)
    avg = average_agent_score_10(scores)
    verdict = "yes" if avg >= 7 else "maybe" if avg >= 5 else "no"
    radar = derive_radar_scores(scores)
    osiris_score = judge_score_100(scores)
    osiris_verdict = score_to_osiris_verdict(osiris_score)
    dem = results[4] if len(results) > 4 else None

    return EvaluationReport(
        overall_score=round(avg, 1),
        overall_verdict=verdict,
        osiris_score=osiris_score,
        osiris_verdict=osiris_verdict,
        executive_summary=(
            f'Synthesis agent failed to generate a full report for "{idea[:80]}...". '
            "Individual agent scores are available below."
        ),
        investor_hook="Refine your pitch and retry for a full synthesis report.",
        biggest_strength=str(results[0].summary if results else "See individual agent cards."),
        critical_risk="Synthesis report generation failed — review agent outputs manually.",
        final_verdict=verdict,
        judge_verdict=(
            f"The Judge could not reach a full ruling. Preliminary Osiris score: {osiris_score}/100 "
            f"— {osiris_verdict}."
        ),
        scores=scores,
        radar_scores=radar,
        demand_validation=DemandValidation(
            pain_point_severity=str(getattr(dem, "pain_severity", None) or "Unavailable — retry synthesis."),
            willingness_to_pay=str(
                getattr(dem, "willingness_to_pay", None) or "Unavailable — retry synthesis."
            ),
        ),
    )


async def run_synthesis(idea: str, results: list[AgentResult]) -> EvaluationReport:
    from config import settings

    api_keys = settings.get_synthesis_api_keys_to_try()
    if not api_keys:
        return finalize_report(fallback_report(idea, results), results)

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
                        max_tokens=4096,
                    )
                    if http_error:
                        if any(c in http_error for c in ("401", "402", "404", "429")):
                            break
                        continue

                    parsed = parse_json(raw or "")
                    if parsed:
                        return finalize_report(normalize_report(parsed, results), results)

    return finalize_report(fallback_report(idea, results), results)
