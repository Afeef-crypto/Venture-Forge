from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable

import httpx

from agents.agent_config import AGENTS
from agents.openrouter import call_agent
from models.schemas import AgentResult


def _fallback_error(agent_id: str, message: str) -> AgentResult:
    return AgentResult(
        score=0,
        verdict="error",
        summary=f"Agent failed: {message}",
        recommendation="Retry the evaluation.",
        error=True,
        agent_id=agent_id,
        tags=[],
    )


async def run_all_agents(
    idea: str,
    on_agent_complete: Callable[[int, AgentResult], Awaitable[None] | None] | None = None,
) -> list[AgentResult]:
    async with httpx.AsyncClient(timeout=90.0) as client:

        async def run_one(index: int) -> AgentResult:
            agent = AGENTS[index]
            try:
                result = await call_agent(client, agent, idea)
            except Exception as exc:  # noqa: BLE001
                result = _fallback_error(agent.id, str(exc))

            if on_agent_complete:
                maybe_coro = on_agent_complete(index, result)
                if asyncio.iscoroutine(maybe_coro):
                    await maybe_coro
            return result

        return list(await asyncio.gather(*(run_one(i) for i in range(len(AGENTS)))))
