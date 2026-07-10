import os
from pathlib import Path

from dotenv import dotenv_values
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"
    database_url: str = "postgresql://techshop:techshop_pass@localhost:5432/techshop"
    backend_api_url: str = "http://localhost:3000/api/v1"
    frontend_url: str = "http://localhost:3001"
    ai_internal_api_key: str = ""

    model_config = SettingsConfigDict(env_file=str(ENV_FILE))

    @field_validator("gemini_api_key", "ai_internal_api_key")
    @classmethod
    def strip_secrets(cls, value: str) -> str:
        return value.strip()


def api_key_from_env_file() -> str:
    if not ENV_FILE.exists():
        return ""
    return (dotenv_values(ENV_FILE).get("GEMINI_API_KEY") or "").strip()


def api_key_from_process_env() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


def resolve_gemini_api_key() -> tuple[str, str]:
    file_key = api_key_from_env_file()
    if file_key:
        return file_key, "ai-service/.env"

    process_key = api_key_from_process_env()
    if process_key:
        return process_key, "process environment"

    return load_settings().gemini_api_key, "settings"


def gemini_key_override_warning() -> str | None:
    file_key = api_key_from_env_file()
    process_key = api_key_from_process_env()
    if file_key and process_key and file_key != process_key:
        return (
            "Ignoring GEMINI_API_KEY from Windows/shell environment; "
            "using ai-service/.env instead."
        )
    return None


def load_settings() -> Settings:
    return Settings()


settings = load_settings()
