import pytest
from pydantic_settings import SettingsConfigDict

from config import Settings, is_usable_api_key


def test_is_usable_api_key_rejects_placeholders():
    assert is_usable_api_key("sk-or-xxxxxxxxxxxxxxxxxxxx") is False
    assert is_usable_api_key("") is False
    assert is_usable_api_key("sk-or-v1-realkey") is True


def test_per_agent_key_fallback_to_global():
    s = Settings(
        _env_file=None,
        openrouter_api_key="global-key",
        openrouter_key_yc="yc-key",
        openrouter_key_tech="",
        openrouter_key_biz="",
        openrouter_key_mkt="",
        openrouter_key_dem="",
        openrouter_key_synthesis="",
    )
    assert s.get_agent_api_key("yc") == "yc-key"
    assert s.get_agent_api_key("tech") == "global-key"
    assert s.get_agent_api_key("biz") == "global-key"
    assert s.get_agent_api_keys_to_try("yc") == ["yc-key", "global-key"]


def test_synthesis_key_fallback():
    s = Settings(
        _env_file=None,
        openrouter_api_key="global-key",
        openrouter_key_synthesis="",
    )
    assert s.get_synthesis_api_key() == "global-key"

    s2 = Settings(
        _env_file=None,
        openrouter_api_key="global-key",
        openrouter_key_synthesis="synth-key",
    )
    assert s2.get_synthesis_api_key() == "synth-key"


def test_agent_keys_status():
    s = Settings(
        _env_file=None,
        openrouter_api_key="global",
        openrouter_key_yc="yc-only",
        openrouter_key_synthesis="synth",
    )
    status = s.agent_keys_status()
    assert status["yc"] is True
    assert status["tech"] is True
    assert status["synthesis"] is True
    assert s.all_keys_ready() is True
