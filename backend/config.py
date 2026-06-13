import re
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent
DEFAULT_EXPORT_DIR = BACKEND_ROOT.parent
UPLOAD_DIR = "uploads"
MAX_UPLOAD_SIZE_MB = 20

AGENT_KEY_IDS = ("yc", "tech", "biz", "mkt", "dem")
SYNTHESIS_KEY_ID = "synthesis"

_PLACEHOLDER_KEY = re.compile(
    r"x{4,}|your[_-]?key|example|changeme|sk-or-xxx",
    re.IGNORECASE,
)


def is_usable_api_key(key: str | None) -> bool:
    if not key or not key.strip():
        return False
    return not _PLACEHOLDER_KEY.search(key.strip())


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Fallback used when a per-agent key is not set
    openrouter_api_key: str = ""

    openrouter_key_yc: str = ""
    openrouter_key_tech: str = ""
    openrouter_key_biz: str = ""
    openrouter_key_mkt: str = ""
    openrouter_key_dem: str = ""
    openrouter_key_synthesis: str = ""

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    rate_limit_seconds: int = 30
    export_dir: str = ""

    @property
    def export_path(self) -> Path:
        raw = (self.export_dir or "").strip()
        return Path(raw).resolve() if raw else DEFAULT_EXPORT_DIR.resolve()

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def _agent_key_field(self, agent_id: str) -> str:
        return {
            "yc": self.openrouter_key_yc,
            "tech": self.openrouter_key_tech,
            "biz": self.openrouter_key_biz,
            "mkt": self.openrouter_key_mkt,
            "dem": self.openrouter_key_dem,
        }.get(agent_id, "")

    def _env_name_for_agent(self, agent_id: str) -> str:
        return f"OPENROUTER_KEY_{agent_id.upper()}"

    def get_agent_api_key(self, agent_id: str) -> str:
        """Primary resolved key (agent-specific, else global)."""
        keys = self.get_agent_api_keys_to_try(agent_id)
        return keys[0] if keys else ""

    def get_agent_api_keys_to_try(self, agent_id: str) -> list[str]:
        """Ordered keys: valid per-agent key first, then valid global fallback."""
        keys: list[str] = []
        agent_key = self._agent_key_field(agent_id)
        if is_usable_api_key(agent_key):
            keys.append(agent_key.strip())
        if is_usable_api_key(self.openrouter_api_key):
            global_key = self.openrouter_api_key.strip()
            if global_key not in keys:
                keys.append(global_key)
        return keys

    def get_synthesis_api_keys_to_try(self) -> list[str]:
        keys: list[str] = []
        if is_usable_api_key(self.openrouter_key_synthesis):
            keys.append(self.openrouter_key_synthesis.strip())
        if is_usable_api_key(self.openrouter_api_key):
            global_key = self.openrouter_api_key.strip()
            if global_key not in keys:
                keys.append(global_key)
        return keys

    def get_synthesis_api_key(self) -> str:
        keys = self.get_synthesis_api_keys_to_try()
        return keys[0] if keys else ""

    def is_agent_key_configured(self, agent_id: str) -> bool:
        return bool(self.get_agent_api_keys_to_try(agent_id))

    def is_synthesis_key_configured(self) -> bool:
        return bool(self.get_synthesis_api_keys_to_try())

    def agent_keys_status(self) -> dict[str, bool]:
        status = {agent_id: self.is_agent_key_configured(agent_id) for agent_id in AGENT_KEY_IDS}
        status[SYNTHESIS_KEY_ID] = self.is_synthesis_key_configured()
        return status

    def all_keys_ready(self) -> bool:
        return all(self.agent_keys_status().values())


settings = Settings()
