import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """
    Настройки приложения.
    
    Критичные переменные (SECRET_KEY, POSTGRES_PASSWORD) должны быть
    установлены в окружении. Отсутствие этих переменных вызовет ошибку
    при запуске приложения в продакшене.
    """
    
    # -------------------------------------------
    # PostgreSQL Database
    # -------------------------------------------
    POSTGRES_HOST: str
    POSTGRES_PORT: str = "5432"
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "survey_service"

    @property
    def DATABASE_URL(self) -> str:
        """Формирует URL для подключения к PostgreSQL."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # -------------------------------------------
    # JWT Authentication
    # -------------------------------------------
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 дней

    # -------------------------------------------
    # Application URLs
    # -------------------------------------------
    BASE_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def validate_security_settings(self) -> None:
        """
        Валидация критичных настроек безопасности для production режима.
        Вызывается только при ENVIRONMENT=production.
        """
        errors = []
        
        # Проверка SECRET_KEY (минимум 32 символа)
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            errors.append(
                "SECRET_KEY must be at least 32 characters long. "
                f"Current length: {len(self.SECRET_KEY) if self.SECRET_KEY else 0}. "
                "Generate with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        
        # Проверка POSTGRES_PASSWORD (минимум 16 символов)
        if not self.POSTGRES_PASSWORD or len(self.POSTGRES_PASSWORD) < 16:
            errors.append(
                "POSTGRES_PASSWORD must be at least 16 characters long. "
                f"Current length: {len(self.POSTGRES_PASSWORD) if self.POSTGRES_PASSWORD else 0}. "
                "Generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        
        # Проверка BASE_URL (не должен быть localhost в production)
        if "localhost" in self.BASE_URL or "127.0.0.1" in self.BASE_URL:
            errors.append(
                f"BASE_URL should not be localhost in production. Current: {self.BASE_URL}. "
                "Set to your actual domain (e.g., https://your-domain.com)"
            )
        
        if errors:
            raise ValueError("Security validation failed:\n" + "\n".join(errors))


settings = Settings()

# Валидация только в production режиме
if os.getenv("ENVIRONMENT", "development") == "production":
    settings.validate_security_settings()
