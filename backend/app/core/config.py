from pydantic_settings import BaseSettings, SettingsConfigDict

"""
Centraliza as configurações da aplicação.
"""
class Settings(BaseSettings):
    app_name: str = "ForgeHub API"
    app_version: str = "1.0.0"
    debug: bool = False

    database_url: str

    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()