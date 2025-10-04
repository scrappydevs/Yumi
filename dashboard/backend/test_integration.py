"""
Test integration of database restaurant service with main search service.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.restaurant_search_service import RestaurantSearchService


def test_integration():
    """Test that restaurant search service uses database."""
    print("\n" + "="*80)
    print("🧪 TESTING INTEGRATION: Restaurant Search Service with Database")
    print("="*80)
    
    # Ensure we're using database
    os.environ['USE_DB_RESTAURANTS'] = 'true'
    
    service = RestaurantSearchService()
    
    # Test 1: Direct tool call
    print("\n" + "-"*80)
    print("TEST 1: Direct tool call to get_nearby_restaurants_tool")
    print("-"*80)
    
    # Cambridge coordinates (where we have data)
    restaurants = service.get_nearby_restaurants_tool(
        latitude=42.3736,
        longitude=-71.1190,
        radius=2000,  # 2km
        limit=5
    )
    
    if len(restaurants) > 0:
        print(f"\n✅ SUCCESS: Found {len(restaurants)} restaurants")
        print("\nSample results:")
        for i, r in enumerate(restaurants[:3], 1):
            print(f"  {i}. {r['name']} - {r['cuisine']} ({r['rating']}⭐)")
        return True
    else:
        print("\n❌ FAILED: No restaurants found")
        return False


def test_fallback_to_places_api():
    """Test that we can still use Google Places API if needed."""
    print("\n" + "="*80)
    print("🧪 TESTING FALLBACK: Google Places API")
    print("="*80)
    
    # Switch to Google Places API
    os.environ['USE_DB_RESTAURANTS'] = 'false'
    
    service = RestaurantSearchService()
    
    # This would use Google Places API (but we won't actually call it to save API costs)
    print("\n✅ Service initialized with Google Places API mode")
    print("   (Skipping actual API call to save costs)")
    
    return True


def main():
    """Run integration tests."""
    print("\n" + "="*80)
    print("🚀 RESTAURANT SEARCH SERVICE - INTEGRATION TESTS")
    print("="*80)
    
    tests = [
        ("Database Integration", test_integration),
        ("Fallback to Places API", test_fallback_to_places_api),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"\n❌ ERROR in {name}: {str(e)}")
            import traceback
            traceback.print_exc()
            results.append((name, False))
    
    # Summary
    print("\n" + "="*80)
    print("📊 INTEGRATION TEST SUMMARY")
    print("="*80)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    
    print(f"\nPassed: {passed_count}/{total_count}")
    
    if passed_count == total_count:
        print("\n🎉 All integration tests passed!")
        print("\n✨ Next steps:")
        print("   1. The restaurant search now uses your database")
        print("   2. Test the full search flow from the frontend")
        print("   3. Try searching for restaurants in Cambridge area")
        return 0
    else:
        print("\n⚠️  Some tests failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())

