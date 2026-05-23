FROM python:3.11.9-slim

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:${PATH}"

WORKDIR /home/user/app

# Копируем требования и устанавливаем их
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Копируем всё содержимое вашего репозитория в папку /home/user/app
COPY --chown=user . .

# Запуск (укажите ваш путь к приложению)
# Если main.py в корне, то "main:app". Если в папке app, то "app.main:app"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]