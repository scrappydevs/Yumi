"""
Restaurant Search Service - Natural language restaurant search using LLM with tool calls.

This service orchestrates:
1. Getting user preferences from taste profile
2. Finding nearby restaurants from Places API
3. Using LLM to intelligently rank results based on user query
"""
from typing import Dict, Any, List, Optional
from services.gemini_service import get_gemini_service
from services.supabase_service import get_supabase_service
from services.places_service import get_places_service
from services.taste_profile_service import get_taste_profile_service


class RestaurantSearchService:
    """Service for natural language restaurant search with LLM tool calls."""
    
    def __init__(self):
        """Initialize with required services."""
        self.gemini_service = get_gemini_service()
        self.supabase_service = get_supabase_service()
        self.places_service = get_places_service()
        self.taste_profile_service = get_taste_profile_service()
        print("[RESTAURANT SEARCH] Service initialized")
    
    def get_user_preferences_tool(self, user_id: str) -> Dict[str, Any]:
        """
        Tool function: Fetch user's dining preferences.
        
        Args:
            user_id: User UUID
            
        Returns:
            Preferences dict with cuisines, atmosphere, price range, flavor notes
        """
        try:
            print(f"[TOOL] get_user_preferences called for user: {user_id}")
            preferences = self.taste_profile_service.get_current_preferences(user_id)
            print(f"[TOOL] Retrieved preferences: {preferences}")
            return preferences
        except Exception as e:
            print(f"[TOOL ERROR] Failed to get preferences: {str(e)}")
            # Return empty preferences on error
            return {
                "cuisines": [],
                "priceRange": "",
                "atmosphere": [],
                "flavorNotes": []
            }
    
    def get_nearby_restaurants_tool(
        self,
        latitude: float,
        longitude: float,
        radius: int = 1000,
        limit: int = 10,
        keyword: str = None
    ) -> List[Dict[str, Any]]:
        """
        Tool function: Get nearby restaurants from Google Places API.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            radius: Search radius in meters (default: 1000m = 1km)
            limit: Maximum number of restaurants to return (default: 10)
            keyword: Optional keyword to filter restaurants (e.g., "Chinese", "Italian")
            
        Returns:
            List of restaurant dicts with place_id, name, cuisine, rating, etc.
        """
        try:
            print(f"[TOOL] get_nearby_restaurants called at ({latitude}, {longitude})")
            print(f"[TOOL] Radius: {radius}m, Limit: {limit}")
            if keyword:
                print(f"[TOOL] Keyword filter: '{keyword}'")
            
            restaurants = self.places_service.find_nearby_restaurants(
                latitude=latitude,
                longitude=longitude,
                radius=radius,
                limit=limit,
                keyword=keyword
            )
            
            print(f"[TOOL] Found {len(restaurants)} restaurants")
            return restaurants
            
        except Exception as e:
            print(f"[TOOL ERROR] Failed to get nearby restaurants: {str(e)}")
            return []
    
    def _get_function_declarations(self):
        """
        Define function schemas for Gemini function calling.
        
        Returns:
            List of function declaration objects for Gemini
        """
        return [
            {
                "name": "get_user_preferences",
                "description": "Get the user's dining preferences including favorite cuisines, preferred atmosphere, price range, and flavor notes from their taste profile",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "description": "The user's UUID identifier"
                        }
                    },
                    "required": ["user_id"]
                }
            },
            {
                "name": "get_nearby_restaurants",
                "description": "Find restaurants near a geographic location using Google Places API. Returns up to 10 restaurants with ratings, cuisine types, and addresses.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "latitude": {
                            "type": "number",
                            "description": "Latitude coordinate"
                        },
                        "longitude": {
                            "type": "number",
                            "description": "Longitude coordinate"
                        },
                        "radius": {
                            "type": "integer",
                            "description": "Search radius in meters (default: 1000)",
                            "default": 1000
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of restaurants to return (default: 10)",
                            "default": 10
                        }
                    },
                    "required": ["latitude", "longitude"]
                }
            }
        ]
    
    async def search_restaurants(
        self,
        query: str,
        user_id: str,
        latitude: float,
        longitude: float
    ) -> Dict[str, Any]:
        """
        Main orchestrator: Natural language restaurant search using LLM analysis.
        
        Stage 4 Simplified: Call tools directly, then use LLM to analyze and rank.
        (Avoiding complex function calling API issues)
        
        Args:
            query: User's natural language query
            user_id: User UUID
            latitude: User's latitude
            longitude: User's longitude
            
        Returns:
            Search results with top 3 restaurants and reasoning
        """
        print(f"[RESTAURANT SEARCH] Query: '{query}'")
        print(f"[RESTAURANT SEARCH] User: {user_id}")
        print(f"[RESTAURANT SEARCH] Location: ({latitude}, {longitude})")
        
        # Stage 4: Simplified approach - call tools directly, LLM analyzes results
        try:
            # Step 1: Get user preferences
            print(f"[RESTAURANT SEARCH] Step 1: Getting user preferences...")
            preferences = self.get_user_preferences_tool(user_id)
            
            # Step 1.5: Extract cuisine keyword from query if present
            cuisine_keyword = None
            query_lower = query.lower()
            
            # Common cuisine keywords to extract
            cuisine_keywords = [
                'chinese', 'italian', 'mexican', 'japanese', 'thai', 'indian', 'french',
                'korean', 'vietnamese', 'greek', 'spanish', 'american', 'mediterranean',
                'seafood', 'steakhouse', 'sushi', 'pizza', 'burger', 'bbq', 'vegan', 'vegetarian'
            ]
            
            for keyword in cuisine_keywords:
                if keyword in query_lower:
                    cuisine_keyword = keyword
                    print(f"[RESTAURANT SEARCH] 🍽️ Detected cuisine preference: '{cuisine_keyword}'")
                    break
            
            # Step 2: Get nearby restaurants (with cuisine filter if detected)
            print(f"[RESTAURANT SEARCH] Step 2: Finding nearby restaurants...")
            restaurants = self.get_nearby_restaurants_tool(
                latitude=latitude,
                longitude=longitude,
                radius=2000,  # Increased to 2km radius
                limit=20,      # Get 20 restaurants
                keyword=cuisine_keyword  # Filter by cuisine if detected
            )
            
            if not restaurants:
                return {
                    "status": "success",
                    "stage": "4 - LLM analysis (no restaurants found)",
                    "query": query,
                    "top_restaurants": [],
                    "message": "No restaurants found nearby",
                    "location": {"latitude": latitude, "longitude": longitude}
                }
            
            # Step 3: Format data for LLM
            print(f"[RESTAURANT SEARCH] Step 3: Asking LLM to analyze and rank...")
            
            # Build restaurants list for prompt
            restaurants_text = "\n".join([
                f"{i+1}. {r['name']} - {r['cuisine']} ({r['rating']}⭐, {'$' * r.get('price_level', 2)}) - {r['address']}"
                for i, r in enumerate(restaurants)
            ])
            
            # Build preferences text
            prefs_text = f"""
- Favorite Cuisines: {', '.join(preferences.get('cuisines', [])) or 'None specified'}
- Price Range: {preferences.get('priceRange') or 'No preference'}
- Atmosphere: {', '.join(preferences.get('atmosphere', [])) or 'No preference'}
- Flavor Notes: {', '.join(preferences.get('flavorNotes', [])) or 'No preference'}
"""
            
            # Determine how many recommendations to return based on query
            # Default to 5, but extract if user specifies (e.g., "top 3", "5 restaurants")
            num_recommendations = 5  # Default
            query_lower = query.lower()
            
            # Try to extract number from common patterns
            import re
            number_patterns = [
                r'top (\d+)',
                r'(\d+) restaurants',
                r'(\d+) places',
                r'give me (\d+)',
                r'show me (\d+)',
            ]
            
            for pattern in number_patterns:
                match = re.search(pattern, query_lower)
                if match:
                    num_recommendations = int(match.group(1))
                    break
            
            # Ensure between 1 and 10
            num_recommendations = max(1, min(10, num_recommendations))
            print(f"[RESTAURANT SEARCH] Returning top {num_recommendations} recommendations")
            
            # Create LLM prompt
            prompt = f"""You are a restaurant recommendation expert. Analyze these restaurants and select the TOP {num_recommendations} that best match the user's query and preferences.

USER'S QUERY: "{query}"

USER'S PREFERENCES:{prefs_text}

AVAILABLE RESTAURANTS:
{restaurants_text}

TASK:
1. Analyze how well each restaurant matches the query "{query}"
2. Consider the user's preferences (cuisines, price, atmosphere)
3. Select the TOP {num_recommendations} best matches
4. Provide SPECIFIC, DETAILED reasoning for each recommendation:
   - Mention specific dishes or menu items they're known for
   - Describe the vibe, ambiance, or atmosphere
   - Explain why it matches their taste or query
   - Reference any unique characteristics or specialties
   - Keep it to 2-3 sentences with concrete details

Return ONLY valid JSON (no markdown, no code blocks) with EXACTLY {num_recommendations} restaurants:
{{
  "top_restaurants": [
    {{
      "name": "Restaurant Name",
      "cuisine": "Cuisine Type",
      "rating": 4.5,
      "address": "Full address",
      "price_level": 2,
      "match_score": 0.95,
      "reasoning": "Specific explanation mentioning dishes (e.g., 'famous for their hand-pulled noodles and crispy Peking duck'), the atmosphere (e.g., 'casual, family-friendly vibe with traditional decor'), and why it matches the query. Include concrete details that make it unique."
    }}
    // ... {num_recommendations} total restaurants
  ],
  "query_analysis": "One sentence about what the user wants",
  "preference_matching": "One sentence about preference alignment",
  "num_recommendations": {num_recommendations}
}}

IMPORTANT: 
- Return EXACTLY {num_recommendations} restaurants
- Keep all reasoning CONCISE - maximum 1-2 sentences each
- Rank from best to worst match"""
            
            # Call Gemini
            print(f"[RESTAURANT SEARCH] Calling Gemini API...")
            model = self.gemini_service.model
            
            try:
                response = model.generate_content(prompt)
                print(f"[RESTAURANT SEARCH] Gemini API responded")
                response_text = response.text.strip()
                print(f"[RESTAURANT SEARCH] Response length: {len(response_text)} chars")
            except Exception as e:
                print(f"[RESTAURANT SEARCH ERROR] Gemini API call failed: {str(e)}")
                raise
            
            # Clean up markdown
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse JSON
            import json
            result = json.loads(response_text)
            
            # Step 5: Enrich results with photo URLs and place_ids
            # Match LLM-selected restaurants back to original data for photos
            top_restaurants = result.get('top_restaurants', [])
            for top_restaurant in top_restaurants:
                # Find matching restaurant from original list by name
                for orig_restaurant in restaurants:
                    if orig_restaurant['name'].lower() == top_restaurant['name'].lower():
                        # Add photo URL and place_id from original data
                        top_restaurant['photo_url'] = orig_restaurant.get('photo_url')
                        top_restaurant['place_id'] = orig_restaurant.get('place_id')
                        break
            
            # Step 6: Also include all nearby restaurants for the photo wheel
            # Add basic info for all restaurants (not just top 3)
            all_nearby_with_photos = [
                {
                    'name': r['name'],
                    'photo_url': r.get('photo_url'),
                    'place_id': r.get('place_id'),
                    'rating': r.get('rating', 0),
                    'cuisine': r.get('cuisine', 'Unknown')
                }
                for r in restaurants if r.get('photo_url')  # Only include restaurants with photos
            ]
            
            # Add metadata
            result["status"] = "success"
            result["stage"] = "4 - LLM analysis"
            result["query"] = query
            result["all_nearby_restaurants"] = all_nearby_with_photos  # Include all for photo wheel
            result["num_recommendations"] = num_recommendations  # Include for frontend
            result["location"] = {
                "latitude": latitude,
                "longitude": longitude
            }
            
            print(f"[RESTAURANT SEARCH] ✅ LLM ranked top {len(result.get('top_restaurants', []))} restaurants")
            print(f"[RESTAURANT SEARCH] ✅ Returning {len(all_nearby_with_photos)} total restaurants with photos")
            return result
            
        except Exception as e:
            print(f"[RESTAURANT SEARCH ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Fallback
            preferences = self.get_user_preferences_tool(user_id)
            restaurants = self.get_nearby_restaurants_tool(
                latitude=latitude,
                longitude=longitude,
                radius=1000,
                limit=10
            )
            
            return {
                "status": "success",
                "stage": "4 - Fallback",
                "error": str(e),
                "query": query,
                "user_preferences": preferences,
                "nearby_restaurants": restaurants,
                "location": {
                    "latitude": latitude,
                    "longitude": longitude
                }
            }


# Singleton instance
_restaurant_search_service: Optional[RestaurantSearchService] = None


def get_restaurant_search_service() -> RestaurantSearchService:
    """Get or create restaurant search service instance."""
    global _restaurant_search_service
    if _restaurant_search_service is None:
        _restaurant_search_service = RestaurantSearchService()
    return _restaurant_search_service

