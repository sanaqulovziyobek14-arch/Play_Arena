FROM ghcr.io/astral-sh/uv:alpine

WORKDIR /app
COPY . /app

RUN uv sync

CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]