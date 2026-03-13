from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    app_name: str = "Lumina AI"
    api_prefix: str = "/api/v1"
    openai_api_key: Optional[str] = None
    debug: bool = False
    # SQLite3 database file path (relative to backend/ or absolute)
    db_path: str = "storage/lumina.db"
    # Restrict to specific origins in production; defaults to wildcard for development
    allowed_origins: List[str] = ["*"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
