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


def test_export_markdown_writes_file(tmp_path, monkeypatch):
    from config import settings

    monkeypatch.setattr(settings, "export_dir", str(tmp_path))
    content = "# Osiris\n\nTest report content for editor open."
    response = client.post(
        "/api/export/markdown",
        json={"content": content, "filename": "osiris-report.md"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "osiris-report.md"
    assert "cursor" in data["editor_urls"]
    assert "vscode" in data["editor_urls"]
    assert (tmp_path / "osiris-report.md").read_text(encoding="utf-8") == content
