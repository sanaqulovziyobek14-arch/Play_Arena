FROM python:3.12-alpine

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY ./ /app
RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-dev

RUN uv sync

CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]