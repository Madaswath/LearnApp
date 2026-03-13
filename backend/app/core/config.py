from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LearnApp"
    api_prefix: str = "/api/v1"
    openai_api_key: str = ""
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"
    sqlite_db_path: str = "storage/app.db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
