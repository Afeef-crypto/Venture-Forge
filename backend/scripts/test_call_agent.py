import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx

from agents.agent_config import AGENTS
from agents.openrouter import call_agent

IDEA = (
    "Osiris: a web app that runs five AI agents in parallel to evaluate "
    "startup ideas and produce an investor-ready report."
)


async def main() -> None:
    async with httpx.AsyncClient(timeout=120) as client:
        for agent in AGENTS:
            result = await call_agent(client, agent, IDEA)
            status = "OK" if not result.error else "ERR"
            print(f"{agent.id:5} {status} score={result.score} verdict={result.verdict}")
            if result.error:
                print(f"       {result.summary[:160]}")


if __name__ == "__main__":
    asyncio.run(main())
