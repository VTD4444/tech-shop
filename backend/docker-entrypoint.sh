#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
  if [ "$RUN_SEED" = "true" ]; then
    echo "Running Prisma seed..."
    npx prisma db seed
  fi
else
  echo "DATABASE_URL not set — skipping migrations"
fi

exec node dist/main.js
