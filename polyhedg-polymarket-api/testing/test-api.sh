#!/bin/bash

# Test script for Polymarket API
# Make sure the server is running: uvicorn app.main:app --reload

API_URL="http://127.0.0.1:8000"

echo "=========================================="
echo "Testing Polymarket API"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check (GET /)"
echo "-------------------------------------------"
curl -s "${API_URL}/" | jq '.'
echo ""
echo ""

# Test 2: Count Events (default folder)
echo "2. Testing Count Events - Default Folder (GET /events/count)"
echo "-------------------------------------------"
curl -s "${API_URL}/events/count" | jq '.'
echo ""
echo ""

# Test 3: Count Events (custom folder)
echo "3. Testing Count Events - Custom Folder (GET /events/count?folder_path=./data/res)"
echo "-------------------------------------------"
curl -s "${API_URL}/events/count?folder_path=./data/res" | jq '.'
echo ""
echo ""

# Test 4: Filter by Tags - Business & Fed
echo "4. Testing Filter by Tags - Business & Fed (POST /events/filter-by-tags)"
echo "-------------------------------------------"
curl -s -X POST "${API_URL}/events/filter-by-tags" \
  -H "Content-Type: application/json" \
  -d '{
    "target_tags": ["Business", "Fed"]
  }' | jq '{total_events_processed, total_matched, files_processed, matched_events: .matched_events[:2]}'
echo ""
echo ""

# Test 5: Filter by Tags - Economic Policy
echo "5. Testing Filter by Tags - Economic Policy (POST /events/filter-by-tags)"
echo "-------------------------------------------"
curl -s -X POST "${API_URL}/events/filter-by-tags" \
  -H "Content-Type: application/json" \
  -d '{
    "target_tags": ["Economic Policy"],
    "input_folder": "./data/res"
  }' | jq '{total_events_processed, total_matched, files_processed}'
echo ""
echo ""

# Test 6: Filter by Multiple Tags
echo "6. Testing Filter by Multiple Tags (POST /events/filter-by-tags)"
echo "-------------------------------------------"
curl -s -X POST "${API_URL}/events/filter-by-tags" \
  -H "Content-Type: application/json" \
  -d '{
    "target_tags": ["Business", "Fed", "Economic Policy", "Politics"]
  }' | jq '{total_events_processed, total_matched, files_processed}'
echo ""
echo ""

# Test 7: Error Case - Empty Tags
echo "7. Testing Error Case - Empty Tags (POST /events/filter-by-tags)"
echo "-------------------------------------------"
curl -s -X POST "${API_URL}/events/filter-by-tags" \
  -H "Content-Type: application/json" \
  -d '{
    "target_tags": []
  }' | jq '.'
echo ""
echo ""

# Test 8: Error Case - Invalid Folder
echo "8. Testing Error Case - Invalid Folder (GET /events/count)"
echo "-------------------------------------------"
curl -s "${API_URL}/events/count?folder_path=./invalid/path" | jq '.'
echo ""
echo ""

echo "=========================================="
echo "Testing Complete"
echo "=========================================="
