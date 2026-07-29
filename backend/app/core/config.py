from __future__ import annotations

from typing import Any, List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "AutoReply AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/autoreply"
    REDIS_URL: str = ""
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    VECTOR_DB_TYPE: str = "pinecone"
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_ENVIRONMENT: Optional[str] = None
    PINECONE_INDEX_NAME: str = "autoreply"
    QDRANT_URL: Optional[str] = None

    SENTRY_DSN: Optional[str] = None

    CORS_ORIGINS: str = "http://localhost:3000"

    WEBHOOK_SECRET: Optional[str] = None

    @field_validator("DATABASE_URL")
    @classmethod
    def ensure_async_driver(cls, v: str) -> str:
        if v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters long. "
                "Generate one with: openssl rand -hex 32"
            )
        if v in ("your-secret-key-change-in-production-min-32-chars", "change-me", "secret"):
            raise ValueError(
                "SECRET_KEY must be changed from the default value. "
                "Generate a secure random key with: openssl rand -hex 32"
            )
        return v

    @field_validator("OPENAI_API_KEY")
    @classmethod
    def validate_openai_key(cls, v: str) -> str:
        if v and v.startswith("sk-") and v != "sk-your-openai-api-key":
            return v
        if v and v != "sk-your-openai-api-key":
            return v
        if not v:
            return v
        raise ValueError(
            "OPENAI_API_KEY appears to be a placeholder. Set a valid OpenAI API key."
        )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""
    RATE_LIMIT: str = "100/minute"

    AI_QUALITY_THRESHOLD: float = 0.85
    SAFETY_SCORE_THRESHOLD: float = 0.90
    ENABLE_AUDIT_LOG: bool = True
    DEFAULT_TENANT_PLAN: str = "starter"

    MAX_REQUEST_BODY_SIZE: int = 10_000_000

    @property
    def compute_redis_url(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        if self.CELERY_BROKER_URL:
            return self.CELERY_BROKER_URL
        return "redis://localhost:6379/0"


settings = Settings()
