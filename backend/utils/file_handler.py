import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".txt",
    ".jpg", ".jpeg", ".png",
    ".xlsx", ".csv",
    ".ppt", ".pptx",
    ".zip", ".rar",
    ".mp3", ".mp4",
    ".py", ".js", ".ts",
    ".html", ".css"
}

async def save_upload(file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {ext} not allowed"
        )

    stored_name = f"{uuid.uuid4().hex}_{file.filename}"
    path = UPLOAD_DIR / stored_name

    content = await file.read()

    with open(path, "wb") as f:
        f.write(content)

    return {
        "original_name": file.filename,
        "stored_name": stored_name,
        "size_bytes": len(content),
        "content_type": file.content_type
    }