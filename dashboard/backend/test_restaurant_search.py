"""
Test script for restaurant search service.
Tests each stage incrementally.
"""
import asyncio
import sys
import os

# Add parent directory to path so we can import from services
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.restaurant_search_service import get_restaurant_search_service
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


async def test_stage_1():
    """
    Stage 1: Test that tool functions work correctly.
    - Get user preferences
    - Get nearby restaurants
    """
    print("=" * 60)
    print("🧪 STAGE 1: Testing Tool Functions")
    print("=" * 60)
    
    # Initialize service
    search_service = get_restaurant_search_service()
    
    # Test data - use a real user ID from your database
    test_user_id = "test-user-id-here"  # Replace with actual user ID from profiles table
    test_query = "Italian restaurant with outdoor seating"
    
    # New York City coordinates (Times Square)
    test_latitude = 40.7580
    test_longitude = -73.9855
    
    print(f"\n📍 Test Query: '{test_query}'")
    print(f"📍 Location: ({test_latitude}, {test_longitude})")
    print(f"👤 User ID: {test_user_id}")
    
    print("\n" + "-" * 60)
    print("🔧 Step 1: Testing get_user_preferences_tool")
    print("-" * 60)
    
    preferences = search_service.get_user_preferences_tool(test_user_id)
    print(f"✅ Preferences retrieved:")
    print(f"   - Cuisines: {preferences.get('cuisines', [])}")
    print(f"   - Price Range: {preferences.get('priceRange', 'N/A')}")
    print(f"   - Atmosphere: {preferences.get('atmosphere', [])}")
    print(f"   - Flavor Notes: {preferences.get('flavorNotes', [])}")
    
    print("\n" + "-" * 60)
    print("🔧 Step 2: Testing get_nearby_restaurants_tool")
    print("-" * 60)
    
    restaurants = search_service.get_nearby_restaurants_tool(
        latitude=test_latitude,
        longitude=test_longitude,
        radius=1000,
        limit=10
    )
    
    print(f"✅ Found {len(restaurants)} restaurants:")
    for i, restaurant in enumerate(restaurants[:5], 1):  # Show first 5
        print(f"\n   {i}. {restaurant.get('name', 'Unknown')}")
        print(f"      - Cuisine: {restaurant.get('cuisine', 'N/A')}")
        print(f"      - Rating: {restaurant.get('rating', 'N/A')}")
        print(f"      - Address: {restaurant.get('address', 'N/A')}")
    
    if len(restaurants) > 5:
        print(f"\n   ... and {len(restaurants) - 5} more")
    
    print("\n" + "-" * 60)
    print("🔧 Step 3: Testing full search_restaurants method")
    print("-" * 60)
    
    results = await search_service.search_restaurants(
        query=test_query,
        user_id=test_user_id,
        latitude=test_latitude,
        longitude=test_longitude
    )
    
    print(f"\n✅ Search completed! Stage: {results.get('stage')}")
    print(f"   - Status: {results.get('status')}")
    print(f"   - Query: {results.get('query')}")
    print(f"   - User Preferences: {len(results.get('user_preferences', {}))} keys")
    print(f"   - Nearby Restaurants: {len(results.get('nearby_restaurants', []))} found")
    
    print("\n" + "=" * 60)
    print("✅ STAGE 1 COMPLETE: All tool functions working!")
    print("=" * 60)
    print("\n💡 Next: Add Gemini function calling (Stage 4)")
    
    return results


async def test_stage_4():
    """
    Stage 4: Test LLM function calling (implement after Stage 1 passes).
    """
    print("=" * 60)
    print("🧪 STAGE 4: Testing LLM Function Calling")
    print("=" * 60)
    print("⚠️  Not implemented yet - run test_stage_1 first!")
    print("=" * 60)


if __name__ == "__main__":
    print("\n🚀 Restaurant Search Service - Incremental Testing\n")
    
    # Run Stage 1 tests
    try:
        asyncio.run(test_stage_1())
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

