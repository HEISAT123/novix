import os
import bcrypt
from jose import jwt
from datetime import datetime, timedelta

# Настройки JWT
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080 # 7 дней

def get_password_hash(password: str) -> str:
    """Хеширование пароля напрямую через bcrypt (без passlib)"""
    # bcrypt ожидает байты, поэтому кодируем строку
    pwd_bytes = password.encode('utf-8')
    # Генерируем соль и хешируем
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    # Возвращаем строку для записи в базу данных
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля напрямую через bcrypt"""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    """Создание JWT токена"""
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable is not set")

    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Заглушка для обратной совместимости, если где-то импортируется pwd_context
class PasswordContext:
    def hash(self, password: str): return get_password_hash(password)
    def verify(self, plain, hashed): return verify_password(plain, hashed)

pwd_context = PasswordContext()