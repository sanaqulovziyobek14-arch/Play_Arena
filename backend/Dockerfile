FROM python:3.12-alpine

WORKDIR /app

RUN pip install --no-cache-dir uv

RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-dev

COPY pyproject.toml uv.lock ./
RUN uv sync

COPY ./ /app

CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]