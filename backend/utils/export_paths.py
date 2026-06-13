from __future__ import annotations

from pathlib import Path


def build_editor_urls(path: Path) -> dict[str, str]:
    """Build editor protocol URLs for a saved file (Windows + POSIX)."""
    resolved = path.resolve()
    uri_path = resolved.as_posix()
    encoded = uri_path.replace(" ", "%20")
    return {
        "cursor": f"cursor://file/{encoded}",
        "vscode": f"vscode://file/{encoded}",
        "windsurf": f"windsurf://file/{encoded}",
    }
