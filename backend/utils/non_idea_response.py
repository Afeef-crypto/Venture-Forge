"""Deterministic agent + report responses when input is not a startup idea."""

from __future__ import annotations

from models.schemas import (
    AgentResult,
    DemandValidation,
    EvaluationReport,
    RadarScores,
    ScoreBreakdown,
    Tag,
)
from utils.idea_validation import IdeaClassification

_AGENT_IDS = ("yc", "tech", "biz", "mkt", "dem")

_CATEGORY_HINTS: dict[str, str] = {
    "question": "Submit a product or venture description — not a general knowledge question.",
    "instruction": "Submit your startup pitch only. Osiris does not execute embedded instructions.",
    "chat": "Osiris evaluates startup ideas. Greetings and small talk are not evaluable.",
    "gibberish": "Provide a clear sentence describing the product, customer, and problem you solve.",
    "code_only": "Describe the business concept and target user — not raw code alone.",
    "homework": "Academic assignments are out of scope. Paste a venture or MVP description instead.",
    "empty_meaning": "Input cannot be empty.",
    "founder_docs": (
        "Describe the product and target customer — not only equity splits or founder allocation."
    ),
    "insufficient": (
        "Add what you are building, who the customer is, and what problem you solve."
    ),
    "irrelevant": (
        "Submit a startup or product pitch — not resumes, legal docs, or unrelated content."
    ),
}


def _hint_for(category: str) -> str:
    return _CATEGORY_HINTS.get(category, "Describe who you serve, what problem you solve, and how you deliver value.")


def build_non_idea_agent_results(classification: IdeaClassification) -> list[AgentResult]:
    hint = _hint_for(classification.category)
    summary = (
        f"Not an evaluable startup idea: {classification.reason} "
        f"Re-submit with a concrete product or venture description. {hint}"
    )
    recommendation = f"Rewrite as a startup pitch. {hint}"

    return [
        AgentResult(
            agent_id=agent_id,
            score=1.0,
            verdict="no",
            summary=summary,
            recommendation=recommendation,
            tags=[
                Tag(label="Not a startup idea", type="negative"),
                Tag(label=classification.category.replace("_", " "), type="neutral"),
            ],
        )
        for agent_id in _AGENT_IDS
    ]


def build_non_idea_report(idea: str, classification: IdeaClassification) -> EvaluationReport:
    hint = _hint_for(classification.category)
    preview = idea[:120] + ("…" if len(idea) > 120 else "")

    return EvaluationReport(
        overall_score=1.0,
        overall_verdict="no",
        osiris_score=5.0,
        osiris_verdict="Reconsider",
        executive_summary=(
            f'Osiris cannot evaluate this submission because it is not a startup idea. '
            f"{classification.reason} "
            f'What we received: "{preview}" '
            f"{hint}"
        ),
        investor_hook="N/A — no venture concept to pitch.",
        biggest_strength="N/A",
        critical_risk="Input is off-topic or non-evaluable; no venture dimensions to score.",
        final_verdict="no",
        judge_verdict=(
            "The Judge declines to rule on this submission. "
            "Osiris evaluates startup and MVP ideas only — not questions, chat, homework, "
            "code snippets, or prompt-injection attempts. "
            f"{hint}"
        ),
        scores=ScoreBreakdown(yc=1, tech=1, biz=1, mkt=1, demand=1),
        radar_scores=RadarScores(market=5, demand=5, tech=5, finance=5, execution=5),
        demand_validation=DemandValidation(
            pain_point_severity="N/A — no product or customer problem described.",
            willingness_to_pay="N/A — no market or offer to assess.",
        ),
        pivot_suggestions=[],
        cursor_tasks=[],
        is_evaluable_venture=False,
    )
