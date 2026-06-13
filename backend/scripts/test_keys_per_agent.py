import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx

from agents.openrouter import call_openrouter
from config import settings

MODELS_TO_TRY = [
    "nvidia/nemotron-nano-9b-v2:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "meta-llama/llama-3.1-8b-instruct",
    "google/gemma-2-9b-it",
    "mistralai/mistral-small-3.2-24b-instruct",
    "anthropic/claude-haiku-4-5",
    "openai/gpt-4o-mini",
    "qwen/qwen-2.5-7b-instruct",
]

AGENTS = ["yc", "tech", "biz", "mkt", "dem"]


async def main() -> None:
    async with httpx.AsyncClient(timeout=90) as client:
        for agent_id in AGENTS:
            key = settings.get_agent_api_key(agent_id)
            print(f"\n--- {agent_id} ---")
            for model in MODELS_TO_TRY:
                try:
                    await call_openrouter(
                        client,
                        api_key=key,
                        model=model,
                        system_prompt="Say ok",
                        user_prompt="ok",
                        max_tokens=10,
                    )
                    print(f"  OK  {model}")
                except Exception as exc:
                    msg = str(exc)
                    if "404" in msg:
                        tag = "404"
                    elif "401" in msg:
                        tag = "401"
                    elif "429" in msg:
                        tag = "429"
                    else:
                        tag = "ERR"
                    print(f"  {tag} {model}")


if __name__ == "__main__":
    asyncio.run(main())
