"""
Script to populate shared_restaurants, shared_cuisines, and taste_profile_overlap 
in the friend_similarities table.

This backfills the JSONB fields with actual data based on:
- User interactions (restaurant views, clicks, reservations)
- User taste profiles (cuisines, atmosphere, price preferences)
"""
import asyncio
import sys
import os
from pathlib import Path
from typing import Dict, List, Set, Any
import json

# Add parent directory to path so we can import from services
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load environment variables
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from supabase_client import get_supabase


def extract_cuisines_from_preferences(preferences_text: str) -> List[str]:
    """
    Extract cuisines from natural language preferences text.
    
    Args:
        preferences_text: Natural language preferences like "loves Italian and Thai food"
    
    Returns:
        List of cuisine types found
    """
    if not preferences_text:
        return []
    
    # Common cuisines to look for (case-insensitive)
    cuisines = [
        'Italian', 'Chinese', 'Japanese', 'Thai', 'Mexican', 'Indian', 
        'French', 'Korean', 'Vietnamese', 'Mediterranean', 'Greek',
        'Spanish', 'American', 'BBQ', 'Seafood', 'Steakhouse', 'Sushi',
        'Pizza', 'Burger', 'Brazilian', 'Lebanese', 'Middle Eastern',
        'Filipino', 'Ethiopian', 'Moroccan', 'Turkish', 'Peruvian',
        'Caribbean', 'Cajun', 'Soul Food', 'Comfort Food'
    ]
    
    found_cuisines = []
    text_lower = preferences_text.lower()
    
    for cuisine in cuisines:
        if cuisine.lower() in text_lower:
            found_cuisines.append(cuisine)
    
    return found_cuisines


def extract_taste_attributes(preferences_text: str) -> Dict[str, Any]:
    """
    Extract taste attributes from preferences text.
    
    Args:
        preferences_text: Natural language preferences
        
    Returns:
        Dict with atmosphere, price_level, and flavor preferences
    """
    if not preferences_text:
        return {
            'atmosphere': [],
            'price_level': None,
            'flavors': []
        }
    
    text_lower = preferences_text.lower()
    
    # Atmosphere keywords
    atmosphere_keywords = {
        'casual': ['casual', 'relaxed', 'laid-back'],
        'fine_dining': ['fine dining', 'upscale', 'elegant', 'sophisticated'],
        'cozy': ['cozy', 'intimate', 'warm'],
        'trendy': ['trendy', 'modern', 'hip', 'contemporary'],
        'romantic': ['romantic', 'date night'],
        'family': ['family-friendly', 'family', 'kids'],
        'lively': ['lively', 'energetic', 'vibrant'],
        'quiet': ['quiet', 'peaceful', 'calm']
    }
    
    found_atmosphere = []
    for atm, keywords in atmosphere_keywords.items():
        if any(kw in text_lower for kw in keywords):
            found_atmosphere.append(atm)
    
    # Price level
    price_level = None
    if '$$$$' in preferences_text or 'upscale' in text_lower or 'expensive' in text_lower:
        price_level = 4
    elif '$$$' in preferences_text or 'pricey' in text_lower:
        price_level = 3
    elif '$$' in preferences_text or 'moderate' in text_lower:
        price_level = 2
    elif '$' in preferences_text or 'budget' in text_lower or 'cheap' in text_lower:
        price_level = 1
    
    # Flavor preferences
    flavor_keywords = {
        'spicy': ['spicy', 'hot', 'heat'],
        'sweet': ['sweet', 'dessert'],
        'savory': ['savory', 'umami'],
        'sour': ['sour', 'tangy', 'acidic'],
        'rich': ['rich', 'creamy', 'decadent'],
        'fresh': ['fresh', 'light', 'crisp'],
        'bold': ['bold', 'strong flavors']
    }
    
    found_flavors = []
    for flavor, keywords in flavor_keywords.items():
        if any(kw in text_lower for kw in keywords):
            found_flavors.append(flavor)
    
    return {
        'atmosphere': found_atmosphere,
        'price_level': price_level,
        'flavors': found_flavors
    }


