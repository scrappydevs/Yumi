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
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Tool function: Get nearby restaurants from Google Places API.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            radius: Search radius in meters (default: 1000m = 1km)
            limit: Maximum number of restaurants to return (default: 10)
            
        Returns:
            List of restaurant dicts with place_id, name, cuisine, rating, etc.
        """
        try:
            print(f"[TOOL] get_nearby_restaurants called at ({latitude}, {longitude})")
            print(f"[TOOL] Radius: {radius}m, Limit: {limit}")
            
            restaurants = self.places_service.find_nearby_restaurants(
                latitude=latitude,
                longitude=longitude,
                radius=radius,
                limit=limit
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
            
            # Step 2: Get nearby restaurants
            print(f"[RESTAURANT SEARCH] Step 2: Finding nearby restaurants...")
            restaurants = self.get_nearby_restaurants_tool(
                latitude=latitude,
                longitude=longitude,
                radius=1000,
                limit=10
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
            
            # Create LLM prompt
            prompt = f"""You are a restaurant recommendation expert. Analyze these restaurants and select the TOP 3 that best match the user's query and preferences.

USER'S QUERY: "{query}"

USER'S PREFERENCES:{prefs_text}

AVAILABLE RESTAURANTS:
{restaurants_text}

TASK:
1. Analyze how well each restaurant matches the query "{query}"
2. Consider the user's preferences (cuisines, price, atmosphere)
3. Select the TOP 3 best matches
4. Provide BRIEF reasoning (1-2 sentences max per restaurant)

Return ONLY valid JSON (no markdown, no code blocks):
{{
  "top_restaurants": [
    {{
      "name": "Restaurant Name",
      "cuisine": "Cuisine Type",
      "rating": 4.5,
      "address": "Full address",
      "price_level": 2,
      "match_score": 0.95,
      "reasoning": "Brief 1-2 sentence explanation of why this matches"
    }},
    {{
      "name": "Second Restaurant",
      "cuisine": "Cuisine",
      "rating": 4.3,
      "address": "Address",
      "price_level": 2,
      "match_score": 0.85,
      "reasoning": "Brief reason"
    }},
    {{
      "name": "Third Restaurant",
      "cuisine": "Cuisine",
      "rating": 4.2,
      "address": "Address",
      "price_level": 3,
      "match_score": 0.78,
      "reasoning": "Brief reason"
    }}
  ],
  "query_analysis": "One sentence about what the user wants",
  "preference_matching": "One sentence about preference alignment"
}}

IMPORTANT: Keep all reasoning CONCISE - maximum 1-2 sentences each."""
            
            # Call Gemini
            model = self.gemini_service.model
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
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
            
            # Add metadata
            result["status"] = "success"
            result["stage"] = "4 - LLM analysis"
            result["query"] = query
            result["location"] = {
                "latitude": latitude,
                "longitude": longitude
            }
            
            print(f"[RESTAURANT SEARCH] ✅ LLM ranked top {len(result.get('top_restaurants', []))} restaurants")
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
    
    async def search_restaurants_for_group(
        self,
        query: str,
        user_ids: List[str],
        latitude: float,
        longitude: float
    ) -> Dict[str, Any]:
        """
        Search restaurants for a group of users with merged preferences.
        
        Similar to search_restaurants but takes multiple user IDs and merges their preferences.
        
        Args:
            query: User's natural language query
            user_ids: List of user UUIDs (requesting user + mentioned friends)
            latitude: Location latitude
            longitude: Location longitude
            
        Returns:
            Search results with top 3 restaurants matching merged group preferences
        """
        print(f"[GROUP RESTAURANT SEARCH] Query: '{query}'")
        print(f"[GROUP RESTAURANT SEARCH] Users: {len(user_ids)} people")
        print(f"[GROUP RESTAURANT SEARCH] Location: ({latitude}, {longitude})")
        
        try:
            # Step 1: Merge preferences from all users
            print(f"[GROUP RESTAURANT SEARCH] Step 1: Merging preferences for {len(user_ids)} users...")
            merged_preferences = self.taste_profile_service.merge_multiple_user_preferences(user_ids)
            print(f"[GROUP RESTAURANT SEARCH] Merged preferences: {merged_preferences}")
            
            # Step 2: Get nearby restaurants (same as individual search)
            print(f"[GROUP RESTAURANT SEARCH] Step 2: Finding nearby restaurants...")
            restaurants = self.get_nearby_restaurants_tool(
                latitude=latitude,
                longitude=longitude,
                radius=1000,
                limit=10
            )
            
            if not restaurants:
                return {
                    "status": "success",
                    "stage": "group - no restaurants found",
                    "query": query,
                    "user_count": len(user_ids),
                    "top_restaurants": [],
                    "message": "No restaurants found nearby",
                    "location": {"latitude": latitude, "longitude": longitude}
                }
            
            # Step 3: Use LLM to rank based on merged preferences
            print(f"[GROUP RESTAURANT SEARCH] Step 3: Asking LLM to analyze for group...")
            
            # Build restaurants list for prompt
            restaurants_text = "\n".join([
                f"{i+1}. {r['name']} - {r['cuisine']} ({r['rating']}⭐, {'$' * r.get('price_level', 2)}) - {r['address']}"
                for i, r in enumerate(restaurants)
            ])
            
            # Build merged preferences text
            prefs_text = f"""
