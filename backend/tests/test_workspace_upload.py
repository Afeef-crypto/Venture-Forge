from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_upload_workspace_readme():
    response = client.post(
        "/api/upload/workspace",
        json={"path": r"E:\Venture-Forge\README.md"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["original_name"] == "README.md"
    assert data["extracted_text"]
    assert "Osiris" in data["extracted_text"] or len(data["extracted_text"]) > 50


def test_upload_workspace_rejects_outside_project():
    response = client.post(
        "/api/upload/workspace",
        json={"path": r"C:\Windows\System32\drivers\etc\hosts"},
    )
    assert response.status_code == 403
