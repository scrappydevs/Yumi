"""
Test script for restaurant database service.

This tests the new database-based restaurant search before integrating it
into the main search service.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.restaurant_db_service import get_restaurant_db_service


def test_nearby_restaurants():
    """Test finding nearby restaurants."""
    print("\n" + "="*80)
    print("TEST 1: Get Nearby Restaurants in Cambridge (Harvard Square)")
    print("="*80)
    
    service = get_restaurant_db_service()
    
    # Cambridge/Harvard Square coordinates (where the data actually is)
    latitude = 42.3736
    longitude = -71.1190
    
    restaurants = service.get_nearby_restaurants(
        latitude=latitude,
        longitude=longitude,
        radius_meters=2000,  # 2km radius
        limit=10
    )
    
    print(f"\n✅ Found {len(restaurants)} restaurants")
    
    if restaurants:
        print("\n📍 Top 5 Results:")
        for i, r in enumerate(restaurants[:5], 1):
            distance_km = r['distance_meters'] / 1000
            print(f"\n{i}. {r['name']}")
            print(f"   Cuisine: {r['cuisine']}")
            print(f"   Rating: {r['rating']} ({r['user_ratings_total']} reviews)")
            print(f"   Address: {r['address']}")
            print(f"   Distance: {distance_km:.2f} km")
            if r.get('price_level'):
                print(f"   Price Level: {'$' * r['price_level']}")
    else:
        print("❌ No restaurants found!")
    
    return len(restaurants) > 0


def test_cuisine_search():
    """Test searching by cuisine."""
    print("\n" + "="*80)
    print("TEST 2: Search for Italian Restaurants in Cambridge")
    print("="*80)
    
    service = get_restaurant_db_service()
    
    # Cambridge/Harvard Square coordinates
    latitude = 42.3736
    longitude = -71.1190
    
    restaurants = service.search_by_cuisine(
        latitude=latitude,
        longitude=longitude,
        cuisine_types=['Italian', 'Pizza'],
        radius_meters=3000,  # 3km radius
        limit=10
    )
    
    print(f"\n✅ Found {len(restaurants)} Italian restaurants")
    
    if restaurants:
        print("\n🍝 Results:")
        for i, r in enumerate(restaurants[:5], 1):
            distance_km = r['distance_meters'] / 1000
            print(f"\n{i}. {r['name']}")
            print(f"   Cuisine: {r['cuisine']}")
            print(f"   Rating: {r['rating']}")
            print(f"   Distance: {distance_km:.2f} km")
    else:
        print("❌ No Italian restaurants found!")
    
    return len(restaurants) > 0


def test_city_extraction():
    """Test extracting city from address."""
    print("\n" + "="*80)
    print("TEST 3: Extract City from Address")
    print("="*80)
    
    service = get_restaurant_db_service()
    
    test_addresses = [
        "1 Brattle St, Cambridge, MA 02138, USA",
        "123 Main St, Boston, MA 02108, USA",
        "456 Park Ave, New York, NY 10022, USA",
        "Invalid Address"
    ]
    
    for addr in test_addresses:
        city = service.extract_city_from_address(addr)
        print(f"Address: {addr}")
        print(f"City: {city}\n")
    
    return True


def test_empty_results():
    """Test handling of empty results (middle of ocean)."""
    print("\n" + "="*80)
    print("TEST 4: Empty Results (Middle of Atlantic Ocean)")
    print("="*80)
    
    service = get_restaurant_db_service()
    
    # Middle of Atlantic Ocean
    latitude = 30.0
    longitude = -40.0
    
    restaurants = service.get_nearby_restaurants(
        latitude=latitude,
        longitude=longitude,
        radius_meters=5000,
        limit=10
    )
    
    print(f"\n✅ Correctly returned {len(restaurants)} restaurants (should be 0)")
    
    return len(restaurants) == 0


def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("🧪 RESTAURANT DATABASE SERVICE TESTS")
    print("="*80)
    
    tests = [
        ("Nearby Restaurants", test_nearby_restaurants),
        ("Cuisine Search", test_cuisine_search),
        ("City Extraction", test_city_extraction),
        ("Empty Results", test_empty_results),
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
    print("📊 TEST SUMMARY")
    print("="*80)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    
    print(f"\nPassed: {passed_count}/{total_count}")
    
    if passed_count == total_count:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n⚠️  Some tests failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())