- Favorite Cuisines: {', '.join(merged_preferences.get('cuisines', [])) or 'None specified'}
- Price Range: {merged_preferences.get('priceRange') or 'No preference'}
- Atmosphere: {', '.join(merged_preferences.get('atmosphere', [])) or 'No preference'}
- Flavor Notes: {', '.join(merged_preferences.get('flavorNotes', [])) or 'No preference'}
"""
            
            # Create LLM prompt (similar to individual but emphasizes group dining)
            prompt = f"""You are a restaurant recommendation expert. Analyze these restaurants and select the TOP 3 that best match the GROUP's query and merged preferences.

USER'S QUERY: "{query}"

GROUP'S MERGED PREFERENCES:{prefs_text}

NOTE: These are MERGED preferences from {len(user_ids)} people dining together. The restaurants should accommodate the group and match their combined tastes.

AVAILABLE RESTAURANTS:
{restaurants_text}

TASK:
1. Analyze how well each restaurant matches the query "{query}"
2. Consider the GROUP's merged preferences (cuisines, price, atmosphere)
3. Select the TOP 3 best matches for GROUP DINING
4. Provide BRIEF reasoning (1-2 sentences max per restaurant)

Return ONLY valid JSON (no markdown, no code blocks):
{{
  "top_restaurants": [
    {{
      "name": "Restaurant Name",
      "cuisine": "Cuisine Type",
      "rating": 4.5,
      "address": "Full address",
      "price_level": 2,
      "match_score": 0.95,
      "reason": "Brief reason why this matches"
    }}
  ],
  "overall_reasoning": "1-2 sentences about the selection strategy"
}}

Return TOP 3 restaurants in order of best match."""
            
            # Call Gemini
            response = self.gemini_service.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up markdown if present
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
            
            # Add metadata
            result["status"] = "success"
            result["stage"] = "group - LLM analysis"
            result["query"] = query
            result["user_count"] = len(user_ids)
            result["merged_preferences"] = merged_preferences
            result["location"] = {
                "latitude": latitude,
                "longitude": longitude
            }
            
            print(f"[GROUP RESTAURANT SEARCH] ✅ LLM ranked top {len(result.get('top_restaurants', []))} restaurants for group")
            return result
            
        except Exception as e:
            print(f"[GROUP RESTAURANT SEARCH ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Fallback
            merged_preferences = self.taste_profile_service.merge_multiple_user_preferences(user_ids)
            restaurants = self.get_nearby_restaurants_tool(
                latitude=latitude,
                longitude=longitude,
                radius=1000,
                limit=10
            )
            
            return {
                "status": "success",
                "stage": "group - Fallback",
                "error": str(e),
                "query": query,
                "user_count": len(user_ids),
                "merged_preferences": merged_preferences,
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

