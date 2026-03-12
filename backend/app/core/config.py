from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Lumina AI"
    api_prefix: str = "/api/v1"
    openai_api_key: str = ""
    supabase_url: str = ""
    supabase_anon_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
