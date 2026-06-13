import pytest
from unittest.mock import AsyncMock, patch

from agents.orchestrator import run_all_agents
from models.schemas import AgentResult


@pytest.mark.asyncio
async def test_run_all_agents_returns_five_results():
    mock_result = AgentResult(
        score=7,
        verdict="yes",
        summary="Good idea",
        recommendation="Ship MVP",
    )

    with patch("agents.orchestrator.call_agent", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = mock_result
        results = await run_all_agents("A test startup idea for evaluation purposes.")

    assert len(results) == 5
    assert all(r.score == 7 for r in results)
    assert mock_call.await_count == 5


@pytest.mark.asyncio
async def test_run_all_agents_handles_individual_failure():
    good = AgentResult(score=8, verdict="yes", summary="ok", recommendation="go")
    bad = AgentResult(score=0, verdict="error", summary="failed", recommendation="retry", error=True)

    async def side_effect(client, agent, idea):  # noqa: ARG001
        if agent.id == "tech":
            return bad
        return good

    with patch("agents.orchestrator.call_agent", side_effect=side_effect):
        results = await run_all_agents("Another test startup idea here.")

    assert len(results) == 5
    assert results[1].error is True
    assert results[0].score == 8