def get_user_restaurants(supabase, user_id: str) -> List[Dict[str, Any]]:
    """
    Get restaurants a user has interacted with (viewed, clicked, reserved).
    
    Args:
        supabase: Supabase client
        user_id: User's UUID
        
    Returns:
        List of restaurant dicts with place_id, name, cuisine
    """
    try:
        # Get interactions with restaurants (weight >= 2.0 means view/click/reservation)
        result = supabase.table('user_interactions')\
            .select('restaurant_place_id, restaurant_name, restaurant_cuisine')\
            .eq('user_id', user_id)\
            .gte('signal_weight', 2.0)\
            .not_.is_('restaurant_place_id', 'null')\
            .execute()
        
        if not result.data:
            return []
        
        # Deduplicate by place_id
        restaurants_map = {}
        for interaction in result.data:
            place_id = interaction['restaurant_place_id']
            if place_id and place_id not in restaurants_map:
                restaurants_map[place_id] = {
                    'place_id': place_id,
                    'name': interaction['restaurant_name'],
                    'cuisine': interaction['restaurant_cuisine']
                }
        
        return list(restaurants_map.values())
        
    except Exception as e:
        print(f"    ⚠️  Error fetching user restaurants: {e}")
        return []


def get_user_preferences(supabase, user_id: str) -> Dict[str, Any]:
    """
    Get user's preferences text and extract structured data.
    
    Args:
        supabase: Supabase client
        user_id: User's UUID
        
    Returns:
        Dict with cuisines and taste attributes
    """
    try:
        result = supabase.table('profiles')\
            .select('preferences')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not result.data:
            return {'cuisines': [], 'attributes': {}}
        
        preferences_text = result.data.get('preferences', '') or ''
        
        cuisines = extract_cuisines_from_preferences(preferences_text)
        attributes = extract_taste_attributes(preferences_text)
        
        return {
            'cuisines': cuisines,
            'attributes': attributes
        }
        
    except Exception as e:
        print(f"    ⚠️  Error fetching user preferences: {e}")
        return {'cuisines': [], 'attributes': {}}


def compute_shared_data(
    user1_restaurants: List[Dict],
    user2_restaurants: List[Dict],
    user1_prefs: Dict,
    user2_prefs: Dict
) -> Dict[str, Any]:
    """
    Compute shared restaurants, cuisines, and taste profile overlap.
    
    Args:
        user1_restaurants: List of restaurants for user 1
        user2_restaurants: List of restaurants for user 2
        user1_prefs: Preferences dict for user 1
        user2_prefs: Preferences dict for user 2
        
    Returns:
        Dict with shared_restaurants, shared_cuisines, taste_profile_overlap
    """
    # Shared restaurants (by place_id)
    user1_place_ids = {r['place_id'] for r in user1_restaurants}
    user2_place_ids = {r['place_id'] for r in user2_restaurants}
    
    shared_place_ids = user1_place_ids & user2_place_ids
    
    shared_restaurants = [
        r for r in user1_restaurants 
        if r['place_id'] in shared_place_ids
    ]
    
    # Shared cuisines (from preferences)
    user1_cuisines = set(user1_prefs.get('cuisines', []))
    user2_cuisines = set(user2_prefs.get('cuisines', []))
    
    shared_cuisines = list(user1_cuisines & user2_cuisines)
    
    # Taste profile overlap
    user1_attrs = user1_prefs.get('attributes', {})
    user2_attrs = user2_prefs.get('attributes', {})
    
    user1_atmosphere = set(user1_attrs.get('atmosphere', []))
    user2_atmosphere = set(user2_attrs.get('atmosphere', []))
    shared_atmosphere = list(user1_atmosphere & user2_atmosphere)
    
    user1_flavors = set(user1_attrs.get('flavors', []))
    user2_flavors = set(user2_attrs.get('flavors', []))
    shared_flavors = list(user1_flavors & user2_flavors)
    
    # Price compatibility (within 1 level)
    price1 = user1_attrs.get('price_level')
    price2 = user2_attrs.get('price_level')
    price_compatible = None
    if price1 and price2:
        price_compatible = abs(price1 - price2) <= 1
    
    taste_profile_overlap = {
        'shared_atmosphere': shared_atmosphere,
        'shared_flavors': shared_flavors,
        'price_compatible': price_compatible,
        'overlap_score': calculate_overlap_score(
            len(shared_cuisines),
            len(shared_restaurants),
            len(shared_atmosphere),
            len(shared_flavors)
        )
    }
    
    return {
        'shared_restaurants': shared_restaurants[:10],  # Limit to top 10
        'shared_cuisines': shared_cuisines,
        'taste_profile_overlap': taste_profile_overlap
    }


