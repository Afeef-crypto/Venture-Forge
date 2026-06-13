import pytest

from agents.synthesis import fallback_report, normalize_report
from models.schemas import AgentResult
from utils.osiris_verdict import (
    derive_osiris_score,
    derive_radar_scores,
    score_to_osiris_verdict,
)


def test_score_to_osiris_verdict_tiers():
    assert score_to_osiris_verdict(95) == "Divine Potential"
    assert score_to_osiris_verdict(80) == "Venture Ready"
    assert score_to_osiris_verdict(65) == "Promising but Risky"
    assert score_to_osiris_verdict(50) == "Needs Refinement"
    assert score_to_osiris_verdict(20) == "Reconsider"


def test_derive_radar_scores_from_agents():
    results = [
        AgentResult(score=8, verdict="yes", summary="s", recommendation="r"),
        AgentResult(score=7, verdict="yes", summary="s", recommendation="r"),
        AgentResult(score=6, verdict="maybe", summary="s", recommendation="r"),
        AgentResult(score=7, verdict="yes", summary="s", recommendation="r"),
        AgentResult(score=9, verdict="strong-yes", summary="s", recommendation="r"),
    ]
    report = normalize_report({"executive_summary": "Test summary"}, results)
    assert report.overall_score == 7.4
    assert report.osiris_score > 0
    assert report.osiris_verdict in {
        "Divine Potential",
        "Venture Ready",
        "Promising but Risky",
        "Needs Refinement",
        "Reconsider",
    }
    assert report.radar_scores.market == 75.0
    assert report.radar_scores.demand == 90.0
    assert report.judge_verdict


def test_normalize_report_fills_defaults():
    results = [
        AgentResult(score=8, verdict="yes", summary="s", recommendation="r"),
        AgentResult(score=7, verdict="yes", summary="s", recommendation="r"),
        AgentResult(score=6, verdict="maybe", summary="s", recommendation="r"),
        AgentResult(score=7, verdict="yes", summary="s", recommendation="r"),
        AgentResult(score=9, verdict="strong-yes", summary="s", recommendation="r"),
    ]
    report = normalize_report({"executive_summary": "Test summary"}, results)
    assert report.scores.yc == 8
    assert report.executive_summary == "Test summary"


def test_fallback_report_includes_osiris_fields():
    results = [AgentResult(score=5, verdict="maybe", summary="ok", recommendation="go")] * 5
    report = fallback_report("Test idea", results)
    assert report.osiris_score == derive_osiris_score(report.scores)
    assert report.osiris_verdict == score_to_osiris_verdict(report.osiris_score)
    assert report.radar_scores.tech == 50.0
    assert len(report.hackathon_tips) >= 3
