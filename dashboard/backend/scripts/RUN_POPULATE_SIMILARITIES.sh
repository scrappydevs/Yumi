#!/bin/bash

# Script to populate shared_restaurants, shared_cuisines, and taste_profile_overlap
# in the friend_similarities table

cd "$(dirname "$0")/.."

echo "🚀 Populating Friend Similarity Details..."
echo "=========================================="
echo ""
echo "This will populate:"
echo "  ✓ shared_restaurants (based on user interactions)"
echo "  ✓ shared_cuisines (based on taste profiles)"
echo "  ✓ taste_profile_overlap (atmosphere, flavors, price compatibility)"
echo ""

# Run the Python script
python3 scripts/populate_similarity_details.py "$@"

