import os
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import find_dotenv, load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate and strictly load canonical .env file from repository root
_repo_root = Path(__file__).resolve().parent.parent
_candidate_paths = [
    _repo_root / ".env",
    Path.cwd() / ".env",
    Path(__file__).parent / ".env",
]
_env_path = None
for p in _candidate_paths:
    if p.exists():
        _env_path = str(p)
        break

if not _env_path:
    _env_path = str(_repo_root / ".env")

load_dotenv(dotenv_path=_env_path, override=True)


class Settings(BaseSettings):
    """Application configuration strictly loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=_env_path if _env_path else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    APP_NAME: str = "Shark Recovery"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DEBUG_MODE: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///./recovery.db"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Razorpay API Credentials (strictly from .env)
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # SMTP Credentials (strictly from .env)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "recovery@sharkagent.local"

    # Twilio & Telephony Configuration (strictly from .env using API Key & Secret or Account SID & Auth Token)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_API_KEY: str = ""
    TWILIO_API_SECRET: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    TWILIO_WHATSAPP_FROM: str = ""
    
    # Exotel Indian Cloud Telephony (strictly from .env)
    EXOTEL_API_KEY: str = ""
    EXOTEL_API_TOKEN: str = ""
    EXOTEL_SUBDOMAIN: str = ""
    EXOTEL_CALLER_ID: str = ""
    
    # Public Gateway URL for Telephony WebSockets (TwiML / NCCO Stream)
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    # Agent Guardrails (strictly from .env)
    MAX_RETRY_ATTEMPTS: int = 2

    # LLM Configuration (strictly from .env)
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "groq/qwen/qwen3.8-27b"
    GEMINI_LIVE_MODEL: str = "models/gemini-3.1-flash-live-preview"


settings = Settings()


def save_settings_to_env(updates: Dict[str, Optional[str]]) -> None:
    """
    Updates configuration on disk strictly in the canonical root .env file and reloads runtime settings.
    """
    target_env = _env_path if _env_path else str(_repo_root / ".env")
    
    # Read existing lines or create new
    existing_lines: List[str] = []
    if os.path.exists(target_env):
        with open(target_env, "r", encoding="utf-8") as f:
            existing_lines = f.readlines()
        if existing_lines and not existing_lines[-1].endswith("\n"):
            existing_lines[-1] = existing_lines[-1] + "\n"

    # Parse existing keys
    key_line_map: Dict[str, int] = {}
    for idx, line in enumerate(existing_lines):
        clean = line.strip()
        if clean and not clean.startswith("#") and "=" in clean:
            k = clean.split("=", 1)[0].strip().upper()
            key_line_map[k] = idx

    # Apply updates
    for k, v in updates.items():
        if v is None:
            continue
        v_str = str(v)
        upper_k = k.upper()
        formatted_line = f'{upper_k}="{v_str}"\n'
        
        # Set os.environ strictly
        os.environ[upper_k] = v_str

        if upper_k in key_line_map:
            existing_lines[key_line_map[upper_k]] = formatted_line
        else:
            existing_lines.append(formatted_line)

    # Write back to .env
    with open(target_env, "w", encoding="utf-8") as f:
        f.writelines(existing_lines)

    # Reload settings singleton in-place so all imported references are updated immediately
    load_dotenv(dotenv_path=target_env, override=True)
    new_settings = Settings()
    for field_name in Settings.model_fields.keys():
        if hasattr(new_settings, field_name):
            setattr(settings, field_name, getattr(new_settings, field_name))
