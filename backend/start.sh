#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting DeepDive Backend deployment..."

# Step 1: Run migrations and seed
echo "📦 Step 1: Running migrations and seed..."
npm run deploy

# Check if deploy succeeded
if [ $? -ne 0 ]; then
  echo "❌ Deploy failed!"
  exit 1
fi

echo "✅ Deploy completed successfully!"

# Step 2: Start production server
echo "🌟 Step 2: Starting production server..."
npm run start:prod

# This line should never be reached since start:prod keeps running
echo "❌ Server exited unexpectedly!"
exit 1
