from __future__ import annotations

"""
Bollard MCP — Configuration & Settings

Loaded from environment variables or .env file.
No secrets are stored in code.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="BOLLARD_",
        case_sensitive=False,
        extra="ignore",
    )

    # Server
    server_name: str = Field(default="Bollard Database MCP", description="MCP server display name")
    debug: bool = Field(default=False, description="Enable debug logging")

    # Query Safety Defaults
    default_max_rows: int = Field(default=1000, description="Auto-LIMIT for SELECT queries")
    default_query_timeout: int = Field(default=30, description="Query timeout in seconds")
    default_max_cost: float = Field(default=100_000.0, description="Max estimated query cost before warning")

    # State Persistence
    session_history_limit: int = Field(default=100, description="Max queries kept in history per connection")
    schema_cache_ttl: int = Field(default=300, description="Schema cache TTL in seconds (5 min)")

    # Credential Storage
    credential_backend: str = Field(
        default="auto",
        description="'auto' (keyring → encrypted fallback), 'keyring', or 'encrypted'",
    )
    # Only used if credential_backend = 'encrypted'
    encryption_key: str | None = Field(default=None, description="Base64 Fernet key for encrypted fallback")

    # Optional AI Module (disabled by default)
    ai_enabled: bool = Field(default=False, description="Enable embedded optional AI module")
    ai_provider: str = Field(default="anthropic", description="'anthropic' or 'nvidia_nim'")
    anthropic_api_key: str | None = Field(default=None)
    nvidia_nim_api_key: str | None = Field(default=None)
    nvidia_nim_base_url: str = Field(default="https://integrate.api.nvidia.com/v1")


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
