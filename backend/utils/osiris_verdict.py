"""Osiris Verdict System — maps 0–100 scores to tier labels."""

from models.schemas import RadarScores, ScoreBreakdown

VERDICT_TIERS: tuple[tuple[float, str], ...] = (
    (90, "Divine Potential"),
    (75, "Venture Ready"),
    (60, "Promising but Risky"),
    (40, "Needs Refinement"),
    (0, "Reconsider"),
)


def score_to_osiris_verdict(score: float) -> str:
    for threshold, label in VERDICT_TIERS:
        if score >= threshold:
            return label
    return "Reconsider"


def _axis(score: float) -> float:
    return round(min(100.0, max(0.0, score * 10)), 1)


def derive_radar_scores(scores: ScoreBreakdown) -> RadarScores:
    return RadarScores(
        market=round((scores.yc + scores.mkt) / 2 * 10, 1),
        demand=_axis(scores.demand),
        tech=_axis(scores.tech),
        finance=_axis(scores.biz),
        execution=round((scores.tech + scores.mkt + scores.biz) / 3 * 10, 1),
    )


def derive_osiris_score(scores: ScoreBreakdown, radar: RadarScores | None = None) -> float:
    axes = radar or derive_radar_scores(scores)
    avg = (axes.market + axes.demand + axes.tech + axes.finance + axes.execution) / 5
    return round(avg, 1)
