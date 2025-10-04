"""
Test script for /api/friends/search endpoint
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()


def test_friends_search():
    """Test the friends search endpoint."""
    
    print("\n" + "="*60)
    print("🧪 Testing /api/friends/search Endpoint")
    print("="*60 + "\n")
    
    # Backend URL
    base_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    
    print(f"📍 Backend URL: {base_url}\n")
    print("⚠️  NOTE: You need to:")
    print("   1. Have the backend running (python main.py)")
    print("   2. Have a valid JWT token from a logged-in user")
    print("   3. That user should have friends in their friends array\n")
    
    # You need to get this from your frontend after logging in
    jwt_token = input("🔑 Enter your JWT token (or press Enter to skip): ").strip()
    
    if not jwt_token:
        print("\n⏭️  Skipping test - no token provided")
        print("\n📋 To get your JWT token:")
        print("   1. Go to your frontend (http://localhost:3000)")
        print("   2. Open browser DevTools (F12)")
        print("   3. Go to Application > Local Storage")
        print("   4. Look for the auth token or session")
        print("   5. Or check Network tab for Authorization header in requests\n")
        return
    
    # Test 1: Get all friends (no query)
    print("📝 Test 1: Get all friends (no query)")
    print("-" * 60)
    
    headers = {"Authorization": f"Bearer {jwt_token}"}
    
    try:
        response = requests.get(
            f"{base_url}/api/friends/search",
            headers=headers
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            friends = data.get("friends", [])
            print(f"✅ Found {len(friends)} friends")
            
            for friend in friends[:5]:  # Show first 5
                print(f"  - {friend.get('username')} ({friend.get('display_name')})")
            
            if len(friends) > 5:
                print(f"  ... and {len(friends) - 5} more")
            
            # Test 2: Search with query
            if friends:
                print("\n📝 Test 2: Search friends with query")
                print("-" * 60)
                
                # Try first letter of first friend's username
                first_friend = friends[0]
                test_query = first_friend['username'][:2]
                print(f"Query: '{test_query}'")
                
                response2 = requests.get(
                    f"{base_url}/api/friends/search",
                    headers=headers,
                    params={"query": test_query}
                )
                
                if response2.status_code == 200:
                    filtered_friends = response2.json().get("friends", [])
                    print(f"✅ Found {len(filtered_friends)} matching friends")
                    
                    for friend in filtered_friends:
                        print(f"  - {friend.get('username')} ({friend.get('display_name')})")
                else:
                    print(f"❌ Error: {response2.status_code}")
                    print(response2.text)
            
        elif response.status_code == 401:
            print("❌ Unauthorized - Invalid or expired token")
        else:
            print(f"❌ Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend")
        print("   Make sure the backend is running: python main.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print("\n" + "="*60)
    print("✅ Test complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    test_friends_search()

