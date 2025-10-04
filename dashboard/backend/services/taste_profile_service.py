"""
Taste Profile Service - Auto-updates user preferences based on reviews AND implicit signals.

This service uses LLM analysis to extract taste insights from:
1. User reviews (explicit feedback)
2. Implicit signals (searches, clicks, reservations)

Preferences are stored as natural language narratives for rich, wholesome descriptions.
"""
import json
import os
from typing import Dict, Any, List, Optional
from services.gemini_service import GeminiService
from supabase_client import get_supabase


class TasteProfileService:
    """Service for managing and updating user taste profiles."""

    # Valid atmosphere tags
    ATMOSPHERE_TAGS = {
        "Casual", "Fine Dining", "Cozy", "Trendy",
        "Fast Casual", "Family-Friendly", "Romantic", "Lively"
    }

    # Valid price ranges
    PRICE_RANGES = {"$", "$$", "$$$", "$$$$"}

    def __init__(self):
        """Initialize with Gemini service and Supabase client."""
        self.gemini_service = GeminiService()
        self.supabase = get_supabase()
        print("[TASTE PROFILE] Service initialized")

    async def update_profile_from_review(
        self,
        user_id: str,
        review_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Main orchestrator: analyze review and update user's taste profile.

        Args:
            user_id: User UUID
            review_data: Full review data with joined image info

        Returns:
            Updated preferences dict
        """
        print(f"[TASTE PROFILE] Updating profile for user: {user_id}")

        # 1. Get current preferences
        current_prefs = self.get_current_preferences(user_id)
        print(f"[TASTE PROFILE] Current preferences: {current_prefs}")

        # 2. Analyze review with LLM
        new_insights = await self.analyze_review_with_llm(review_data, current_prefs)
        print(f"[TASTE PROFILE] New insights: {new_insights}")

        # 3. Merge preferences
        updated_prefs = self.merge_preferences(current_prefs, new_insights)
        print(f"[TASTE PROFILE] Merged preferences: {updated_prefs}")

        # 4. Save to database
        self.save_preferences(user_id, updated_prefs)
        print(f"[TASTE PROFILE] Preferences saved!")

        return updated_prefs

    def get_current_preferences(self, user_id: str) -> Dict[str, Any]:
        """
        Fetch and parse user's current preferences from profiles table.

        Args:
            user_id: User UUID

        Returns:
            Preferences dict with default structure if empty
        """
        try:
            response = self.supabase.table("profiles")\
                .select("preferences")\
                .eq("id", user_id)\
                .single()\
                .execute()

            if not response.data or not response.data.get("preferences"):
                # Return default structure
                return {
                    "cuisines": [],
                    "priceRange": "",
                    "atmosphere": [],
                    "flavorNotes": []
                }

            prefs_str = response.data["preferences"]
            prefs = json.loads(prefs_str) if isinstance(
                prefs_str, str) else prefs_str

            # Ensure all keys exist
            return {
                "cuisines": prefs.get("cuisines", []),
                "priceRange": prefs.get("priceRange", ""),
                "atmosphere": prefs.get("atmosphere", []),
                "flavorNotes": prefs.get("flavorNotes", [])
            }

        except Exception as e:
            print(
                f"[TASTE PROFILE ERROR] Failed to fetch preferences: {str(e)}")
            # Return default on error
            return {
                "cuisines": [],
                "priceRange": "",
                "atmosphere": [],
                "flavorNotes": []
            }

    def merge_multiple_user_preferences(
        self,
        user_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Merge preferences from multiple users for group restaurant search.

        Strategy:
        - Cuisines: Union of all users' favorite cuisines (up to 8 total)
        - Price range: Take the most expensive preference (to accommodate everyone's budget)
        - Atmosphere: Union of atmosphere preferences
        - Flavor notes: Union of flavor preferences

        Args:
            user_ids: List of user UUIDs to merge preferences for

        Returns:
            Merged preferences dict with combined preferences
        """
        if not user_ids:
            return {
                "cuisines": [],
                "priceRange": "",
                "atmosphere": [],
                "flavorNotes": []
            }

        print(f"[TASTE PROFILE] Merging preferences for {len(user_ids)} users")

        # Collect all preferences
        all_preferences = []
        for user_id in user_ids:
            prefs = self.get_current_preferences(user_id)
            all_preferences.append(prefs)
            print(
                f"[TASTE PROFILE] User {user_id[:8]}... preferences: {prefs}")

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

        print(f"[TASTE PROFILE] ✅ Merged preferences: {merged}")
        return merged

    async def analyze_review_with_llm(
        self,
        review_data: Dict[str, Any],
        current_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Use Gemini LLM to extract taste insights from review.

        Args:
            review_data: Review with image data
            current_preferences: User's current prefs

        Returns:
            Insights dict with cuisines_to_add, atmosphere_tags, etc.
        """
        # Extract review fields
        image_data = review_data.get("images", {}) or {}
        dish = image_data.get("dish", "Unknown")
        cuisine = image_data.get("cuisine", "Unknown")
        rating = review_data.get("overall_rating", 0)
        user_review = review_data.get("description", "")
        restaurant_name = review_data.get("restaurant_name", "")
        food_description = image_data.get("description", "")

        # Build prompt
        prompt = self._build_analysis_prompt(
            dish=dish,
            cuisine=cuisine,
            rating=rating,
            user_review=user_review,
            restaurant_name=restaurant_name,
            food_description=food_description,
            current_prefs=current_preferences
        )

        print(f"[TASTE PROFILE] Analyzing review with LLM...")

        # Call Gemini (using Flash for speed)
        try:
            # Use generate_content from Gemini model
            response = self.gemini_service.model.generate_content(prompt)

            # Parse JSON response
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            insights = json.loads(response_text)
            print(f"[TASTE PROFILE] LLM insights: {insights}")

            return insights

        except Exception as e:
            print(f"[TASTE PROFILE ERROR] LLM analysis failed: {str(e)}")
            # Return empty insights on error
            return {
                "cuisines_to_add": [],
                "cuisines_to_keep": current_preferences.get("cuisines", []),
                "atmosphere_tags": [],
                "price_preference": "",
                "flavor_notes": [],
                "reasoning": f"Error: {str(e)}"
            }

    def _build_analysis_prompt(
        self,
        dish: str,
        cuisine: str,
        rating: int,
        user_review: str,
        restaurant_name: str,
        food_description: str,
        current_prefs: Dict[str, Any]
    ) -> str:
        """Build the LLM prompt for taste analysis."""

        allowed_cuisines = list(GeminiService.ALLOWED_CUISINES)

        return f"""You are a food preference analyzer. Based on a user's new food review, extract taste insights.

Current Preferences:
{json.dumps(current_prefs, indent=2)}

New Review:
- Dish: {dish}
- Cuisine: {cuisine}
- Rating: {rating}/5 stars
- Restaurant: {restaurant_name}
- User's Opinion: "{user_review}"
- AI Description: {food_description}

Task: Extract taste insights from this review.

Return ONLY valid JSON (no markdown, no explanation):
{{
  "cuisines_to_add": ["cuisine1"],
  "cuisines_to_keep": ["existing1", "existing2"],
  "atmosphere_tags": ["Casual", "Cozy"],
  "price_preference": "$$",
  "flavor_notes": ["spicy", "savory"],
  "reasoning": "Brief explanation"
}}

Rules:
1. Only add cuisine to cuisines_to_add if rating >= 4
2. Cuisine must be from this allowed list: {allowed_cuisines[:20]}... (truncated for space)
3. Keep cuisines_to_keep to top 5 most important from current preferences
5. Atmosphere tags must be from: Casual, Fine Dining, Cozy, Trendy, Fast Casual, Family-Friendly, Romantic, Lively
6. If price is not explicitly mentioned by user, estimate the price (to the nearest $5). Price is in USD.
7. Extract flavor_notes from user's review (e.g., spicy, sweet, savory, rich, light)
8. Be conservative - only add preferences if there's strong evidence

Return valid JSON only."""

    def merge_preferences(
        self,
        current: Dict[str, Any],
        new_insights: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Intelligently merge current preferences with new insights.

        Args:
            current: Current preferences
            new_insights: Insights from LLM analysis

        Returns:
            Merged preferences dict
        """
        merged = current.copy()

        # 1. Merge cuisines
        cuisines_to_add = new_insights.get("cuisines_to_add", [])
        cuisines_to_keep = new_insights.get("cuisines_to_keep", [])

        # Start with kept cuisines, add new ones
        new_cuisines = list(set(cuisines_to_keep + cuisines_to_add))

        # Limit to top 5
        merged["cuisines"] = new_cuisines[:5]

        # 2. Merge atmosphere tags
        current_atmosphere = set(current.get("atmosphere", []))
        new_atmosphere = set(new_insights.get("atmosphere_tags", []))
        merged["atmosphere"] = list(current_atmosphere | new_atmosphere)

        # 3. Update price range (only if new one provided)
        new_price = new_insights.get("price_preference", "")
        if new_price and new_price in self.PRICE_RANGES:
            merged["priceRange"] = new_price

        # 4. Merge flavor notes
        current_flavors = set(current.get("flavorNotes", []))
        new_flavors = set(new_insights.get("flavor_notes", []))
        all_flavors = list(current_flavors | new_flavors)
        # Limit to 10 flavor notes
        merged["flavorNotes"] = all_flavors[:10]

        print(
            f"[TASTE PROFILE] Merge reasoning: {new_insights.get('reasoning', 'N/A')}")

        return merged

    def save_preferences(
        self,
        user_id: str,
        preferences: Dict[str, Any]
    ) -> None:
        """
        Save preferences to profiles.preferences column.

        Args:
            user_id: User UUID
            preferences: Preferences dict to save (can be JSON dict or natural language string)
        """
        try:
            # Handle both dict and string formats
            if isinstance(preferences, dict):
                prefs_json = json.dumps(preferences)
            else:
                prefs_json = preferences  # Already a string

            self.supabase.table("profiles")\
                .update({"preferences": prefs_json})\
                .eq("id", user_id)\
                .execute()

            print(f"[TASTE PROFILE] Saved preferences for user {user_id}")

        except Exception as e:
            print(
                f"[TASTE PROFILE ERROR] Failed to save preferences: {str(e)}")
            raise

    async def update_profile_from_implicit_signals(
        self,
        user_id: str,
        days: int = 30
    ) -> str:
        """
        Update user's taste profile based on recent implicit signals.
        Generates natural language preferences from searches, clicks, and reservations.

        Args:
            user_id: User UUID
            days: Number of days of interaction history to analyze (default: 30)

        Returns:
            Natural language preference text (2 paragraphs)
        """
        try:
            print(
                f"[TASTE PROFILE] Updating from implicit signals for user: {user_id}")

            # Import here to avoid circular dependency
            from services.implicit_signals_service import get_implicit_signals_service

            signals_service = get_implicit_signals_service()

            # Get interaction summary
            summary = signals_service.get_interaction_summary(
                user_id, days=days)

            if summary.get('total_interactions', 0) == 0:
                print(
                    f"[TASTE PROFILE] No interactions found, keeping existing preferences")
                return self.get_current_preferences_text(user_id)

            # Get current preferences (natural language)
            current_prefs_text = self.get_current_preferences_text(user_id)

            # Build LLM prompt to generate natural language preferences
            prompt = self._build_implicit_signals_prompt(
                summary, current_prefs_text)

            print(f"[TASTE PROFILE] Asking LLM to generate narrative preferences...")

            # Call Gemini to generate narrative
            response = self.gemini_service.model.generate_content(prompt)
            new_prefs_text = response.text.strip()

            print(
                f"[TASTE PROFILE] Generated preference narrative ({len(new_prefs_text)} chars)")

            # Save natural language preferences
            self.save_preferences(user_id, new_prefs_text)

            return new_prefs_text

        except Exception as e:
            print(
                f"[TASTE PROFILE ERROR] Failed to update from implicit signals: {str(e)}")
            import traceback
            traceback.print_exc()
            # Return existing preferences on error
            return self.get_current_preferences_text(user_id)

    def get_current_preferences_text(self, user_id: str) -> str:
        """
        Get user's current preferences as natural language text.

        Args:
            user_id: User UUID

        Returns:
            Natural language preferences text, or empty string if none exist
        """
        try:
            response = self.supabase.table("profiles")\
                .select("preferences")\
                .eq("id", user_id)\
                .single()\
                .execute()

            if not response.data or not response.data.get("preferences"):
                return ""

            prefs = response.data["preferences"]

            # Check if it's JSON (old format) or natural language (new format)
            try:
                # Try to parse as JSON
                json.loads(prefs)
                # If successful, it's old format - return empty to trigger migration
                return ""
            except (json.JSONDecodeError, TypeError):
                # It's natural language format - return as is
                return prefs if isinstance(prefs, str) else ""

        except Exception as e:
            print(
                f"[TASTE PROFILE ERROR] Failed to fetch preferences text: {str(e)}")
            return ""

    def _build_implicit_signals_prompt(
        self,
        summary: Dict[str, Any],
        current_prefs: str
    ) -> str:
        """
        Build LLM prompt to generate natural language preferences from implicit signals.

        Args:
            summary: Interaction summary with search queries, cuisines, restaurants
            current_prefs: Current preference text (if any)

        Returns:
            Prompt string for LLM
        """
        # Extract key data from summary
        top_cuisines = [c['cuisine']
                        for c in summary.get('top_cuisines', [])[:5]]
        top_atmospheres = [a['atmosphere']
                           for a in summary.get('top_atmospheres', [])[:5]]
        top_restaurants = [r['name']
                           for r in summary.get('top_restaurants', [])[:5]]
        recent_searches = summary.get('search_queries', [])[:10]

        reservation_count = summary.get('reservation_count', 0)
        maps_view_count = summary.get('maps_view_count', 0)

        return f"""You are a food preference analyst. Generate a natural language preference profile based on user's recent dining behavior.

CURRENT PREFERENCES (if any):
{current_prefs if current_prefs else "(No preferences yet - create from scratch)"}

RECENT BEHAVIOR ANALYSIS:
- Total interactions: {summary.get('total_interactions', 0)} actions in last 30 days
- Reservations made: {reservation_count} (HIGHEST SIGNAL - shows commitment)
- Maps views: {maps_view_count} (HIGH SIGNAL - strong intent to visit)
- Restaurant clicks: {summary.get('click_count', 0)}
- Restaurant views: {summary.get('view_count', 0)}

TOP CUISINES (weighted by interaction strength):
{', '.join(top_cuisines) if top_cuisines else "None yet"}

PREFERRED ATMOSPHERES (weighted by interaction strength):
{', '.join(top_atmospheres) if top_atmospheres else "None yet"}

FAVORITE RESTAURANTS (by interaction frequency):
{', '.join(top_restaurants) if top_restaurants else "None yet"}

RECENT SEARCH QUERIES:
{chr(10).join(f"- {q}" for q in recent_searches) if recent_searches else "None yet"}

TASK:
Generate a natural, engaging, ~2 paragraph preference profile. Write in third person (e.g., "Aarush loves...").

GUIDELINES:
1. **Be specific and descriptive** - mention actual restaurants, favorite cuisines, typical dining patterns
2. **Weight signals appropriately**:
   - Reservations = strongest evidence of preference
   - Maps views = strong intent
   - Repeated searches = shows interest
3. **Keep the warmth** - write like you're describing a friend's taste
4. **Update, don't replace** - if current preferences exist, refine them with new insights
5. **Include context** - time of day, who they dine with, special occasions, atmosphere preferences
6. **Be concise** - aim for ~150-250 words total

EXAMPLE STYLE:
"Aarush has a deep love for Indian cuisine, particularly dishes that balance spicy heat with sweet undertones. He's a social diner who frequently explores new restaurants with friends, especially trendy bars and late-night spots in the city. His all-time favorite dining experience was the fresh seafood at The Pier in New York, where he discovered his passion for sushi. He returns frequently to authentic Japanese restaurants, always seeking that perfect balance of traditional preparation and creative presentation.

When choosing where to eat, Aarush gravitates toward vibrant, lively atmospheres over quiet, formal settings. He's comfortable spending $$ to $$$ for a good meal, especially when trying new cuisines. Recent patterns show a growing interest in Korean BBQ and Thai food, with multiple visits to [restaurant names]. He appreciates restaurants that accommodate groups and offer shareable plates for communal dining experiences."

Return ONLY the natural language preference text (no JSON, no markdown, no explanations).
"""

    async def migrate_json_to_narrative(self, user_id: str) -> str:
        """
        Migrate old JSON preferences to new natural language format.
        This is a one-time migration for existing users.

        Args:
            user_id: User UUID

        Returns:
            Natural language preferences
        """
        try:
            # Get current JSON preferences
            json_prefs = self.get_current_preferences(user_id)

            # If empty, return empty
            if not any([
                json_prefs.get('cuisines'),
                json_prefs.get('priceRange'),
                json_prefs.get('atmosphere'),
                json_prefs.get('flavorNotes')
            ]):
                return ""

            # Build prompt to convert JSON to natural language
            prompt = f"""Convert these structured food preferences into a natural, engaging narrative (2 paragraphs, ~150-250 words).

STRUCTURED PREFERENCES:
{json.dumps(json_prefs, indent=2)}

Write in third person, be specific and warm. Example style:
"[User] has a deep love for [cuisines], particularly dishes with [flavor notes]. They enjoy [atmosphere] settings and typically spend [price range] on dining experiences..."

Return ONLY the natural language text (no JSON, no markdown).
"""

            response = self.gemini_service.model.generate_content(prompt)
            narrative = response.text.strip()

            print(
                f"[TASTE PROFILE] Migrated JSON to narrative for user {user_id[:8]}...")

            # Save the narrative
            self.save_preferences(user_id, narrative)

            return narrative

        except Exception as e:
            print(f"[TASTE PROFILE ERROR] Migration failed: {str(e)}")
            return ""


# Singleton instance
_taste_profile_service: Optional[TasteProfileService] = None


def get_taste_profile_service() -> TasteProfileService:
    """Get or create taste profile service instance."""
    global _taste_profile_service
    if _taste_profile_service is None:
        _taste_profile_service = TasteProfileService()
    return _taste_profile_service
