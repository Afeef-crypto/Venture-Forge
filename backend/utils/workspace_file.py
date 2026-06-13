"""Read pitch files from the local workspace when the browser only receives a path."""

from __future__ import annotations

from pathlib import Path
from urllib.parse import unquote

from fastapi import HTTPException

from utils.document_extract import extract_text_from_bytes, is_extractable_extension

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


def _normalize_path(raw: str) -> Path:
    cleaned = raw.strip().strip('"').strip("'")
    if cleaned.lower().startswith("file://"):
        cleaned = unquote(cleaned[7:])
        if cleaned.startswith("/") and len(cleaned) > 2 and cleaned[2] == ":":
            cleaned = cleaned[1:]

    path = Path(cleaned)
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    return path.resolve()


def read_workspace_pitch_file(path_str: str) -> dict[str, str | int | None]:
    if not path_str.strip():
        raise HTTPException(status_code=400, detail="No file path provided")

    resolved = _normalize_path(path_str)
    root = PROJECT_ROOT.resolve()

    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise HTTPException(
            status_code=403,
            detail="Only files inside the Venture-Forge project can be loaded.",
        ) from exc

    if not resolved.is_file():
        raise HTTPException(status_code=404, detail=f"File not found: {resolved.name}")

    ext = resolved.suffix.lower()
    if not is_extractable_extension(ext):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot extract text from {ext} files yet. Use .md, .txt, .pdf, or .docx.",
        )

    content = resolved.read_bytes()
    text = extract_text_from_bytes(content, ext)
    if not text:
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract readable text from {resolved.name}.",
        )

    stat = resolved.stat()
    return {
        "original_name": resolved.name,
        "stored_name": resolved.name,
        "size_bytes": stat.st_size,
        "content_type": "text/plain",
        "extracted_text": text,
        "workspace_path": str(resolved),
    }
