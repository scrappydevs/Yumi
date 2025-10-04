"""
Test script for /api/preferences/blend endpoint
"""
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_blend_preferences():
    """Test the preferences blend endpoint."""
    
    print("\n" + "="*60)
    print("🧪 Testing /api/preferences/blend Endpoint")
    print("="*60 + "\n")
    
    # Backend URL
    base_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    
    print(f"📍 Backend URL: {base_url}\n")
    print("⚠️  NOTE: You need to:")
    print("   1. Have the backend running (python main.py)")
    print("   2. Have a valid JWT token from a logged-in user")
    print("   3. That user should have friends AND preferences\n")
    
    # Get JWT token
    jwt_token = input("🔑 Enter your JWT token (or press Enter to skip): ").strip()
    
    if not jwt_token:
        print("\n⏭️  Skipping test - no token provided")
        print("\n📋 To get your JWT token:")
        print("   1. Go to your frontend or use Supabase")
        print("   2. Sign in with your account")
        print("   3. Copy the access token from the session\n")
        return
    
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Blend with all friends (empty array)
    print("📝 Test 1: Blend preferences with all friends")
    print("-" * 60)
    
    try:
        response = requests.post(
            f"{base_url}/api/preferences/blend",
            headers=headers,
            json={"friend_ids": []}  # Empty = use all friends
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Success! Blended preferences for {data.get('user_count')} people\n")
            
            print(f"👥 Group Members:")
            for name in data.get('user_names', []):
                print(f"   - {name}")
            
            print(f"\n📝 Blended Preferences:")
            print(f"   {data.get('blended_text')}\n")
            
            print(f"🍴 Top Cuisines: {', '.join(data.get('top_cuisines', []))}")
            print(f"✨ Atmosphere: {', '.join(data.get('atmosphere_preferences', []))}")
            print(f"💰 Price Range: {data.get('price_range')}\n")
            
            print("Full JSON Response:")
            print(json.dumps(data, indent=2))
            
        elif response.status_code == 401:
            print("❌ Unauthorized - Invalid or expired token")
        elif response.status_code == 404:
            print("❌ No profiles found - Check that you have friends")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error - Make sure backend is running!")
        print("   Start with: cd dashboard/backend && python main.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print("\n" + "="*60)
    print("✅ Test Complete")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_blend_preferences()
