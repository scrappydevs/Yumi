"""
Test script for iOS-optimized discover endpoints.
Tests both /api/restaurants/discover-ios and /api/restaurants/search-ios
"""
import requests
import os
import time

# Get auth token from environment
AUTH_TOKEN = os.getenv("YUMMY_AUTH_TOKEN")
if not AUTH_TOKEN:
    print("❌ Error: YUMMY_AUTH_TOKEN environment variable not set")
    print("Please set it with: export YUMMY_AUTH_TOKEN='your_token_here'")
    exit(1)

# Base URL
BASE_URL = "https://unsliding-deena-unsportful.ngrok-free.dev"

# Test location (Pittsburgh, PA - CMU area)
LATITUDE = 40.4406
LONGITUDE = -79.9959

print("="*80)
print("TESTING iOS-OPTIMIZED ENDPOINTS")
print("="*80)
print(f"Base URL: {BASE_URL}")
print(f"Location: Pittsburgh ({LATITUDE}, {LONGITUDE})")
print(f"Auth Token: {AUTH_TOKEN[:20]}...")
print("="*80)

# Test 1: discover-ios endpoint
print("\n" + "="*80)
print("TEST 1: /api/restaurants/discover-ios")
print("="*80)

url = f"{BASE_URL}/api/restaurants/discover-ios"
headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}"
}
data = {
    "latitude": LATITUDE,
    "longitude": LONGITUDE
}

print(f"\n🚀 Sending request to {url}")
print(f"📍 Location: ({LATITUDE}, {LONGITUDE})")

start_time = time.time()
try:
    response = requests.post(url, headers=headers, data=data, timeout=120)
    elapsed = time.time() - start_time
    
    print(f"\n⏱️  Response time: {elapsed:.2f}s")
    print(f"📊 Status code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ SUCCESS!")
        print(f"\n📋 Results:")
        print(f"  Status: {result.get('status')}")
        print(f"  Restaurants returned: {len(result.get('restaurants', []))}")
        
        if result.get('reasoning'):
            print(f"\n💭 Reasoning: {result['reasoning'][:200]}...")
        
        print(f"\n🍽️  Restaurants:")
        for i, r in enumerate(result.get('restaurants', []), 1):
            print(f"\n  {i}. {r.get('name')}")
            print(f"     Cuisine: {r.get('cuisine')}")
            print(f"     Rating: {r.get('rating')}⭐ ({r.get('user_ratings_total', 0)} reviews)")
            print(f"     Address: {r.get('address', 'N/A')[:60]}...")
            if r.get('reasoning'):
                print(f"     Match: {r.get('reasoning')}")
    else:
        print(f"\n❌ ERROR: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
except Exception as e:
    elapsed = time.time() - start_time
    print(f"\n❌ Exception after {elapsed:.2f}s: {str(e)}")

# Test 2: search-ios endpoint
print("\n\n" + "="*80)
print("TEST 2: /api/restaurants/search-ios")
print("="*80)

url = f"{BASE_URL}/api/restaurants/search-ios"
test_queries = [
    "best italian food",
    "sushi near me",
    "casual lunch spot"
]

for query in test_queries:
    print(f"\n{'─'*80}")
    print(f"🔍 Query: '{query}'")
    print(f"{'─'*80}")
    
    data = {
        "query": query,
        "latitude": LATITUDE,
        "longitude": LONGITUDE
    }
    
    print(f"\n🚀 Sending request to {url}")
    
    start_time = time.time()
    try:
        response = requests.post(url, headers=headers, data=data, timeout=120)
        elapsed = time.time() - start_time
        
        print(f"\n⏱️  Response time: {elapsed:.2f}s")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ SUCCESS!")
            print(f"\n📋 Results:")
            print(f"  Status: {result.get('status')}")
            print(f"  Top restaurants: {len(result.get('top_restaurants', []))}")
            
            if result.get('reasoning'):
                print(f"\n💭 Reasoning: {result['reasoning'][:200]}...")
            
            print(f"\n🍽️  Top Restaurants:")
            for i, r in enumerate(result.get('top_restaurants', []), 1):
                print(f"\n  {i}. {r.get('name')}")
                print(f"     Cuisine: {r.get('cuisine')}")
                print(f"     Rating: {r.get('rating')}⭐ ({r.get('user_ratings_total', 0)} reviews)")
                if r.get('match_score'):
                    print(f"     Match Score: {r.get('match_score'):.2f}")
                if r.get('reasoning'):
                    print(f"     Why: {r.get('reasoning')}")
        else:
            print(f"\n❌ ERROR: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n❌ Exception after {elapsed:.2f}s: {str(e)}")

print("\n" + "="*80)
print("TESTING COMPLETE")
print("="*80)
