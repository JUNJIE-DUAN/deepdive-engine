#!/bin/bash

# YouTube Subtitle Export - Quick Test Script
# This script tests the YouTube subtitle export endpoints

API_BASE="http://localhost:4000/api/v1/youtube"
VIDEO_ID="dQw4w9WgXcQ"  # Replace with a valid YouTube video ID with subtitles

echo "================================"
echo "YouTube Subtitle Export Testing"
echo "================================"
echo ""

# Test 1: Get single transcript
echo "Test 1: Fetching single transcript..."
curl -s "${API_BASE}/transcript/${VIDEO_ID}" | jq '.' > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ Single transcript endpoint working"
else
  echo "✗ Single transcript endpoint failed"
fi
echo ""

# Test 2: Get bilingual subtitles
echo "Test 2: Fetching bilingual subtitles..."
curl -s -X POST "${API_BASE}/subtitles" \
  -H "Content-Type: application/json" \
  -d "{\"videoId\":\"${VIDEO_ID}\"}" | jq '.' > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ Bilingual subtitles endpoint working"
else
  echo "✗ Bilingual subtitles endpoint failed"
fi
echo ""

# Test 3: Export PDF (requires subtitles first)
echo "Test 3: Testing PDF export..."
echo "Note: This will save a test PDF to test-export.pdf"

# First fetch subtitles
SUBTITLES=$(curl -s -X POST "${API_BASE}/subtitles" \
  -H "Content-Type: application/json" \
  -d "{\"videoId\":\"${VIDEO_ID}\"}")

# Check if we got subtitles
if echo "$SUBTITLES" | jq -e '.english' > /dev/null 2>&1; then
  echo "✓ Subtitles fetched successfully"

  # Extract data for PDF export
  TITLE=$(echo "$SUBTITLES" | jq -r '.title')
  ENGLISH=$(echo "$SUBTITLES" | jq '.english')
  CHINESE=$(echo "$SUBTITLES" | jq '.chinese')

  # Export to PDF
  curl -s -X POST "${API_BASE}/export-pdf" \
    -H "Content-Type: application/json" \
    -d "{
      \"videoId\":\"${VIDEO_ID}\",
      \"title\":\"${TITLE}\",
      \"englishSubtitles\":${ENGLISH},
      \"chineseSubtitles\":${CHINESE},
      \"options\":{
        \"format\":\"bilingual-side\",
        \"includeTimestamps\":true,
        \"includeVideoUrl\":true,
        \"includeMetadata\":true
      }
    }" \
    --output test-export.pdf

  if [ -f "test-export.pdf" ] && [ -s "test-export.pdf" ]; then
    echo "✓ PDF export successful - saved to test-export.pdf"
    echo "  File size: $(wc -c < test-export.pdf) bytes"
  else
    echo "✗ PDF export failed"
  fi
else
  echo "✗ Failed to fetch subtitles for PDF export test"
fi

echo ""
echo "================================"
echo "Testing complete!"
echo "================================"
