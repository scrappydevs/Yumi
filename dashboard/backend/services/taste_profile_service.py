"""
Taste Profile Service - Auto-updates user preferences based on reviews.

This service uses LLM analysis to extract taste insights from user reviews
and intelligently updates their preference profile.
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
            prefs = json.loads(prefs_str) if isinstance(prefs_str, str) else prefs_str
            
            # Ensure all keys exist
            return {
                "cuisines": prefs.get("cuisines", []),
                "priceRange": prefs.get("priceRange", ""),
                "atmosphere": prefs.get("atmosphere", []),
                "flavorNotes": prefs.get("flavorNotes", [])
            }
            
        except Exception as e:
            print(f"[TASTE PROFILE ERROR] Failed to fetch preferences: {str(e)}")
            # Return default on error
            return {
                "cuisines": [],
                "priceRange": "",
                "atmosphere": [],
                "flavorNotes": []
            }
    
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
        
        print(f"[TASTE PROFILE] Merge reasoning: {new_insights.get('reasoning', 'N/A')}")
        
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
            preferences: Preferences dict to save
        """
        try:
            prefs_json = json.dumps(preferences)
            
            self.supabase.table("profiles")\
                .update({"preferences": prefs_json})\
                .eq("id", user_id)\
                .execute()
            
            print(f"[TASTE PROFILE] Saved preferences for user {user_id}")
            
        except Exception as e:
            print(f"[TASTE PROFILE ERROR] Failed to save preferences: {str(e)}")
            raise


# Singleton instance
_taste_profile_service: Optional[TasteProfileService] = None


def get_taste_profile_service() -> TasteProfileService:
    """Get or create taste profile service instance."""
    global _taste_profile_service
    if _taste_profile_service is None:
        _taste_profile_service = TasteProfileService()
    return _taste_profile_service

