"""
Taste Profile Service - Generates natural language preferences from user behavior.

This service merges existing preferences with new interaction patterns to create
rich, wholesome preference narratives like:
"Aarush loves Indian food that is spicy and sweet, often goes out with friends..."
"""
import json
from typing import Dict, Any, Optional
from services.gemini_service import GeminiService
from supabase_client import get_supabase


class TasteProfileService:
    """Service for generating and updating natural language taste profiles."""

    def __init__(self):
        """Initialize with Gemini service and Supabase client."""
        self.gemini_service = GeminiService()
        self.supabase = get_supabase()
        print("[TASTE PROFILE] Service initialized")

    def get_current_preferences_text(self, user_id: str) -> str:
        """
        Get user's current preferences as natural language text.

        Args:
            user_id: User UUID

        Returns:
            Natural language preferences text, or empty string if none exist
        """
        try:
            print(f"\n{'='*80}")
            print(f"[TASTE PROFILE] 📖 FETCHING USER PREFERENCES")
            print(f"[TASTE PROFILE] User ID: {user_id}")
            print(
                f"[TASTE PROFILE] Query: SELECT preferences FROM profiles WHERE id = '{user_id}'")

            response = self.supabase.table("profiles")\
                .select("preferences")\
                .eq("id", user_id)\
                .single()\
                .execute()

            if not response.data or not response.data.get("preferences"):
                print(f"[TASTE PROFILE] ⚠️ No preferences found in database")
                print(f"{'='*80}\n")
                return ""

            prefs = response.data["preferences"]
            print(f"[TASTE PROFILE] ✅ Raw preferences retrieved from database:")
            print(f"[TASTE PROFILE] Type: {type(prefs)}")
            print(
                f"[TASTE PROFILE] Length: {len(str(prefs)) if prefs else 0} chars")

            # Handle both text and JSON formats
            if isinstance(prefs, str):
                try:
                    # Try to parse as JSON (old format)
                    json.loads(prefs)
                    # If successful, it's old format - return empty to trigger generation
                    print(
                        f"[TASTE PROFILE] ⚠️ Old JSON format detected, needs migration")
                    print(f"{'='*80}\n")
                    return ""
                except (json.JSONDecodeError, TypeError):
                    # It's natural language format - return as is
                    print(f"[TASTE PROFILE] ✅ Natural language preferences found:")
                    print(f"[TASTE PROFILE] Preview: {prefs[:200]}..." if len(
                        prefs) > 200 else f"[TASTE PROFILE] Content: {prefs}")
                    print(f"{'='*80}\n")
                    return prefs

            print(f"[TASTE PROFILE] ⚠️ Unexpected preference format")
            print(f"{'='*80}\n")
            return ""

        except Exception as e:
            print(
                f"[TASTE PROFILE ERROR] Failed to fetch preferences text: {str(e)}")
            print(f"{'='*80}\n")
            return ""

    def get_current_preferences(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's current preferences as a structured dict.

        Args:
            user_id: User UUID

        Returns:
            Preferences dict with cuisines, atmosphere, price range, flavor notes
        """
        try:
            # Get the natural language preferences text
            pref_text = self.get_current_preferences_text(user_id)
            
            if not pref_text:
                # Return empty structure
                return {
                    "cuisines": [],
                    "priceRange": "",
                    "atmosphere": [],
                    "flavorNotes": []
                }
            
            # For now, return the text as-is in a structured format
            # The LLM can interpret the natural language directly
            return {
                "preferences_text": pref_text,
                "cuisines": [],
                "priceRange": "",
                "atmosphere": [],
                "flavorNotes": []
            }

        except Exception as e:
            print(f"[TASTE PROFILE ERROR] Failed to fetch preferences: {str(e)}")
            return {
                "cuisines": [],
                "priceRange": "",
                "atmosphere": [],
                "flavorNotes": []
            }

    def merge_multiple_user_preferences(self, user_ids: list[str]) -> str:
        """
        Merge preferences from multiple users for group dining recommendations.

        Args:
            user_ids: List of user UUIDs

        Returns:
            Merged natural language preferences text suitable for group search
        """
        try:
            print(f"[TASTE PROFILE] Merging preferences for {len(user_ids)} users")
            
            # Fetch preferences for all users
            individual_prefs = []
            for user_id in user_ids:
                pref_text = self.get_current_preferences_text(user_id)
                if pref_text:
                    individual_prefs.append(pref_text)
            
            if not individual_prefs:
                print("[TASTE PROFILE] No preferences found for any user in group")
                return "Group of diners with varied tastes looking for a restaurant that can accommodate different preferences."
            
            # If only one person has preferences, use theirs
            if len(individual_prefs) == 1:
                return individual_prefs[0]
            
            # Merge multiple preferences using LLM
            print(f"[TASTE PROFILE] Merging {len(individual_prefs)} preference profiles...")
            merge_prompt = f"""You are merging dining preferences for a group of {len(user_ids)} people.

Here are the individual preferences:

{chr(10).join([f"Person {i+1}: {pref}" for i, pref in enumerate(individual_prefs)])}

Task: Create a single, concise group preference profile (2-3 sentences) that:
1. Identifies common preferences across the group
2. Notes any diverse tastes that need accommodation
3. Suggests suitable restaurant types that would work for everyone

Example output:
"This group has a shared love for Asian cuisines, particularly sushi and Korean BBQ. While most prefer vibrant, casual atmospheres, one member appreciates quieter settings. They're comfortable with mid to high price ranges and enjoy trying new restaurants together. A versatile Asian fusion restaurant or a popular ramen spot with varied options would satisfy the entire group."

Return ONLY the merged preference text (no markdown, no explanations).
"""
            
            response = self.gemini_service.model.generate_content(merge_prompt)
            merged_text = response.text.strip()
            
            # Clean up markdown if present
            if merged_text.startswith("```"):
                lines = merged_text.split('\n')
                merged_text = '\n'.join(lines[1:-1] if len(lines) > 2 else lines)
                merged_text = merged_text.strip()
            
            print(f"[TASTE PROFILE] Merged preferences: {merged_text}")
            return merged_text
            
        except Exception as e:
            print(f"[TASTE PROFILE ERROR] Failed to merge preferences: {str(e)}")
            import traceback
            traceback.print_exc()
            # Return generic group text on error
            return f"Group of {len(user_ids)} diners with varied tastes looking for a versatile restaurant."

    def save_preferences(self, user_id: str, preferences_text: str) -> None:
        """
        Save natural language preferences to profiles.preferences column.

        Args:
            user_id: User UUID
            preferences_text: Natural language preference text
        """
        try:
            self.supabase.table("profiles")\
                .update({"preferences": preferences_text})\
                .eq("id", user_id)\
                .execute()

            print(
                f"[TASTE PROFILE] Saved preferences for user {user_id[:8]}... ({len(preferences_text)} chars)")

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
        Merges current preferences with new interaction patterns.

        Args:
            user_id: User UUID
            days: Number of days of interaction history to analyze (default: 30)

        Returns:
            Updated natural language preference text (2 paragraphs)
        """
        try:
            print(
                f"[TASTE PROFILE] Updating from implicit signals for user: {user_id[:8]}...")

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

            # Remove markdown formatting if present
            if new_prefs_text.startswith("```"):
                lines = new_prefs_text.split('\n')
                new_prefs_text = '\n'.join(
                    lines[1:-1] if len(lines) > 2 else lines)
                new_prefs_text = new_prefs_text.strip()

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

    def parse_preferences_to_structured(self, preferences_text: str) -> Dict[str, Any]:
        """
        Parse natural language preferences into structured data.

        Args:
            preferences_text: Natural language preference text from profiles.preferences

        Returns:
            Dict with structured preferences:
            - cuisines: List[str]
            - atmospheres: List[str]
            - price_hints: List[str]
        """
        if not preferences_text or not preferences_text.strip():
            print(f"\n{'='*80}")
            print("[TASTE PROFILE] 🔍 PARSING PREFERENCES (EMPTY)")
            print("[TASTE PROFILE] No preferences text provided")
            print(f"{'='*80}\n")
            return {
                "cuisines": [],
                "atmospheres": [],
                "price_hints": []
            }

        try:
            print(f"\n{'='*80}")
            print(f"[TASTE PROFILE] 🔍 PARSING PREFERENCES TO STRUCTURED FORMAT")
            print(
                f"[TASTE PROFILE] Input text length: {len(preferences_text)} chars")
            print(f"[TASTE PROFILE] Full text:")
            print(f"---")
            print(preferences_text)
            print(f"---")

            prompt = f"""Extract structured data from this user preference text.

PREFERENCE TEXT:
{preferences_text}

Extract and return ONLY JSON (no markdown, no explanations):
{{
  "cuisines": ["Italian", "Japanese", ...],  // All cuisine types mentioned
  "atmospheres": ["vibrant", "casual", ...],  // Atmosphere/vibe keywords
  "price_hints": ["$$", "$$$", ...]  // Price level indicators if mentioned
}}

If a category has no data, return empty array. Be thorough - extract all cuisines and vibes mentioned."""

            print(f"[TASTE PROFILE] 🤖 Sending to LLM for parsing...")
            print(f"[TASTE PROFILE] LLM Prompt length: {len(prompt)} chars")

            response = self.gemini_service.model.generate_content(prompt)
            response_text = response.text.strip()

            print(f"[TASTE PROFILE] ✅ LLM Response received:")
            print(f"[TASTE PROFILE] Raw response: {response_text[:500]}...")

            # Clean markdown if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            import json
            structured = json.loads(response_text)

            print(f"[TASTE PROFILE] ✅ Parsed structured data:")
            print(
                f"[TASTE PROFILE]   - Cuisines: {structured.get('cuisines', [])}")
            print(
                f"[TASTE PROFILE]   - Atmospheres: {structured.get('atmospheres', [])}")
            print(
                f"[TASTE PROFILE]   - Price Hints: {structured.get('price_hints', [])}")
            print(f"{'='*80}\n")

            return structured

        except Exception as e:
            print(
                f"[TASTE PROFILE ERROR] Failed to parse preferences: {str(e)}")
            import traceback
            traceback.print_exc()
            print(f"{'='*80}\n")
            return {
                "cuisines": [],
                "atmospheres": [],
                "price_hints": []
            }

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
Generate a natural, engaging, ~2 paragraph preference profile. Write in third person (e.g., "The user loves...").

GUIDELINES:
1. **Be specific and descriptive** - mention actual restaurants, favorite cuisines, typical dining patterns
2. **Weight signals appropriately**:
   - Reservations = strongest evidence of preference (weight: 10.0)
   - Maps views = strong intent (weight: 5.0)
   - Clicks = explicit interest (weight: 3.0)
   - Views = mild interest (weight: 2.0)
   - Searches = initial curiosity (weight: 1.0)
3. **Keep the warmth** - write like you're describing a friend's taste
4. **Update, don't replace** - if current preferences exist, MERGE them with new insights rather than replacing
5. **Include context** - time of day, who they dine with, special occasions, atmosphere preferences
6. **Be concise** - aim for ~150-250 words total

EXAMPLE STYLE:
"The user has a deep love for Indian cuisine, particularly dishes that balance spicy heat with sweet undertones. They frequently explore new restaurants with friends, especially trendy bars and late-night spots in the city. Their all-time favorite dining experience was the fresh seafood at The Pier in New York, where they discovered a passion for sushi. They return frequently to authentic Japanese restaurants, always seeking that perfect balance of traditional preparation and creative presentation.

When choosing where to eat, they gravitate toward vibrant, lively atmospheres over quiet, formal settings. They're comfortable spending $$ to $$$ for a good meal, especially when trying new cuisines. Recent patterns show a growing interest in Korean BBQ and Thai food, with multiple visits to popular local spots. They appreciate restaurants that accommodate groups and offer shareable plates for communal dining experiences."

IMPORTANT: If current preferences exist, MERGE the new insights with the existing text. Keep what's still relevant and add new patterns. Don't completely replace unless the new data contradicts old preferences.

Return ONLY the natural language preference text (no JSON, no markdown, no explanations).
"""


# Singleton instance
_taste_profile_service: Optional[TasteProfileService] = None


def get_taste_profile_service() -> TasteProfileService:
    """Get or create singleton instance of TasteProfileService."""
    global _taste_profile_service

    if _taste_profile_service is None:
        _taste_profile_service = TasteProfileService()

    return _taste_profile_service
