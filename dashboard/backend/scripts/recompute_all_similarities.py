"""
Script to recompute similarity scores for all users in the social network.
Run this after taste profiles have been updated to refresh the friend similarity graph.
"""
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path so we can import from services
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load environment variables
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from supabase_client import get_supabase
from routers.friends_graph import compute_friend_similarities


async def clear_friend_similarities_table():
    """Clear the friend_similarities table before recomputation."""
    supabase = get_supabase()
    try:
        print("🗑️  Clearing friend_similarities table for fresh recomputation...")
        # Delete all rows by using a condition that's always true
        supabase.table('friend_similarities').delete().neq('user_id_1', '00000000-0000-0000-0000-000000000000').execute()
        print("✅ Table cleared successfully\n")
    except Exception as e:
        print(f"⚠️  Could not clear friend_similarities table: {e}\n")


async def recompute_all_user_similarities():
    """
    Fetch all users and recompute their friend similarities.
    """
    supabase = get_supabase()
    
    # Clear existing similarities first
    await clear_friend_similarities_table()
    
    try:
        print("🔄 Starting similarity recomputation for all users...")
        print("=" * 80)
        
        # Fetch all user IDs from profiles
        result = supabase.table('profiles')\
            .select('id, username, display_name')\
            .execute()
        
        if not result.data:
            print("❌ No users found in database")
            return
        
        users = result.data
        print(f"📊 Found {len(users)} users in database\n")
        
        # Track progress
        total_users = len(users)
        processed = 0
        errors = 0
        
        for user in users:
            user_id = user['id']
            username = user.get('username', 'unknown')
            display_name = user.get('display_name', username)
            
            try:
                print(f"[{processed + 1}/{total_users}] Processing: {display_name} (@{username})")
                
                # Call the compute endpoint function
                result = await compute_friend_similarities(user_id)
                
                computed_count = result.get('computed', 0)
                message = result.get('message', '')
                
                if computed_count > 0:
                    print(f"  ✅ {message}")
                else:
                    print(f"  ⚠️  {message}")
                
                processed += 1
                
            except Exception as e:
                print(f"  ❌ Error: {str(e)}")
                errors += 1
                processed += 1
        
        print("\n" + "=" * 80)
        print("🎉 RECOMPUTATION COMPLETE")
        print(f"📊 Processed: {processed}/{total_users} users")
        if errors > 0:
            print(f"⚠️  Errors: {errors}")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Recompute friend similarities for all users')
    parser.add_argument('--yes', '-y', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()
    
    print("\n🚀 Friend Similarity Recomputation Script")
    print("=" * 80)
    print("This will recompute similarity scores for ALL users.")
    print("⚠️  Warning: This may take a while if you have many users.")
    print("=" * 80)
    
    # Confirm before running (unless --yes flag provided)
    if not args.yes:
        try:
            response = input("\nDo you want to proceed? (yes/no): ").strip().lower()
            if response != 'yes':
                print("❌ Aborted by user")
                sys.exit(0)
        except EOFError:
            print("\n❌ Cannot run interactively. Use --yes flag to skip confirmation.")
            sys.exit(1)
    
    print("\n")
    asyncio.run(recompute_all_user_similarities())

