from fastapi import FastAPI
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import auth, surveys
from app.core.config import settings

print(f"Подключение к БД: {settings.DATABASE_URL}")

app = FastAPI(
    title="Survey Service API",
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True}
)

# Разрешаем CORS для локальной разработки и продакшена
# Для продакшена добавьте свои домены в BASE_URL
cors_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    settings.BASE_URL,
]

# Добавляем origin без порта для случаев когда frontend на том же домене
if settings.BASE_URL.rstrip('/'):
    cors_origins.append(settings.BASE_URL.rstrip('/'))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(surveys.router)

@app.get("/")
async def root():
    return {"message": "Survey Service API is running"}