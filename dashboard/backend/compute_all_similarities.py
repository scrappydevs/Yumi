"""
Script to compute similarity scores for all users with friends
"""
import requests
import time

# API base URL
API_URL = "http://localhost:8000"

def get_all_users_with_friends():
    """Get all users who have friends"""
    try:
        response = requests.get(f"{API_URL}/api/friends/search")
        if response.status_code == 200:
            users = response.json()
            # Filter to only users with friends
            users_with_friends = [u for u in users if u.get('friends') and len(u['friends']) > 0]
            return users_with_friends
        else:
            print(f"❌ Failed to get users: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting users: {e}")
        return []

def compute_similarities_for_user(user_id, username):
    """Compute similarities for a specific user"""
    try:
        print(f"\n{'='*60}")
        print(f"Computing similarities for: {username} ({user_id[:8]}...)")
        print(f"{'='*60}")
        
        response = requests.post(f"{API_URL}/api/friends/graph/{user_id}/compute")
        
        if response.status_code == 200:
            data = response.json()
            computed = data.get('computed', 0)
            message = data.get('message', '')
            print(f"✅ {message}")
            return computed
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return 0

def main():
    print("\n🚀 Starting similarity computation for all users...")
    print("=" * 60)
    
    # Get all users
    users = get_all_users_with_friends()
    
    if not users:
        print("❌ No users with friends found")
        return
    
    print(f"\n📊 Found {len(users)} users with friends:")
    for user in users:
        friend_count = len(user.get('friends', []))
        print(f"  - {user['username']} ({user['id'][:8]}...): {friend_count} friends")
    
    print(f"\n{'='*60}")
    print(f"Starting computation...")
    print(f"{'='*60}")
    
    total_computed = 0
    start_time = time.time()
    
    # Compute for each user
    for i, user in enumerate(users, 1):
        print(f"\n[{i}/{len(users)}]", end=" ")
        computed = compute_similarities_for_user(user['id'], user['username'])
        total_computed += computed
        
        # Small delay to avoid overwhelming the server
        if i < len(users):
            time.sleep(1)
    
    elapsed_time = time.time() - start_time
    
    print(f"\n{'='*60}")
    print(f"✅ COMPUTATION COMPLETE!")
    print(f"{'='*60}")
    print(f"Total similarities computed: {total_computed}")
    print(f"Time taken: {elapsed_time:.1f} seconds")
    print(f"Average per user: {elapsed_time/len(users):.1f} seconds")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
