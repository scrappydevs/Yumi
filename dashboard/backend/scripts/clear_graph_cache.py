"""
Quick script to clear the friend graph cache so new fields are loaded.
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from supabase_client import get_supabase

def clear_cache():
    """Clear all cached friend graphs."""
    supabase = get_supabase()
    
    try:
        print("🗑️  Clearing friend graph cache...")
        result = supabase.table('friend_graphs').delete().neq('user_id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"✅ Cleared cache! Graphs will be regenerated on next request.")
    except Exception as e:
        print(f"⚠️  Error: {e}")
        print("(This is normal if the friend_graphs table doesn't exist)")

if __name__ == "__main__":
    clear_cache()

