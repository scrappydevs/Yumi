from typing import Dict, Any, Tuple
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import google.generativeai as genai
import os

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

async def compute_similarity(
    supabase,
    user_id_1: str,
    user_id_2: str
) -> Dict[str, Any]:
    """
    Compute similarity between two users based on food preferences
    """
    
    # Get both user profiles
    profile1_result = supabase.table('user_food_profiles')\
        .select('*')\
        .eq('user_id', user_id_1)\
        .single()\
        .execute()
    
    profile2_result = supabase.table('user_food_profiles')\
        .select('*')\
        .eq('user_id', user_id_2)\
        .single()\
        .execute()
    
    profile1 = profile1_result.data
    profile2 = profile2_result.data
    
    # 1. Cuisine overlap
    cuisines1 = {c['name']: c['score'] for c in profile1.get('favorite_cuisines', [])}
    cuisines2 = {c['name']: c['score'] for c in profile2.get('favorite_cuisines', [])}
    
    shared_cuisines = set(cuisines1.keys()) & set(cuisines2.keys())
    cuisine_similarity = 0.0
    if shared_cuisines:
        cuisine_similarity = sum(
            cuisines1[c] * cuisines2[c] for c in shared_cuisines
        ) / len(shared_cuisines)
    
    # 2. Restaurant overlap
    rest1 = {r['id'] for r in profile1.get('favorite_restaurants', [])}
    rest2 = {r['id'] for r in profile2.get('favorite_restaurants', [])}
    shared_restaurants = rest1 & rest2
    restaurant_similarity = len(shared_restaurants) / max(len(rest1 | rest2), 1)
    
    # 3. Taste profile similarity (cosine)
    taste1 = profile1.get('taste_preferences', {})
    taste2 = profile2.get('taste_preferences', {})
    taste_keys = set(taste1.keys()) | set(taste2.keys())
    
    if taste_keys:
        taste_vec1 = [taste1.get(k, 0) for k in taste_keys]
        taste_vec2 = [taste2.get(k, 0) for k in taste_keys]
        taste_similarity = cosine_similarity([taste_vec1], [taste_vec2])[0][0]
    else:
        taste_similarity = 0.0
    
    # 4. Food item overlap
    foods1 = {f['food_id'] for f in profile1.get('liked_foods', [])}
    foods2 = {f['food_id'] for f in profile2.get('liked_foods', [])}
    food_similarity = len(foods1 & foods2) / max(len(foods1 | foods2), 1)
    
    # 5. Price preference similarity
    price1 = profile1.get('avg_price_preference', 2.5)
    price2 = profile2.get('avg_price_preference', 2.5)
    price_diff = abs(price1 - price2)
    price_similarity = 1 - (price_diff / 4)
    
    # Weighted average
    overall_score = (
        0.30 * cuisine_similarity +
        0.25 * restaurant_similarity +
        0.25 * taste_similarity +
        0.15 * food_similarity +
        0.05 * price_similarity
    )
    
    # Get shared restaurant details
    shared_restaurant_details = [
        r for r in profile1.get('favorite_restaurants', [])
        if r['id'] in shared_restaurants
    ]
    
    # Generate natural language explanation
    explanation = await generate_explanation(
        profile1,
        profile2,
        {
            'shared_cuisines': list(shared_cuisines),
            'shared_restaurants': shared_restaurant_details,
            'cuisine_similarity': cuisine_similarity,
            'taste_similarity': taste_similarity,
        }
    )
    
    # Calculate taste overlap for tooltip
    taste_overlap = {}
    for taste in taste_keys:
        overlap = (taste1.get(taste, 0) + taste2.get(taste, 0)) / 2
        if overlap > 0:
            taste_overlap[taste] = overlap
    
    return {
        'similarity_score': float(overall_score),
        'similarity_explanation': explanation,
        'shared_restaurants': shared_restaurant_details,
        'shared_cuisines': list(shared_cuisines),
        'taste_profile_overlap': taste_overlap,
    }


async def generate_explanation(
    profile1: Dict,
    profile2: Dict,
    breakdown: Dict
) -> str:
    """
    Use Gemini to generate natural language explanation
    """
    cuisines1 = [c['name'] for c in profile1.get('favorite_cuisines', [])[:3]]
    cuisines2 = [c['name'] for c in profile2.get('favorite_cuisines', [])[:3]]
    
    taste1 = profile1.get('taste_preferences', {})
    taste2 = profile2.get('taste_preferences', {})
    
    prompt = f"""Generate a natural, friendly 1-2 sentence explanation of why these two users have similar food tastes.

User 1's preferences:
- Favorite cuisines: {', '.join(cuisines1)}
- Taste profile: sweet={taste1.get('sweet', 0):.1f}, spicy={taste1.get('spicy', 0):.1f}, savory={taste1.get('savory', 0):.1f}

User 2's preferences:
- Favorite cuisines: {', '.join(cuisines2)}
- Taste profile: sweet={taste2.get('sweet', 0):.1f}, spicy={taste2.get('spicy', 0):.1f}, savory={taste2.get('savory', 0):.1f}

Shared:
- Cuisines: {', '.join(breakdown['shared_cuisines']) if breakdown['shared_cuisines'] else 'None'}
- {len(breakdown['shared_restaurants'])} restaurants in common

Create a conversational explanation highlighting their strongest connection.
Example: "You both love Italian food and have similar preferences for savory flavors. You've also both enjoyed 3 of the same restaurants!"

Only return the explanation, nothing else. Keep it friendly and under 50 words."""

    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error generating explanation with Gemini: {e}")
        # Fallback explanation
        if breakdown['shared_cuisines']:
            return f"You both enjoy {', '.join(breakdown['shared_cuisines'][:2])} cuisine and have visited {len(breakdown['shared_restaurants'])} of the same restaurants!"
        return "You have similar taste preferences in food!"

