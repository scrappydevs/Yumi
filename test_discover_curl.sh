#!/bin/bash
# Quick test script for the discover endpoint
# Usage: ./test_discover_curl.sh YOUR_JWT_TOKEN

if [ -z "$1" ]; then
    echo "Usage: ./test_discover_curl.sh YOUR_JWT_TOKEN"
    echo ""
    echo "Get your JWT token by:"
    echo "1. Open the iOS app or web frontend"
    echo "2. Sign in"
    echo "3. Check browser dev tools (Application > Local Storage) or iOS keychain"
    exit 1
fi

JWT_TOKEN="$1"

echo "=================================="
echo "🌟 Testing Discover Endpoint"
echo "=================================="
echo ""

curl -X POST http://localhost:8000/api/restaurants/discover \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "latitude=40.4406" \
  -F "longitude=-79.9959" \
  | python3 -m json.tool

echo ""
echo "=================================="
