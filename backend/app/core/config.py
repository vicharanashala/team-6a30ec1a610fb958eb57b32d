import os
from pydantic_settings import BaseSettings

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.abspath(os.path.join(current_dir, "..", "..", ".env"))

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    GEMINI_API_KEY: str = ""   # Empty string default so the app starts without Gemini configured
    PORT: int = 8000

    class Config:
        env_file = env_path
        extra = "ignore"

settings = Settings()
