#!/bin/sh
set -e

echo "================================"
echo "Starting DeepDive Backend..."
echo "================================"

echo ""
echo "🔄 Running database migrations..."
if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration failed with exit code $?"
    exit 1
fi

echo ""
echo "✅ Starting application..."
exec node dist/main
