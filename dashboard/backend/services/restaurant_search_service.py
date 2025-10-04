"""
Restaurant Search Service - Natural language restaurant search using LLM with tool calls.

This service orchestrates:
1. Getting user preferences from taste profile
2. Finding nearby restaurants from Places API OR database
3. Using LLM to intelligently rank results based on user query
"""
import os
from typing import Dict, Any, List, Optional
from services.gemini_service import get_gemini_service
from services.supabase_service import get_supabase_service
from services.places_service import get_places_service
from services.taste_profile_service import get_taste_profile_service
from services.restaurant_db_service import get_restaurant_db_service


class RestaurantSearchService:
    """Service for natural language restaurant search with LLM tool calls."""
    
    def __init__(self):
        """Initialize with required services."""
        self.gemini_service = get_gemini_service()
        self.supabase_service = get_supabase_service()
        self.places_service = get_places_service()
        self.taste_profile_service = get_taste_profile_service()
        self.restaurant_db_service = get_restaurant_db_service()
        
        # Feature flag: Use database instead of Google Places API
        self.use_database = os.getenv('USE_DB_RESTAURANTS', 'true').lower() == 'true'
        
        source = "database" if self.use_database else "Google Places API"
        print(f"[RESTAURANT SEARCH] Service initialized (using {source})")
    
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
        Tool function: Get nearby restaurants from database or Google Places API.
        
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
            
            restaurants = []
            
            if self.use_database:
                # Use database for restaurant search with smart radius expansion
                print(f"[TOOL] Using database for restaurant search")
                
                # First, try to detect cuisine from context (if available)
                # This will be set by the parent search_restaurants method
                requested_cuisine = getattr(self, '_current_search_cuisine', None)
                
                # Try increasing radii, but check for cuisine matches
                search_radii = [radius, 5000, 10000, 20000]  # 1km, 5km, 10km, 20km
                
                for search_radius in search_radii:
                    if search_radius != radius:
                        print(f"[TOOL] No matching cuisine at {radius}m, expanding to {search_radius}m...")
                    
                    restaurants = self.restaurant_db_service.get_nearby_restaurants(
                        latitude=latitude,
                        longitude=longitude,
                        radius_meters=search_radius,
                        limit=limit
                    )
                    
                    if restaurants:
                        # Check if we found matching cuisines
                        if requested_cuisine:
                            matching = [r for r in restaurants if requested_cuisine.lower() in (r.get('cuisine') or '').lower()]
                            if matching:
                                print(f"[TOOL] Found {len(matching)} {requested_cuisine} restaurants at {search_radius}m radius")
                                restaurants = matching[:limit]  # Prioritize matching cuisine
                                break
                            elif search_radius == search_radii[-1]:
                                # Last radius, return what we have
                                print(f"[TOOL] No {requested_cuisine} restaurants found, returning {len(restaurants)} other options")
                                break
                        else:
                            # No cuisine filter, just return results
                            print(f"[TOOL] Found {len(restaurants)} restaurants at {search_radius}m radius")
                            break
                
                if not restaurants:
                    print(f"[TOOL] No restaurants found even with 20km radius")
            else:
                # Use Google Places API
                print(f"[TOOL] Using Google Places API for restaurant search")
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
            
            # Step 1.5: Detect cuisine from query for smart radius expansion
            cuisine_keywords = ['italian', 'japanese', 'chinese', 'mexican', 'thai', 'indian', 
                              'french', 'korean', 'vietnamese', 'greek', 'american', 'pizza',
                              'sushi', 'ramen', 'tacos', 'burgers', 'seafood']
            detected_cuisine = None
            query_lower = query.lower()
            for cuisine in cuisine_keywords:
                if cuisine in query_lower:
                    detected_cuisine = cuisine
                    print(f"[RESTAURANT SEARCH] Detected cuisine in query: {detected_cuisine}")
                    break
            
            # Set on instance for the tool to use
            self._current_search_cuisine = detected_cuisine
            
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
            print(f"[RESTAURANT SEARCH] Restaurants found:")
            for i, r in enumerate(restaurants, 1):
                print(f"  {i}. {r['name']} - {r['cuisine']} ({r['rating']}⭐)")
            
            # Build restaurants list for prompt
            restaurants_text = "\n".join([
                f"{i+1}. {r['name']} - {r['cuisine']} ({r['rating']}⭐, {'$' * (r.get('price_level') or 2)}) - {r['address']}"
                for i, r in enumerate(restaurants)
            ])
            
            # Build preferences text
            prefs_text = f"""
- Favorite Cuisines: {', '.join(preferences.get('cuisines', [])) or 'None specified'}
- Price Range: {preferences.get('priceRange') or 'No preference'}
- Atmosphere: {', '.join(preferences.get('atmosphere', [])) or 'No preference'}
- Flavor Notes: {', '.join(preferences.get('flavorNotes', [])) or 'No preference'}
"""
            
            # Check if preferences are empty
            has_preferences = bool(preferences.get('cuisines') or preferences.get('priceRange') or 
                                 preferences.get('atmosphere') or preferences.get('flavorNotes'))
            
            # Create LLM prompt with edge case handling
            prompt = f"""You are a restaurant recommendation expert. Analyze these restaurants and select the TOP 3 that best match the user's query.

USER'S QUERY: "{query}"

USER'S PREFERENCES:{prefs_text}

AVAILABLE RESTAURANTS:
{restaurants_text}

RANKING RULES (PRIORITY ORDER):
1. **QUERY OVERRIDE**: If the query explicitly mentions a cuisine/food type (e.g., "Chinese food", "Italian restaurant"), ONLY recommend that type regardless of stored preferences.
2. **EMPTY PREFERENCES**: If preferences are empty or minimal, rely HEAVILY on the query and prioritize highly-rated restaurants.
3. **VAGUE QUERIES**: If query is vague (e.g., "food near me", "somewhere to eat"), use preferences as primary guide. If both are vague, prioritize highest ratings and variety.
4. **EXPLICIT REQUIREMENTS**: Always respect explicit query requirements (e.g., "outdoor seating", "cheap eats", "fancy dinner").
5. **PREFERENCES AS SECONDARY**: Use stored preferences only when query doesn't specify or contradict them.

EXAMPLES:
- Query "I want Chinese food" + Preferences "Italian, French" → Recommend ONLY Chinese (query wins)
- Query "somewhere good" + No preferences → Recommend top-rated, diverse options
- Query "romantic dinner" + Preferences "Casual" → Recommend romantic places (query wins)
- Query "food" + Preferences "Mexican, Spicy" → Recommend Mexican restaurants (preferences guide)

TASK:
1. Identify if query has specific requirements (cuisine, atmosphere, price, etc.)
2. Apply ranking rules above
3. Select TOP 3 matches
4. Provide BRIEF reasoning explaining your choice

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
      "reasoning": "Brief 1-2 sentence explanation"
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
  "query_analysis": "What did the user explicitly ask for?",
  "preference_matching": "How did you balance query vs preferences?"
}}

USER HAS {'MINIMAL' if not has_preferences else 'FULL'} PREFERENCES - adjust weighting accordingly.

IMPORTANT: Keep reasoning CONCISE - maximum 1-2 sentences each."""
            
            print(f"[RESTAURANT SEARCH] Prompt being sent to LLM:")
            print(f"  Query: {query}")
            print(f"  Preferences: {preferences.get('cuisines', [])[:3]}...")
            print(f"  Restaurants in prompt: {len(restaurants)}")
            
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

            # Log what LLM recommended
            print(f"[RESTAURANT SEARCH] LLM recommendations:")
            for i, rec in enumerate(result.get('top_restaurants', []), 1):
                print(f"  {i}. {rec.get('name')} - {rec.get('cuisine')} - {rec.get('reasoning', 'No reason')[:50]}")

            # CRITICAL: Enrich LLM results with full restaurant data (place_id, photo_url, etc.)
            # Match by name and merge fields from original restaurants list
            enriched_restaurants = []
            for llm_rec in result.get('top_restaurants', []):
                # Find matching restaurant from original list by name
                matching = next((r for r in restaurants if r['name'] == llm_rec['name']), None)
                if matching:
                    # Merge: LLM fields (reasoning, match_score) + original fields (place_id, photo_url, etc.)
                    enriched = {**matching, **llm_rec}
                    enriched_restaurants.append(enriched)
                    print(f"  ✓ Enriched {llm_rec['name']} with place_id: {matching.get('place_id', 'N/A')}")
                else:
                    # Fallback: keep LLM result as-is (shouldn't happen, but safety)
                    print(f"  ⚠️ No match found for {llm_rec['name']}, keeping LLM data only")
                    enriched_restaurants.append(llm_rec)

            result['top_restaurants'] = enriched_restaurants
            result['all_nearby_restaurants'] = restaurants  # Include all nearby for frontend fallback

            # Add metadata
            result["status"] = "success"
            result["stage"] = "4 - LLM analysis"
            result["query"] = query
            result["location"] = {
                "latitude": latitude,
                "longitude": longitude
            }
            
            print(f"[RESTAURANT SEARCH] ✅ LLM ranked top {len(result.get('top_restaurants', []))} restaurants")
            
            # Clean up
            self._current_search_cuisine = None
            
            return result
            
        except Exception as e:
            # Clean up on error too
            self._current_search_cuisine = None
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
                f"{i+1}. {r['name']} - {r['cuisine']} ({r['rating']}⭐, {'$' * (r.get('price_level') or 2)}) - {r['address']}"
                for i, r in enumerate(restaurants)
            ])
            
            # Build merged preferences text
            prefs_text = f"""
- Favorite Cuisines: {', '.join(merged_preferences.get('cuisines', [])) or 'None specified'}
- Price Range: {merged_preferences.get('priceRange') or 'No preference'}
- Atmosphere: {', '.join(merged_preferences.get('atmosphere', [])) or 'No preference'}
- Flavor Notes: {', '.join(merged_preferences.get('flavorNotes', [])) or 'No preference'}
"""
            
            # Check if merged preferences are substantial
            has_group_preferences = bool(merged_preferences.get('cuisines') or merged_preferences.get('priceRange') or 
                                       merged_preferences.get('atmosphere') or merged_preferences.get('flavorNotes'))
            
            # Create LLM prompt with edge case handling for groups
            prompt = f"""You are a restaurant recommendation expert. Analyze these restaurants and select the TOP 3 for a GROUP of {len(user_ids)} people dining together.

USER'S QUERY: "{query}"

GROUP'S MERGED PREFERENCES:{prefs_text}

AVAILABLE RESTAURANTS:
{restaurants_text}

GROUP RANKING RULES (PRIORITY ORDER):
1. **QUERY OVERRIDE**: If the query explicitly mentions cuisine/food type (e.g., "Chinese food"), ONLY recommend that type regardless of group preferences.
2. **EMPTY GROUP PREFERENCES**: If group has minimal/no preferences, rely on query and prioritize:
   - Highly-rated restaurants
   - Diverse menu options (good for groups with varied tastes)
   - Group-friendly atmosphere (casual, spacious)
3. **VAGUE QUERIES**: If query is vague (e.g., "food for group"), use merged preferences. If both vague, prioritize:
   - Highest ratings
   - Restaurants that can accommodate groups
   - Diverse cuisines from merged preferences
4. **EXPLICIT GROUP NEEDS**: Respect requirements like "vegetarian options", "large tables", "family-friendly", "cheap eats"
5. **CONFLICT RESOLUTION**: When group has diverse preferences (e.g., "Italian + Japanese + Mexican"), look for:
   - Fusion restaurants
   - Places with varied menu
   - Or pick best-rated from each cuisine type
6. **PREFERENCES AS SECONDARY**: Use merged preferences only when query doesn't override

EXAMPLES:
- Query "Chinese food" + Group wants "Italian, French" → ONLY Chinese (query wins)
- Query "where should we eat?" + Group wants "Mexican, Spicy" → Mexican restaurants
- Query "lunch spot" + No group preferences → High-rated, group-friendly, diverse menus
- Query "vegan options" + Group wants "Steakhouse" → Vegan-friendly places (query wins)

GROUP CONTEXT:
- Dining with {len(user_ids)} people - ensure restaurants can accommodate
- Merged preferences represent ALL members - aim to satisfy everyone
- Group dynamics matter - consider noise level, seating, varied menu

TASK:
1. Identify if query has specific requirements
2. Apply ranking rules above
3. Select TOP 3 that work for the ENTIRE group
4. Explain your reasoning

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
      "reason": "Brief reason (mention query override if applied, note group suitability)"
    }},
    {{
      "name": "Second Restaurant",
      "cuisine": "Cuisine",
      "rating": 4.3,
      "address": "Address",
      "price_level": 2,
      "match_score": 0.85,
      "reason": "Brief reason"
    }},
    {{
      "name": "Third Restaurant",
      "cuisine": "Cuisine",
      "rating": 4.2,
      "address": "Address",
      "price_level": 3,
      "match_score": 0.78,
      "reason": "Brief reason"
    }}
  ],
  "overall_reasoning": "How you balanced query vs group preferences"
}}

GROUP HAS {'MINIMAL' if not has_group_preferences else 'DIVERSE'} PREFERENCES - adjust accordingly.

IMPORTANT: Keep reasoning CONCISE - maximum 1-2 sentences each."""
            
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

            # CRITICAL: Enrich LLM results with full restaurant data (place_id, photo_url, etc.)
            enriched_restaurants = []
            for llm_rec in result.get('top_restaurants', []):
                matching = next((r for r in restaurants if r['name'] == llm_rec['name']), None)
                if matching:
                    enriched = {**matching, **llm_rec}
                    enriched_restaurants.append(enriched)
                    print(f"  ✓ Enriched {llm_rec['name']} with place_id: {matching.get('place_id', 'N/A')}")
                else:
                    print(f"  ⚠️ No match found for {llm_rec['name']}, keeping LLM data only")
                    enriched_restaurants.append(llm_rec)

            result['top_restaurants'] = enriched_restaurants
            result['all_nearby_restaurants'] = restaurants

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

