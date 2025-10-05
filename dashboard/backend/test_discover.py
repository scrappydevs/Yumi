#!/usr/bin/env python3
"""
Test script for /api/restaurants/discover endpoint.
Tests the new Discover feature that returns 2 personalized restaurant recommendations.
"""
import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")
TEST_USER_ID = os.getenv("TEST_USER_ID", "")
TEST_JWT_TOKEN = os.getenv("TEST_JWT_TOKEN", "")

# Test location (CMU campus)
TEST_LATITUDE = 40.4406
TEST_LONGITUDE = -79.9959

def test_discover_endpoint():
    """Test the discover endpoint with a real user."""
    print("\n" + "="*80)
    print("🌟 TESTING /api/restaurants/discover ENDPOINT")
    print("="*80)
    
    if not TEST_JWT_TOKEN:
        print("❌ ERROR: TEST_JWT_TOKEN not set in .env file")
        print("Please set TEST_JWT_TOKEN with a valid JWT token")
        return False
    
    url = f"{BASE_URL}/api/restaurants/discover"
    
    headers = {
        "Authorization": f"Bearer {TEST_JWT_TOKEN}"
    }
    
    data = {
        "latitude": TEST_LATITUDE,
        "longitude": TEST_LONGITUDE
    }
    
    print(f"\n📍 Location: ({TEST_LATITUDE}, {TEST_LONGITUDE})")
    print(f"🔗 URL: {url}")
    print(f"🔑 Token: {TEST_JWT_TOKEN[:20]}...")
    print("\n⏳ Sending request...")
    
    try:
        response = requests.post(url, headers=headers, data=data, timeout=60)
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n✅ SUCCESS!")
            print("="*80)
            
            # Print restaurants
            restaurants = result.get('restaurants', [])
            print(f"\n🍽️  Found {len(restaurants)} Recommendations:\n")
            
            for i, restaurant in enumerate(restaurants, 1):
                print(f"{i}. {restaurant.get('name', 'Unknown')}")
                if restaurant.get('cuisine'):
                    print(f"   Cuisine: {restaurant['cuisine']}")
                if restaurant.get('rating'):
                    print(f"   Rating: {restaurant['rating']} ⭐")
                if restaurant.get('distance'):
                    print(f"   Distance: {restaurant['distance']}")
                if restaurant.get('description'):
                    print(f"   Description: {restaurant['description']}")
                if restaurant.get('address'):
                    print(f"   Address: {restaurant['address']}")
                print()
            
            # Print reasoning
            if result.get('reasoning'):
                print(f"💡 AI Reasoning:\n{result['reasoning']}\n")
            
            print("="*80)
            return True
            
        else:
            print(f"\n❌ FAILED with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("\n❌ Request timed out (60s)")
        return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n🧪 Discover Endpoint Test")
    print("="*80)
    
    success = test_discover_endpoint()
    
    if success:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)
