from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["agents"] == 5
    assert "keys_configured" in data
    assert set(data["keys_configured"].keys()) == {"yc", "tech", "biz", "mkt", "dem", "synthesis"}


def test_evaluate_requires_min_length():
    response = client.post("/api/evaluate", json={"idea": "short"})
    assert response.status_code == 422
