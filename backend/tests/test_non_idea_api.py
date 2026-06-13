from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_evaluate_rejects_general_question_without_llm(monkeypatch):
    called = {"agents": False, "synthesis": False}

    async def fake_run_all_agents(*_args, **_kwargs):
        called["agents"] = True
        return []

    async def fake_run_synthesis(*_args, **_kwargs):
        called["synthesis"] = True
        return None

    monkeypatch.setattr("main.run_all_agents", fake_run_all_agents)
    monkeypatch.setattr("main.run_synthesis", fake_run_synthesis)

    response = client.post(
        "/api/evaluate",
        json={"idea": "What is the weather like in Paris today?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert called["agents"] is False
    assert called["synthesis"] is False
    assert data["report"]["overall_verdict"] == "no"
    assert data["report"]["osiris_score"] <= 10
    assert len(data["agent_results"]) == 5
    assert all(r["score"] == 1.0 for r in data["agent_results"])
