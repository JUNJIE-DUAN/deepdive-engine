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
echo "🌱 Running database seed..."
if npm run prisma:seed; then
    echo "✅ Seed completed successfully!"
else
    echo "⚠️  Seed failed, but continuing..."
fi

echo ""
echo "✅ Starting application..."
exec node dist/main
