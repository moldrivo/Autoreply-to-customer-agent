#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 4 --limit-max-requests 10000 --timeout-graceful-shutdown 30
