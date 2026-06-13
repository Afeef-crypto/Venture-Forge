"""End-to-end smoke test — run from backend/: python scripts/test_e2e.py"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx

IDEA = (
    "Osiris: a web app that runs five AI evaluators in parallel to score startup ideas, "
    "then The Judge synthesizes an Osiris verdict with radar scores and cursor-ready tasks."
)
BASE = "http://127.0.0.1:8000"


async def test_health(client: httpx.AsyncClient) -> None:
    r = await client.get(f"{BASE}/api/health")
    r.raise_for_status()
    data = r.json()
    print(f"Health: {data['status']} | agents={data['agents']} | keys_ready={data['all_keys_ready']}")
    assert data["status"] == "ok"


async def test_evaluate_json(client: httpx.AsyncClient) -> None:
    print("\n--- POST /api/evaluate (live OpenRouter) ---")
    r = await client.post(f"{BASE}/api/evaluate", json={"idea": IDEA}, timeout=300.0)
    r.raise_for_status()
    data = r.json()
    report = data["report"]
    agents = data["agent_results"]
    print(f"Agents returned: {len(agents)}")
    for i, a in enumerate(agents):
        print(f"  [{i}] score={a.get('score')} verdict={a.get('verdict')} error={a.get('error', False)}")
    print(f"\nOsiris score: {report.get('osiris_score')}/100")
    print(f"Osiris verdict: {report.get('osiris_verdict')}")
    print(f"Judge: {(report.get('judge_verdict') or '')[:120]}...")
    radar = report.get("radar_scores") or {}
    print(f"Radar: market={radar.get('market')} demand={radar.get('demand')} tech={radar.get('tech')} "
          f"finance={radar.get('finance')} execution={radar.get('execution')}")
    dv = report.get("demand_validation") or {}
    print(f"Demand validation: pain={str(dv.get('pain_point_severity', ''))[:80]}")
    print(f"Cursor tasks: {len(report.get('cursor_tasks') or [])}")
    assert len(agents) == 5
    assert report.get("osiris_score", 0) > 0
    assert report.get("osiris_verdict")
    assert report.get("judge_verdict")
    assert radar.get("market") is not None


async def test_evaluate_stream(client: httpx.AsyncClient) -> None:
    print("\n--- POST /api/evaluate/stream (SSE) ---")
    events: list[str] = []
    agent_count = 0
    has_report = False

    async with client.stream(
        "POST",
        f"{BASE}/api/evaluate/stream",
        json={"idea": IDEA},
        timeout=300.0,
    ) as response:
        response.raise_for_status()
        event_type = None
        async for line in response.aiter_lines():
            if line.startswith("event:"):
                event_type = line.split(":", 1)[1].strip()
            elif line.startswith("data:") and event_type:
                payload = json.loads(line.split(":", 1)[1].strip())
                events.append(event_type)
                if event_type == "agent_complete":
                    agent_count += 1
                    print(f"  agent_complete #{payload.get('index')} ({payload.get('agent_id')})")
                elif event_type == "synthesis_complete":
                    has_report = True
                    report = payload.get("report", {})
                    print(f"  synthesis_complete osiris={report.get('osiris_score')} "
                          f"verdict={report.get('osiris_verdict')}")
                elif event_type == "done":
                    print("  done")
                event_type = None

    print(f"SSE events: {events}")
    assert agent_count == 5
    assert has_report
    assert "done" in events


async def main() -> None:
    async with httpx.AsyncClient() as client:
        await test_health(client)
        await test_evaluate_json(client)
        # Rate limit may block second run — wait if needed
        await asyncio.sleep(31)
        await test_evaluate_stream(client)
    print("\n✓ E2E smoke test passed")


if __name__ == "__main__":
    asyncio.run(main())
