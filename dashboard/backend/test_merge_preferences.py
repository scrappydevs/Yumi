"""
Test script for merge_multiple_user_preferences functionality
Simple standalone version that directly uses Supabase
"""
import os
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()


def get_user_preferences(supabase, user_id: str) -> dict:
    """Fetch user preferences from database."""
    try:
        response = supabase.table("profiles")\
            .select("preferences")\
            .eq("id", user_id)\
            .single()\
            .execute()
        
        if not response.data or not response.data.get("preferences"):
            return {
                "cuisines": [],
                "priceRange": "",
                "atmosphere": [],
                "flavorNotes": []
            }
        
        prefs_str = response.data["preferences"]
        prefs = json.loads(prefs_str) if isinstance(prefs_str, str) else prefs_str
        
        return {
            "cuisines": prefs.get("cuisines", []),
            "priceRange": prefs.get("priceRange", ""),
            "atmosphere": prefs.get("atmosphere", []),
            "flavorNotes": prefs.get("flavorNotes", [])
        }
    except Exception as e:
        print(f"❌ Error fetching preferences: {str(e)}")
        return {
            "cuisines": [],
            "priceRange": "",
            "atmosphere": [],
            "flavorNotes": []
        }


def merge_multiple_user_preferences(supabase, user_ids: list) -> dict:
    """
    Merge preferences from multiple users for group restaurant search.
    
    Strategy:
    - Cuisines: Union of all users' favorite cuisines (up to 8 total)
    - Price range: Take the most expensive preference (to accommodate everyone's budget)
    - Atmosphere: Union of atmosphere preferences
    - Flavor notes: Union of flavor preferences
    """
    if not user_ids:
        return {
            "cuisines": [],
            "priceRange": "",
            "atmosphere": [],
            "flavorNotes": []
        }
    
    print(f"[MERGE] Processing {len(user_ids)} users")
    
    # Collect all preferences
    all_preferences = []
    for user_id in user_ids:
        prefs = get_user_preferences(supabase, user_id)
        all_preferences.append(prefs)
        print(f"  User {user_id[:8]}...: {prefs}")
    
    # Initialize merged dict
    merged = {
        "cuisines": [],
        "priceRange": "",
        "atmosphere": [],
        "flavorNotes": []
    }
    
    # 1. Merge cuisines - Union of all users' cuisines
    all_cuisines = set()
    for prefs in all_preferences:
        all_cuisines.update(prefs.get("cuisines", []))
    merged["cuisines"] = list(all_cuisines)[:8]  # Limit to 8
    
    # 2. Merge price ranges - Take most expensive to accommodate everyone
    price_order = {"$": 1, "$$": 2, "$$$": 3, "$$$$": 4, "": 0}
    max_price = ""
    max_price_value = 0
    
    for prefs in all_preferences:
        price = prefs.get("priceRange", "")
        price_value = price_order.get(price, 0)
        if price_value > max_price_value:
            max_price_value = price_value
            max_price = price
    
    merged["priceRange"] = max_price
    
    # 3. Merge atmosphere - Union of all atmosphere tags
    all_atmosphere = set()
    for prefs in all_preferences:
        all_atmosphere.update(prefs.get("atmosphere", []))
    merged["atmosphere"] = list(all_atmosphere)
    
    # 4. Merge flavor notes - Union of all flavor preferences
    all_flavors = set()
    for prefs in all_preferences:
        all_flavors.update(prefs.get("flavorNotes", []))
    merged["flavorNotes"] = list(all_flavors)[:10]  # Limit to 10
    
    return merged


def main():
    """Run tests."""
    print("\n" + "="*60)
    print("🧪 Testing Multi-User Preference Merging")
    print("="*60 + "\n")
    
    # Initialize Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    print("✅ Supabase connected\n")
    
    # Test 1: Get individual user preferences
    print("📝 Test 1: Fetching individual user preferences")
    print("-" * 60)
    
    user1_id = "0d656513-63c6-4ece-a9d9-b78d2bd7af84"
    user2_id = "694e85e9-bb28-4139-9110-429d20a67b93"
    
    prefs1 = get_user_preferences(supabase, user1_id)
    print(f"✅ User 1: {prefs1}\n")
    
    prefs2 = get_user_preferences(supabase, user2_id)
    print(f"✅ User 2: {prefs2}\n")
    
    # Test 2: Merge multiple users
    print("📝 Test 2: Merging multiple users' preferences")
    print("-" * 60)
    
    user_ids = [user1_id, user2_id]
    merged = merge_multiple_user_preferences(supabase, user_ids)
    
    print("\n✅ Merged Result:")
    print(f"  - Cuisines: {merged['cuisines']}")
    print(f"  - Price Range: {merged['priceRange']}")
    print(f"  - Atmosphere: {merged['atmosphere']}")
    print(f"  - Flavor Notes: {merged['flavorNotes']}")
    
    # Test 3: Test with empty list
    print("\n📝 Test 3: Merging with empty list")
    print("-" * 60)
    
    empty_merged = merge_multiple_user_preferences(supabase, [])
    print(f"✅ Empty merge result: {empty_merged}")
    
    # Test 4: Test with single user
    print("\n📝 Test 4: Merging with single user (should equal their prefs)")
    print("-" * 60)
    
    single_merged = merge_multiple_user_preferences(supabase, [user1_id])
    print(f"✅ Single user merge: {single_merged}")
    
    print("\n" + "="*60)
    print("✅ All tests complete!")
    print("="*60)


if __name__ == "__main__":
    main()
