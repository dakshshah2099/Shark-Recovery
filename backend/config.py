from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "AI Revenue Recovery Agent"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DEBUG_MODE: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///./recovery.db"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Razorpay API Credentials
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # SMTP Credentials
    SMTP_HOST: str = "smtp.mailtrap.io"
    SMTP_PORT: int = 2525
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "recovery@sharkagent.local"

    # Twilio WhatsApp Credentials
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"  # Default Twilio WhatsApp Sandbox number

    # Agent Guardrails
    MAX_RETRY_ATTEMPTS: int = 2

    # LLM Configuration (LiteLLM supports Groq, Gemini, OpenAI, etc.)
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "groq/llama-3.3-70b-versatile"


settings = Settings()
