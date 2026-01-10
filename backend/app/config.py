from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "Academic Quoting Validator"
    debug: bool = False

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/academic_validator"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Anthropic
    anthropic_api_key: str = ""

    # File storage
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 50

    # Auth
    secret_key: str = "change-this-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
