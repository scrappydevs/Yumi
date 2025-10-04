"""
Restaurant Search Service - Natural language restaurant search using LLM with tool calls.

This service orchestrates:
1. Getting user preferences from taste profile
2. Finding nearby restaurants from database
3. Using LLM to intelligently rank results based on user query and quality
"""
import os
import math
from difflib import get_close_matches
from typing import Dict, Any, List, Optional
from services.gemini_service import get_gemini_service
from services.supabase_service import get_supabase_service
from services.taste_profile_service import get_taste_profile_service
from services.restaurant_db_service import get_restaurant_db_service


class RestaurantSearchService:
    """Service for natural language restaurant search with LLM tool calls."""

    def __init__(self):
        """Initialize with required services."""
        self.gemini_service = get_gemini_service()
        self.supabase_service = get_supabase_service()
        self.taste_profile_service = get_taste_profile_service()
        self.restaurant_db_service = get_restaurant_db_service()

        print(f"[RESTAURANT SEARCH] Service initialized (using database)")

    def get_user_preferences_tool(self, user_id: str) -> Dict[str, Any]:
        """
        Tool function: Fetch user's dining preferences.

        Args:
            user_id: User UUID

        Returns:
            Preferences dict with cuisines, atmospheres, price_hints
        """
        try:
            print(f"[TOOL] get_user_preferences called for user: {user_id}")

            # Get natural language preferences text
            preferences_text = self.taste_profile_service.get_current_preferences_text(
                user_id)

            if not preferences_text:
                print(
                    f"[TOOL] No preferences found, user likes all good food and vibes")
                return {
                    "preferences_text": "User has no specific preferences yet. Assume they like good quality food with positive vibes and high ratings.",
                    "cuisines": [],
                    "atmospheres": [],
                    "price_hints": []
                }

            # Parse preferences into structured format
            structured = self.taste_profile_service.parse_preferences_to_structured(
                preferences_text)

            result = {
                "preferences_text": preferences_text,
                "cuisines": structured.get("cuisines", []),
                "atmospheres": structured.get("atmospheres", []),
                "price_hints": structured.get("price_hints", [])
            }

            print(
                f"[TOOL] Retrieved preferences: {len(result['cuisines'])} cuisines, {len(result['atmospheres'])} vibes")
            return result

        except Exception as e:
            print(f"[TOOL ERROR] Failed to get preferences: {str(e)}")
            import traceback
            traceback.print_exc()
            # Return default preferences on error
            return {
                "preferences_text": "User has no specific preferences yet. Assume they like good quality food with positive vibes and high ratings.",
                "cuisines": [],
                "atmospheres": [],
                "price_hints": []
            }

    def get_nearby_restaurants_tool(
        self,
        latitude: float,
        longitude: float,
        radius: int = 4828,  # 3 miles default
        limit: int = 50,
        min_rating: float = 4.0,
        cuisine_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Tool function: Get nearby restaurants from database.

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            radius: Search radius in meters (default: 4828m = 3 miles)
            limit: Maximum number of restaurants to return (default: 50)
            min_rating: Minimum rating filter (default: 4.0)
            cuisine_filter: Optional cuisine type to filter by

        Returns:
            List of restaurant dicts with place_id, name, cuisine, rating, etc.
        """
        try:
            print(
                f"[TOOL] get_nearby_restaurants called at ({latitude}, {longitude})")
            print(
                f"[TOOL] Radius: {radius}m ({radius/1609.34:.1f} miles), Min Rating: {min_rating}")
            if cuisine_filter:
                print(f"[TOOL] Filtering for cuisine: {cuisine_filter}")

            # Get restaurants from database
            restaurants = self.restaurant_db_service.get_nearby_restaurants(
                latitude=latitude,
                longitude=longitude,
                radius_meters=radius,
                limit=limit * 2,  # Get more for filtering
                min_rating=min_rating
            )

            # Apply cuisine filter if specified
            if cuisine_filter and restaurants:
                original_count = len(restaurants)
                restaurants = [
                    r for r in restaurants
                    if cuisine_filter.lower() in (r.get('cuisine') or '').lower()
                ]
                print(
                    f"[TOOL] Cuisine filter: {original_count} → {len(restaurants)} restaurants")

            # Sort by quality score: rating * log(reviews + 1)
            # This balances high ratings with popularity
            for r in restaurants:
                review_count = r.get('user_ratings_total', 0) or 0
                r['quality_score'] = r['rating'] * math.log(review_count + 1)

            restaurants.sort(key=lambda r: r['quality_score'], reverse=True)
            restaurants = restaurants[:limit]

            print(f"[TOOL] Found {len(restaurants)} high-quality restaurants")
            return restaurants

        except Exception as e:
            print(f"[TOOL ERROR] Failed to get nearby restaurants: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    def fuzzy_match_restaurant(
        self,
        llm_name: str,
        restaurant_list: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Fuzzy match LLM restaurant name against actual restaurant list.

        Args:
            llm_name: Restaurant name from LLM response
            restaurant_list: List of actual restaurant dicts

        Returns:
            Matching restaurant dict or None
        """
        restaurant_names = [r['name'] for r in restaurant_list]
        matches = get_close_matches(
            llm_name, restaurant_names, n=1, cutoff=0.6)

        if matches:
            matched_name = matches[0]
            return next(r for r in restaurant_list if r['name'] == matched_name)

        return None

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

        Two-path approach:
        - Path A: Cuisine detected → get restaurants for that cuisine
        - Path B: No cuisine → get all good restaurants, filter by user's top cuisines

        Args:
            query: User's natural language query
            user_id: User UUID
            latitude: User's latitude
            longitude: User's longitude

        Returns:
            Search results with top 3-4 restaurants and reasoning
        """
        import time
        search_start = time.time()

        print(f"\n{'='*80}")
        print(f"[RESTAURANT SEARCH] 🍽️  STARTING SEARCH SERVICE")
        print(f"{'='*80}")
        print(f"[RESTAURANT SEARCH] Query: '{query}'")
        print(f"[RESTAURANT SEARCH] User: {user_id[:8]}...")
        print(f"[RESTAURANT SEARCH] Location: ({latitude}, {longitude})")
        try:
            # Step 1: Get user preferences
            step1_start = time.time()
            print(f"[RESTAURANT SEARCH] ⏱️  Step 1/4: Getting user preferences...")
            preferences = self.get_user_preferences_tool(user_id)
            print(
                f"[RESTAURANT SEARCH] ✅ Step 1 completed in {time.time() - step1_start:.2f}s")
            print(
                f"[RESTAURANT SEARCH]    Found cuisines: {preferences.get('cuisines', [])[:3]}")

            # Step 2: Detect cuisine from query
            cuisine_keywords = ['italian', 'japanese', 'chinese', 'mexican', 'thai', 'indian',
                                'french', 'korean', 'vietnamese', 'greek', 'american', 'pizza',
                                'sushi', 'ramen', 'tacos', 'burgers', 'seafood', 'mediterranean',
                                'spanish', 'middle eastern', 'ethiopian', 'caribbean', 'brazilian']
            detected_cuisine = None
            query_lower = query.lower()
            for cuisine in cuisine_keywords:
                if cuisine in query_lower:
                    detected_cuisine = cuisine
                    print(
                        f"[RESTAURANT SEARCH] Detected cuisine in query: {detected_cuisine}")
                    break

            restaurants = []
            step2_start = time.time()

            if detected_cuisine:
                # PATH A: Cuisine detected in query
                print(
                    f"[RESTAURANT SEARCH] Path A: Getting {detected_cuisine} restaurants within 3 miles...")
                restaurants = self.get_nearby_restaurants_tool(
                    latitude=latitude,
                    longitude=longitude,
                    radius=4828,  # 3 miles
                    limit=30,
                    min_rating=4.0,
                    cuisine_filter=detected_cuisine
                )

                if not restaurants:
                    print(
                        f"[RESTAURANT SEARCH] No {detected_cuisine} restaurants found, expanding search...")
                    # Try without cuisine filter but still 4.0+
                    restaurants = self.get_nearby_restaurants_tool(
                        latitude=latitude,
                        longitude=longitude,
                        radius=4828,
                        limit=30,
                        min_rating=4.0
                    )
            else:
                # PATH B: No cuisine detected
                print(
                    f"[RESTAURANT SEARCH] Path B: No cuisine detected, getting all 4.0+ restaurants...")

                # Get all good restaurants (4.0+ rating)
                restaurants = self.get_nearby_restaurants_tool(
                    latitude=latitude,
                    longitude=longitude,
                    radius=4828,  # 3 miles
                    limit=50,
                    min_rating=4.0
                )

                # If user has cuisine preferences, filter to top 2 cuisines
                if preferences.get('cuisines'):
                    top_cuisines = preferences['cuisines'][:2]
                    print(
                        f"[RESTAURANT SEARCH] Filtering to user's top cuisines: {top_cuisines}")

                    filtered = [
                        r for r in restaurants
                        if any(c.lower() in (r.get('cuisine') or '').lower() for c in top_cuisines)
                    ]

                    if filtered:
                        print(
                            f"[RESTAURANT SEARCH] Filtered: {len(restaurants)} → {len(filtered)} restaurants")
                        restaurants = filtered
                    else:
                        print(
                            f"[RESTAURANT SEARCH] No matches for preferred cuisines, keeping all results")
            if not restaurants:
                return {
                    "status": "success",
                    "query": query,
                    "top_restaurants": [],
                    "message": "No restaurants found nearby",
                    "location": {"latitude": latitude, "longitude": longitude}
                }

            # Step 3: Format data for LLM with quality-focused ranking
            step3_start = time.time()
            print(f"\n{'='*80}")
            print(f"[RESTAURANT SEARCH] 🤖 STEP 3: LLM ANALYSIS & RANKING")
            print(
                f"[RESTAURANT SEARCH] Preparing {len(restaurants)} restaurants for LLM...")
            print(f"[RESTAURANT SEARCH] Restaurant candidates:")
            for i, r in enumerate(restaurants[:15], 1):
                reviews = r.get('user_ratings_total', 0)
                distance = r.get('distance_meters', 0)
                print(f"[RESTAURANT SEARCH]   {i}. {r['name']}")
                print(
                    f"[RESTAURANT SEARCH]      Cuisine: {r['cuisine']}, Rating: {r['rating']}⭐, Reviews: {reviews}, Distance: {distance}m")

            # Build restaurants list for prompt with quality metrics
            restaurants_text = "\n".join([
                f"{i+1}. {r['name']}\n"
                f"   - Cuisine: {r['cuisine']}\n"
                f"   - Rating: {r['rating']}⭐ ({r.get('user_ratings_total', 0)} reviews)\n"
                f"   - Price: {'$' * (r.get('price_level') or 2)}\n"
                f"   - Atmosphere: {r.get('atmosphere') or 'Not specified'}\n"
                f"   - Address: {r['address']}"
                for i, r in enumerate(restaurants)
            ])

            # Build preferences text
            prefs_text = preferences.get(
                'preferences_text', 'No preferences specified')
            cuisines_list = preferences.get('cuisines', [])
            atmospheres_list = preferences.get('atmospheres', [])

            print(f"[RESTAURANT SEARCH] User preferences being sent to LLM:")
            print(
                f"[RESTAURANT SEARCH]   - Preferred cuisines: {cuisines_list}")
            print(
                f"[RESTAURANT SEARCH]   - Preferred vibes: {atmospheres_list}")
            print(f"[RESTAURANT SEARCH]   - Full preference text: {prefs_text[:150]}..." if len(
                prefs_text) > 150 else f"[RESTAURANT SEARCH]   - Full preference text: {prefs_text}")

            # Create LLM prompt with quality-focused ranking
            prompt = f"""You are a restaurant recommendation expert. Analyze these restaurants and select the TOP 3-4 that best match the user's query.

USER'S QUERY: "{query}"

USER'S PREFERENCES:
{prefs_text}

Preferred Cuisines: {', '.join(cuisines_list) if cuisines_list else 'Open to all cuisines'}
Preferred Vibes: {', '.join(atmospheres_list) if atmospheres_list else 'Open to all atmospheres'}

AVAILABLE RESTAURANTS:
{restaurants_text}

RANKING CRITERIA (in priority order):

1. **QUERY MATCH (30%)**: Does the restaurant match what the user explicitly asked for?
   - If query mentions specific cuisine, ONLY recommend that cuisine
   - If query mentions atmosphere (e.g., "romantic", "casual"), prioritize that

2. **RATING QUALITY (40%)**: Higher ratings are better
   - 4.5-5.0 stars = Excellent (weight: 1.0)
   - 4.2-4.4 stars = Very Good (weight: 0.8)
   - 4.0-4.1 stars = Good (weight: 0.6)

3. **POPULARITY (30%)**: More reviews indicate reliability
   - 500+ reviews = Very reliable (weight: 1.0)
   - 200-499 reviews = Reliable (weight: 0.8)
   - 100-199 reviews = Moderately reliable (weight: 0.6)
   - 50-99 reviews = Less reliable (weight: 0.4)
   - < 50 reviews = Unproven (weight: 0.2)

4. **USER PREFERENCES (Secondary)**: Use only when query doesn't specify
   - Match preferred cuisines if query is vague
   - Match preferred atmospheres/vibes

EXAMPLES:
- Query "best indian food" + 4.7⭐ (300 reviews) vs 4.2⭐ (50 reviews) → Choose 4.7⭐
- Query "romantic dinner" → Prioritize upscale/intimate atmospheres
- Query "food near me" + User likes Italian → Prioritize Italian restaurants with high ratings

TASK:
1. Calculate match_score for each restaurant (0.0-1.0) using the formula:
   match_score = (query_match × 0.3) + (rating_score × 0.4) + (popularity_score × 0.3)

2. Select TOP 3-4 restaurants with highest scores
3. Provide BRIEF reasoning (1-2 sentences max)

Return ONLY valid JSON (no markdown, no code blocks):
{{
  "top_restaurants": [
    {{
      "name": "Restaurant Name",
      "cuisine": "Cuisine Type",
      "rating": 4.5,
      "user_ratings_total": 250,
      "address": "Full address",
      "price_level": 2,
      "match_score": 0.92,
      "reasoning": "Perfect match for indian food query with excellent 4.7 rating and 300+ reviews showing consistency"
    }},
    {{
      "name": "Second Restaurant",
      "cuisine": "Cuisine",
      "rating": 4.3,
      "user_ratings_total": 180,
      "address": "Address",
      "price_level": 2,
      "match_score": 0.85,
      "reasoning": "Strong cuisine match with very good rating and solid review count"
    }},
    {{
      "name": "Third Restaurant",
      "cuisine": "Cuisine",
      "rating": 4.2,
      "user_ratings_total": 120,
      "address": "Address",
      "price_level": 3,
      "match_score": 0.78,
      "reasoning": "Good option with reliable rating"
    }}
  ]
}}

IMPORTANT:
- Return 3-4 restaurants (no more, no less)
- Keep reasoning VERY concise (max 15 words)
- Prioritize objective quality (rating + reviews) over subjective preferences
- Match_score must reflect the ranking formula above

"""

            print(f"\n[RESTAURANT SEARCH] 📤 FULL LLM PROMPT:")
            print(f"{'─'*80}")
            print(prompt)
            print(f"{'─'*80}")
            print(f"[RESTAURANT SEARCH] Prompt stats:")
            print(f"[RESTAURANT SEARCH]   - Total length: {len(prompt)} chars")
            print(f"[RESTAURANT SEARCH]   - Query: '{query}'")
            print(
                f"[RESTAURANT SEARCH]   - User cuisines: {cuisines_list[:2] if cuisines_list else 'None'}")
            print(
                f"[RESTAURANT SEARCH]   - Restaurants in prompt: {len(restaurants)}")
            print(f"[RESTAURANT SEARCH] 🤖 Calling Gemini LLM...")

            # Step 4: Call Gemini LLM
            step4_start = time.time()
            print(f"\n[RESTAURANT SEARCH] ⏱️  Step 4/4: Calling Gemini AI...")
            print(f"[RESTAURANT SEARCH]    🤖 Waiting for LLM response...")

            try:
                model = self.gemini_service.model
                response = model.generate_content(prompt)
                llm_elapsed = time.time() - step4_start
                print(
                    f"[RESTAURANT SEARCH] ✅ Gemini responded in {llm_elapsed:.2f}s")
                response_text = response.text.strip()
                print(
                    f"[RESTAURANT SEARCH]    Response length: {len(response_text)} characters")
            except Exception as e:
                llm_elapsed = time.time() - step4_start
                print(
                    f"[RESTAURANT SEARCH] ❌ Gemini error after {llm_elapsed:.2f}s: {str(e)}")
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
            print(f"[RESTAURANT SEARCH]    Parsing JSON response...")
            try:
                result = json.loads(response_text)
                print(f"[RESTAURANT SEARCH]    ✅ JSON parsed successfully")
            except json.JSONDecodeError as e:
                print(f"[RESTAURANT SEARCH]    ❌ JSON parse error: {str(e)}")
                print(
                    f"[RESTAURANT SEARCH]    Response text preview: {response_text[:200]}...")
                raise

            # Log what LLM recommended
            print(f"\n[RESTAURANT SEARCH] 📋 LLM recommendations:")
            for i, rec in enumerate(result.get('top_restaurants', []), 1):
                print(
                    f"       {i}. {rec.get('name')} - {rec.get('cuisine')} - {rec.get('reasoning', 'No reason')[:50]}...")

            # CRITICAL: Enrich LLM results with full restaurant data using fuzzy matching
            print(
                f"\n[RESTAURANT SEARCH] 🔗 ENRICHING LLM RESULTS WITH DATABASE DATA")
            enriched_restaurants = []
            for i, llm_rec in enumerate(result.get('top_restaurants', []), 1):
                llm_name = llm_rec['name']
                print(f"[RESTAURANT SEARCH] {i}. Looking up '{llm_name}'...")

                # Try exact match first
                matching = next(
                    (r for r in restaurants if r['name'] == llm_name), None)

                # Fall back to fuzzy matching
                if not matching:
                    print(
                        f"[RESTAURANT SEARCH]    No exact match, trying fuzzy matching...")
                    matching = self.fuzzy_match_restaurant(
                        llm_name, restaurants)

                if matching:
                    # Merge: LLM fields (reasoning, match_score) + original fields (place_id, photo_url, etc.)
                    enriched = {**matching, **llm_rec}
                    enriched_restaurants.append(enriched)
                    print(
                        f"[RESTAURANT SEARCH]    ✅ Matched to '{matching['name']}'")
                    print(
                        f"[RESTAURANT SEARCH]       - place_id: {matching.get('place_id', 'N/A')}")
                    print(
                        f"[RESTAURANT SEARCH]       - Distance: {matching.get('distance_meters', 'N/A')}m")
                else:
                    # Fallback: keep LLM result as-is (shouldn't happen, but safety)
                    print(f"[RESTAURANT SEARCH]    ⚠️ No match found in database!")
                    enriched_restaurants.append(llm_rec)

            # Ensure we have 3-4 restaurants
            if len(enriched_restaurants) < 3 and len(restaurants) >= 3:
                print(
                    f"\n[RESTAURANT SEARCH] ⚠️ LLM returned only {len(enriched_restaurants)} restaurants, filling to 3...")
                # Add top-rated restaurants that weren't selected
                for r in restaurants:
                    if r['name'] not in [e['name'] for e in enriched_restaurants]:
                        print(
                            f"[RESTAURANT SEARCH]    Adding fallback: {r['name']} ({r['rating']}⭐)")
                        enriched_restaurants.append({
                            **r,
                            'match_score': 0.5,
                            'reasoning': 'High quality alternative option'
                        })
                        if len(enriched_restaurants) >= 3:
                            break

            # Cap at 4
            enriched_restaurants = enriched_restaurants[:4]

            result['top_restaurants'] = enriched_restaurants
            # Top 20 for map display
            result['all_nearby_restaurants'] = restaurants[:20]

            # Add metadata
            result["status"] = "success"
            result["query"] = query
            result["path"] = "A - Cuisine detected" if detected_cuisine else "B - No cuisine"
            result["location"] = {
                "latitude": latitude,
                "longitude": longitude
            }

            total_elapsed = time.time() - search_start
            print(f"\n{'='*80}")
            print(f"[RESTAURANT SEARCH] ✅ SEARCH COMPLETED SUCCESSFULLY")
            print(f"{'='*80}")
            print(f"[RESTAURANT SEARCH] Total time: {total_elapsed:.2f}s")
            print(
                f"[RESTAURANT SEARCH]    - Step 1 (Preferences): ~{time.time() - step1_start:.2f}s")
            print(
                f"[RESTAURANT SEARCH]    - Step 2 (Find Restaurants): ~{time.time() - step2_start:.2f}s")
            print(
                f"[RESTAURANT SEARCH]    - Step 3 (Build Prompt): ~{time.time() - step3_start:.2f}s")
            print(
                f"[RESTAURANT SEARCH]    - Step 4 (LLM Call): ~{llm_elapsed:.2f}s")
            print(
                f"[RESTAURANT SEARCH] Returning {len(result.get('top_restaurants', []))} top restaurants")
            print(f"{'='*80}\n")

            # Clean up
            self._current_search_cuisine = None
            return result

        except Exception as e:
            print(f"[RESTAURANT SEARCH ERROR] {str(e)}")
            import traceback
            traceback.print_exc()

            # Fallback: return top-rated restaurants without LLM
            try:
                restaurants = self.get_nearby_restaurants_tool(
                    latitude=latitude,
                    longitude=longitude,
                    radius=4828,
                    limit=20,
                    min_rating=4.0
                )

                # Return top 4 by quality score
                top_restaurants = restaurants[:4]

                return {
                    "status": "success",
                    "error": str(e),
                    "query": query,
                    "top_restaurants": top_restaurants,
                    "all_nearby_restaurants": restaurants[:20],
                    "location": {
                        "latitude": latitude,
                        "longitude": longitude
                    }
                }
            except Exception as fallback_error:
                print(
                    f"[RESTAURANT SEARCH ERROR] Fallback also failed: {str(fallback_error)}")
                return {
                    "status": "error",
                    "error": str(e),
                    "query": query,
                    "top_restaurants": [],
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
            print(
                f"[GROUP RESTAURANT SEARCH] Step 1: Merging preferences for {len(user_ids)} users...")
            merged_preferences = self.taste_profile_service.merge_multiple_user_preferences(
                user_ids)
            print(
                f"[GROUP RESTAURANT SEARCH] Merged preferences: {merged_preferences}")

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
            print(
                f"[GROUP RESTAURANT SEARCH] Step 3: Asking LLM to analyze for group...")

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
                matching = next(
                    (r for r in restaurants if r['name'] == llm_rec['name']), None)
                if matching:
                    enriched = {**matching, **llm_rec}
                    enriched_restaurants.append(enriched)
                    print(
                        f"  ✓ Enriched {llm_rec['name']} with place_id: {matching.get('place_id', 'N/A')}")
                else:
                    print(
                        f"  ⚠️ No match found for {llm_rec['name']}, keeping LLM data only")
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

            print(
                f"[GROUP RESTAURANT SEARCH] ✅ LLM ranked top {len(result.get('top_restaurants', []))} restaurants for group")
            return result

        except Exception as e:
            print(f"[GROUP RESTAURANT SEARCH ERROR] {str(e)}")
            import traceback
            traceback.print_exc()

            # Fallback
            merged_preferences = self.taste_profile_service.merge_multiple_user_preferences(
                user_ids)
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