def calculate_overlap_score(
    num_shared_cuisines: int,
    num_shared_restaurants: int,
    num_shared_atmosphere: int,
    num_shared_flavors: int
) -> float:
    """
    Calculate a normalized overlap score (0.0 to 1.0).
    
    Weights:
    - Shared cuisines: 0.3
    - Shared restaurants: 0.4 (strongest signal)
    - Shared atmosphere: 0.15
    - Shared flavors: 0.15
    """
    # Normalize each component (cap at reasonable maxes)
    cuisine_score = min(num_shared_cuisines / 5.0, 1.0)  # Max 5 cuisines
    restaurant_score = min(num_shared_restaurants / 10.0, 1.0)  # Max 10 restaurants
    atmosphere_score = min(num_shared_atmosphere / 3.0, 1.0)  # Max 3 atmosphere types
    flavor_score = min(num_shared_flavors / 4.0, 1.0)  # Max 4 flavors
    
    # Weighted sum
    overlap_score = (
        cuisine_score * 0.3 +
        restaurant_score * 0.4 +
        atmosphere_score * 0.15 +
        flavor_score * 0.15
    )
    
    return round(overlap_score, 3)


async def populate_similarity_details():
    """
    Main function to populate similarity details for all friend_similarities records.
    """
    supabase = get_supabase()
    
    try:
        print("🔄 Starting similarity details population...")
        print("=" * 80)
        
        # Fetch all friend_similarities records
        result = supabase.table('friend_similarities')\
            .select('id, user_id_1, user_id_2')\
            .execute()
        
        if not result.data:
            print("❌ No friend_similarities records found")
            return
        
        similarities = result.data
        print(f"📊 Found {len(similarities)} similarity records to process\n")
        
        # Track progress
        total = len(similarities)
        processed = 0
        updated = 0
        errors = 0
        
        # Cache for user data to avoid redundant queries
        user_restaurants_cache = {}
        user_prefs_cache = {}
        
        for sim in similarities:
            sim_id = sim['id']
            user_id_1 = sim['user_id_1']
            user_id_2 = sim['user_id_2']
            
            try:
                print(f"[{processed + 1}/{total}] Processing similarity {sim_id[:8]}...")
                
                # Get user 1 data (with caching)
                if user_id_1 not in user_restaurants_cache:
                    user_restaurants_cache[user_id_1] = get_user_restaurants(supabase, user_id_1)
                    user_prefs_cache[user_id_1] = get_user_preferences(supabase, user_id_1)
                
                user1_restaurants = user_restaurants_cache[user_id_1]
                user1_prefs = user_prefs_cache[user_id_1]
                
                # Get user 2 data (with caching)
                if user_id_2 not in user_restaurants_cache:
                    user_restaurants_cache[user_id_2] = get_user_restaurants(supabase, user_id_2)
                    user_prefs_cache[user_id_2] = get_user_preferences(supabase, user_id_2)
                
                user2_restaurants = user_restaurants_cache[user_id_2]
                user2_prefs = user_prefs_cache[user_id_2]
                
                # Compute shared data
                shared_data = compute_shared_data(
                    user1_restaurants,
                    user2_restaurants,
                    user1_prefs,
                    user2_prefs
                )
                
                # Update the record
                supabase.table('friend_similarities')\
                    .update({
                        'shared_restaurants': json.dumps(shared_data['shared_restaurants']),
                        'shared_cuisines': json.dumps(shared_data['shared_cuisines']),
                        'taste_profile_overlap': json.dumps(shared_data['taste_profile_overlap'])
                    })\
                    .eq('id', sim_id)\
                    .execute()
                
                print(f"  ✅ Updated: {len(shared_data['shared_restaurants'])} restaurants, "
                      f"{len(shared_data['shared_cuisines'])} cuisines, "
                      f"overlap: {shared_data['taste_profile_overlap']['overlap_score']:.2f}")
                
                updated += 1
                processed += 1
                
            except Exception as e:
                print(f"  ❌ Error: {str(e)}")
                errors += 1
                processed += 1
        
        print("\n" + "=" * 80)
        print("🎉 POPULATION COMPLETE")
        print(f"📊 Processed: {processed}/{total} records")
        print(f"✅ Updated: {updated}")
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
    
    parser = argparse.ArgumentParser(
        description='Populate shared_restaurants, shared_cuisines, and taste_profile_overlap in friend_similarities'
    )
    parser.add_argument('--yes', '-y', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()
    
    print("\n🚀 Friend Similarities Details Population Script")
    print("=" * 80)
    print("This will populate shared_restaurants, shared_cuisines, and taste_profile_overlap")
    print("for ALL friend_similarities records based on:")
    print("  - User interactions (restaurant views, clicks, reservations)")
    print("  - User taste profiles (cuisines, atmosphere, flavors)")
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
    asyncio.run(populate_similarity_details())

