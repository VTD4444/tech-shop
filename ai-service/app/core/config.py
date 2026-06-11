from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    database_url: str = "postgresql://techshop:techshop_pass@localhost:5432/techshop"
    backend_api_url: str = "http://localhost:3000/api/v1"

    class Config:
        env_file = ".env"

settings = Settings()
