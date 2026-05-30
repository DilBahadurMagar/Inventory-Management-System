from urllib.parse import quote_plus

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str | None = Field(default=None)

    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
    )

    # JWT settings — SECRET_KEY is required, no default (fail-fast if missing)
    jwt_secret_key: str = Field(...)
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30)

    # Environment flag — controls docs visibility, fallback behaviour, etc.
    environment: str = Field(default="development")

    db_host: str | None = Field(default=None)
    db_port: int = Field(default=5432)
    db_name: str = Field(default="postgres")
    db_user: str | None = Field(default=None)
    db_password: str | None = Field(default=None)

    @model_validator(mode="after")
    def require_database_config(self) -> "Settings":
        has_url = bool(self.database_url and self.database_url.strip())
        has_parts = bool(self.db_host and self.db_user and self.db_password)
        if not has_url and not has_parts:
            raise ValueError(
                "Database not configured. "
                "Set DATABASE_URL or DB_HOST + DB_USER + DB_PASSWORD in your .env file."
            )
        return self

    @property
    def resolved_database_url(self) -> str:
        if self.db_host and self.db_user and self.db_password:
            password = quote_plus(self.db_password)
            user = quote_plus(self.db_user, safe=".")
            return (
                f"postgresql://{user}:{password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}"
                "?sslmode=require"
            )
        return (self.database_url or "").strip()

    @property
    def sqlalchemy_database_url(self) -> str:
        """Normalize URL for SQLAlchemy + psycopg2 (Supabase uses postgres://)."""
        url = self.resolved_database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg2://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url


settings = Settings()
