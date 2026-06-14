"""Detect evaluable startup ideas and derive Judge scores from specialist agents."""

from __future__ import annotations

from models.schemas import AgentResult, DomainTasks, EvaluationReport, ScoreBreakdown
from utils.osiris_verdict import derive_radar_scores, score_to_osiris_verdict

_NON_IDEA_PHRASES = (
    "not an evaluable",
    "not a startup",
    "non-evaluable",
    "non evaluable",
    "no product",
    "no clear product",
    "not evaluable",
    "lacks a concrete startup",
    "lacking a concrete",
    "no venture concept",
    "not a venture",
    "cannot evaluate this submission",
    "declines to rule",
    "insufficient relevance",
    "lacks sufficient",
    "without a clear product",
    "no market",
    "not describable",
    "off-topic",
    "non-evaluable startup",
)

_AGENT_IDS = ("yc", "tech", "biz", "mkt", "dem")


def scores_from_agents(results: list[AgentResult]) -> ScoreBreakdown:
    def _score(i: int) -> float:
        if i < len(results):
            return float(results[i].score or 0)
        return 0.0

    return ScoreBreakdown(
        yc=_score(0),
        tech=_score(1),
        biz=_score(2),
        mkt=_score(3),
        demand=_score(4),
    )


def average_agent_score_10(scores: ScoreBreakdown) -> float:
    return (scores.yc + scores.tech + scores.biz + scores.mkt + scores.demand) / 5


def judge_score_100(scores: ScoreBreakdown) -> float:
    """Judge / Osiris display score = simple average of five specialists (0–100)."""
    return round(average_agent_score_10(scores) * 10, 1)


def agents_indicate_non_idea(results: list[AgentResult]) -> tuple[bool, str]:
    valid = [r for r in results if not r.error]
    if len(valid) < 3:
        return False, ""

    scores = [float(r.score or 0) for r in valid]
    avg = sum(scores) / len(scores)

    text_hits = 0
    for result in valid:
        blob = f"{result.summary} {result.recommendation}".lower()
        if any(phrase in blob for phrase in _NON_IDEA_PHRASES):
            text_hits += 1

    no_verdicts = sum(1 for r in valid if r.verdict == "no")

    if text_hits >= 3:
        return True, "Multiple evaluators determined this is not a startup or product idea."

    if avg <= 2.0:
        return True, "Specialist scores are unanimously low — no venture concept to evaluate."

    if no_verdicts >= 4 and avg <= 4.0:
        return True, "A majority of evaluators rejected this input as a startup idea."

    if text_hits >= 2 and avg <= 4.0:
        return True, "Evaluators could not identify a clear product, customer, or market to assess."

    if avg <= 3.0 and no_verdicts >= 3:
        return True, "Input appears insufficient or irrelevant as a startup idea."

    return False, ""


def strip_venture_plans(report: EvaluationReport) -> EvaluationReport:
    report.mvp_roadmap = []
    report.cursor_tasks = []
    report.domain_tasks = DomainTasks()
    return report


def apply_agent_consensus_scores(
    report: EvaluationReport,
    results: list[AgentResult],
) -> EvaluationReport:
    """Judge score and verdict always derive from the five specialist agents."""
    scores = scores_from_agents(results)
    avg_10 = average_agent_score_10(scores)
    osiris = judge_score_100(scores)
    radar = derive_radar_scores(scores)

    report.scores = scores
    report.overall_score = round(avg_10, 1)
    report.osiris_score = osiris
    report.osiris_verdict = score_to_osiris_verdict(osiris)
    report.radar_scores = radar
    return report


def finalize_report(
    report: EvaluationReport,
    results: list[AgentResult],
    *,
    force_non_idea: bool = False,
    non_idea_reason: str = "",
) -> EvaluationReport:
    report = apply_agent_consensus_scores(report, results)

    is_non = force_non_idea or agents_indicate_non_idea(results)[0]
    if is_non:
        reason = non_idea_reason or agents_indicate_non_idea(results)[1]
        report = strip_venture_plans(report)
        report.overall_verdict = "no"
        report.osiris_verdict = score_to_osiris_verdict(report.osiris_score)
        if reason and reason not in (report.judge_verdict or ""):
            report.judge_verdict = (
                f"The Judge declines to issue a build plan. {reason} "
                "Submit a concrete startup pitch: who you serve, what problem you solve, and what you are building."
            )
        report.is_evaluable_venture = False
    else:
        report.is_evaluable_venture = True

    return report
