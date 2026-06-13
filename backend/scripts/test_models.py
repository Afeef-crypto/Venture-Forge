"""Quick OpenRouter model smoke test — run from backend/: python scripts/test_models.py"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx

from agents.agent_config import AGENTS
from agents.openrouter import call_openrouter
from config import settings
from utils.parse_json import parse_json

SYSTEM = (
    'You are a test agent. Respond ONLY with valid JSON: '
    '{"score": 7, "verdict": "yes", "summary": "ok", "recommendation": "go", "tags": []}'
)


async def main() -> None:
    idea = "A mobile app for dog walkers."
    async with httpx.AsyncClient(timeout=90) as client:
        for agent in AGENTS:
            key = settings.get_agent_api_key(agent.id)
            print(f"\n=== {agent.id} ({agent.model}) ===")
            try:
                raw = await call_openrouter(
                    client,
                    api_key=key,
                    model=agent.model,
                    system_prompt=agent.system_prompt,
                    user_prompt=agent.build_prompt(idea),
                    max_tokens=400,
                )
                if not raw:
                    print("  FAIL: empty response (missing key?)")
                    continue
                parsed = parse_json(raw)
                if parsed and "score" in parsed:
                    print(f"  OK: score={parsed.get('score')} verdict={parsed.get('verdict')}")
                else:
                    print(f"  FAIL: JSON parse failed")
                    print(f"  raw preview: {raw[:200]!r}")
            except Exception as exc:
                print(f"  ERR: {exc}")


if __name__ == "__main__":
    asyncio.run(main())
