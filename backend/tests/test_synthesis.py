import pytest
from unittest.mock import AsyncMock, patch

from agents.synthesis import fallback_report, normalize_report
from models.schemas import AgentResult, ScoreBreakdown


def test_normalize_report_fills_defaults():
    results = [
        AgentResult(score=8, verdict="yes", summary="s", recommendation="r"),
        AgentResult(score=7, verdict="yes", summary="s", recommendation="r"),
        AgentResult(score=6, verdict="maybe", summary="s", recommendation="r"),
        AgentResult(score=7, verdict="yes", summary="s", recommendation="r"),
        AgentResult(score=9, verdict="strong-yes", summary="s", recommendation="r"),
    ]
    report = normalize_report({"executive_summary": "Test summary"}, results)
    assert report.overall_score == 7.4
    assert report.scores.yc == 8
    assert report.executive_summary == "Test summary"


def test_fallback_report():
    results = [AgentResult(score=5, verdict="maybe", summary="ok", recommendation="go")] * 5
    report = fallback_report("Test idea", results)
    assert report.overall_score == 5.0
    assert len(report.hackathon_tips) >= 3
