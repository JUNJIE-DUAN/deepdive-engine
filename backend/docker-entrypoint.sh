#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed. Starting application..."
exec node dist/main
