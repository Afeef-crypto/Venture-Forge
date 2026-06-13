import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx

from agents.openrouter import call_openrouter
from config import settings

CANDIDATES = [
    "mistralai/mistral-7b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "google/gemma-2-9b-it:free",
    "google/gemma-3-12b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "mistralai/mixtral-8x7b-instruct:free",
    "qwen/qwen-2.5-7b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "nvidia/nemotron-nano-9b-v2:free",
]


async def main() -> None:
    key = settings.openrouter_api_key
    async with httpx.AsyncClient(timeout=90) as client:
        for model in CANDIDATES:
            try:
                raw = await call_openrouter(
                    client,
                    api_key=key,
                    model=model,
                    system_prompt="Reply hi",
                    user_prompt="hi",
                    max_tokens=20,
                )
                print(f"OK  {model}")
            except Exception as exc:
                print(f"ERR {model}: {str(exc)[:100]}")


if __name__ == "__main__":
    asyncio.run(main())
