import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from utils.document_extract import extract_text_from_bytes, is_extractable_extension

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".jpg",
    ".jpeg",
    ".png",
    ".xlsx",
    ".csv",
    ".ppt",
    ".pptx",
    ".zip",
    ".rar",
    ".mp3",
    ".mp4",
    ".py",
    ".js",
    ".ts",
    ".html",
    ".css",
}


async def save_upload(file: UploadFile) -> dict[str, str | int | None]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")

    content = await file.read()
    extracted_text = extract_text_from_bytes(content, ext)

    stored_name = f"{uuid.uuid4().hex}_{file.filename}"
    path = UPLOAD_DIR / stored_name
    path.write_bytes(content)

    return {
        "original_name": file.filename,
        "stored_name": stored_name,
        "size_bytes": len(content),
        "content_type": file.content_type,
        "extracted_text": extracted_text,
    }
