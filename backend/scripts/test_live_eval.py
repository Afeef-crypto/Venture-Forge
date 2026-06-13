"""Quick live evaluation smoke test."""
import time
import httpx

IDEA = (
    "Osiris: a web app that runs five AI evaluators in parallel to score startup ideas, "
    "then The Judge synthesizes an Osiris verdict with radar scores and cursor-ready tasks."
)

print("Calling POST /api/evaluate (live — may take 1-2 min)...")
t0 = time.time()
r = httpx.post(
    "http://127.0.0.1:8000/api/evaluate",
    json={"idea": IDEA},
    timeout=300.0,
)
r.raise_for_status()
data = r.json()
report = data["report"]
agents = data["agent_results"]

print(f"Completed in {time.time() - t0:.1f}s")
print(f"Agents: {len(agents)}")
for i, a in enumerate(agents):
    print(f"  {i}: score={a.get('score')} verdict={a.get('verdict')} error={a.get('error', False)}")

print(f"Osiris: {report.get('osiris_score')}/100 — {report.get('osiris_verdict')}")
print(f"Judge: {(report.get('judge_verdict') or '')[:150]}")
rdr = report.get("radar_scores", {})
print(
    f"Radar: M={rdr.get('market')} D={rdr.get('demand')} T={rdr.get('tech')} "
    f"F={rdr.get('finance')} E={rdr.get('execution')}"
)
dv = report.get("demand_validation", {})
print(f"Pain: {str(dv.get('pain_point_severity', ''))[:100]}")
print(f"WTP: {str(dv.get('willingness_to_pay', ''))[:100]}")
print(f"Cursor tasks: {len(report.get('cursor_tasks') or [])}")

assert len(agents) == 5
assert report.get("osiris_score", 0) > 0
assert report.get("osiris_verdict")
assert report.get("judge_verdict")
print("PASS: live evaluation OK")
