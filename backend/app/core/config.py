from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    OPENAI_API_KEY: str
    GOOGLE_APPLICATION_CREDENTIALS: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REDIS_URL: str
    ELASTICSEARCH_URL: str
    
    class Config:
        env_file = ".env"

settings = Settings()

