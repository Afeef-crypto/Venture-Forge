"""Extract plain text from uploaded pitch documents."""

from __future__ import annotations

import io
from pathlib import Path

MAX_EXTRACTED_CHARS = 8000

TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".html", ".css", ".py", ".js", ".ts", ".json", ".xml", ".yaml", ".yml"}
BINARY_TEXT_EXTENSIONS = {".pdf", ".docx"}


def _clip(text: str) -> str | None:
    cleaned = text.strip()
    if not cleaned:
        return None
    if len(cleaned) > MAX_EXTRACTED_CHARS:
        return cleaned[:MAX_EXTRACTED_CHARS]
    return cleaned


def _extract_pdf(content: bytes) -> str | None:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        parts: list[str] = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        return _clip("\n".join(parts))
    except Exception:
        return None


def _extract_docx(content: bytes) -> str | None:
    try:
        from docx import Document

        doc = Document(io.BytesIO(content))
        parts = [p.text for p in doc.paragraphs if p.text.strip()]
        return _clip("\n".join(parts))
    except Exception:
        return None


def _extract_plain(content: bytes) -> str | None:
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("utf-8", errors="replace")
    return _clip(text)


def extract_text_from_bytes(content: bytes, ext: str) -> str | None:
    ext = ext.lower()
    if ext in TEXT_EXTENSIONS:
        return _extract_plain(content)
    if ext == ".pdf":
        return _extract_pdf(content)
    if ext == ".docx":
        return _extract_docx(content)
    return None


def is_extractable_extension(ext: str) -> bool:
    ext = ext.lower()
    return ext in TEXT_EXTENSIONS or ext in BINARY_TEXT_EXTENSIONS
