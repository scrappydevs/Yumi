"""
Preferences Router - User preference management and blending for iOS app
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
from utils.auth import get_user_id_from_token
from supabase_client import get_supabase
from services.taste_profile_service import get_taste_profile_service
from services.gemini_service import get_gemini_service

router = APIRouter(prefix="/preferences", tags=["preferences"])

# ============================================================================
# Request/Response Models
# ============================================================================

class BlendRequest(BaseModel):
    friend_ids: List[str] = []  # Optional: specific friends to blend with

class BlendedPreferences(BaseModel):
    blended_text: str
    user_count: int
    user_names: List[str]
    top_cuisines: List[str]
    atmosphere_preferences: List[str]
    price_range: str

# ============================================================================
# Endpoints
# ============================================================================

@router.post("/blend")
async def blend_preferences(
    request: BlendRequest,
    user_id: str = Depends(get_user_id_from_token)
):
    """
    Blend taste preferences for user + friends
    Returns unified group preference profile
    
    Args:
        request: Contains optional list of specific friend IDs
        user_id: Extracted from JWT token (automatic)
    
    Returns:
        Blended preferences with natural language summary and structured data
    """
    try:
        print(f"\n{'='*60}")
        print(f"[BLEND PREFERENCES] 🎨 NEW BLEND REQUEST")
        print(f"{'='*60}")
        print(f"[BLEND PREFERENCES] User ID: {user_id}")
        print(f"[BLEND PREFERENCES] Request friend_ids: {request.friend_ids}")
        print(f"[BLEND PREFERENCES] Number of friend IDs in request: {len(request.friend_ids)}")
        
        supabase = get_supabase()
        
        # If no specific friends provided, get all friends
        if not request.friend_ids:
            print(f"[BLEND PREFERENCES] No specific friends provided, fetching all friends...")
            user_response = supabase.table("profiles")\
                .select("friends")\
                .eq("id", user_id)\
                .single()\
                .execute()
            
            if user_response.data:
                request.friend_ids = user_response.data.get("friends", []) or []
                print(f"[BLEND PREFERENCES] Fetched {len(request.friend_ids)} friends from profile")
        else:
            print(f"[BLEND PREFERENCES] Using {len(request.friend_ids)} specific friend(s) from request")
        
        # Create list of all users (current user + friends)
        all_user_ids = [user_id] + request.friend_ids
        
        print(f"[BLEND PREFERENCES] All user IDs to blend: {all_user_ids}")
        print(f"[BLEND PREFERENCES] Total users: {len(all_user_ids)}")
        
        # Fetch all user profiles
        profiles_response = supabase.table("profiles")\
            .select("id, username, display_name, preferences")\
            .in_("id", all_user_ids)\
            .execute()
        
        if not profiles_response.data:
            raise HTTPException(status_code=404, detail="No profiles found")
        
        profiles = profiles_response.data
        
        # Get display names for response
        user_names = [
            p.get("display_name") or p.get("username") 
            for p in profiles
        ]
        
        # Use existing taste profile service to merge
        taste_profile_service = get_taste_profile_service()
        merged_text = taste_profile_service.merge_multiple_user_preferences(all_user_ids)
        
        # Extract structured data from preferences using LLM
        structured_data = await extract_structured_preferences(merged_text, profiles)
        
        result = {
            "blended_text": merged_text,
            "user_count": len(all_user_ids),
            "user_names": user_names,
            "top_cuisines": structured_data.get("cuisines", []),
            "atmosphere_preferences": structured_data.get("atmosphere", []),
            "price_range": structured_data.get("price_range", "Moderate")
        }
        
        print(f"[BLEND PREFERENCES] ✅ Successfully blended preferences")
        print(f"[BLEND PREFERENCES] Result: {result}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[BLEND PREFERENCES ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to blend preferences: {str(e)}")


async def extract_structured_preferences(merged_text: str, profiles: List[dict]) -> dict:
    """
    Extract structured data from merged preference text and individual profiles
    
    Args:
        merged_text: Natural language merged preferences
        profiles: List of user profiles with preferences
    
    Returns:
        Dict with cuisines, atmosphere, price_range
    """
    try:
        gemini_service = get_gemini_service()
        
        # Gather all individual preference texts
        all_prefs = [p.get("preferences", "") for p in profiles if p.get("preferences")]
        combined_prefs = "\n\n".join([f"- {pref}" for pref in all_prefs])
        
        extract_prompt = f"""From this group's dining preferences, extract structured information.

Merged group preference:
{merged_text}

Individual preferences:
{combined_prefs}

Extract and return JSON with:
- cuisines: array of top 3-5 cuisine types mentioned
- atmosphere: array of atmosphere preferences (e.g., "casual", "upscale", "quiet", "lively")
- price_range: one of "Budget-friendly", "Moderate", "Upscale", or "Varied"

Example output:
{{
  "cuisines": ["Italian", "Japanese", "Mexican"],
  "atmosphere": ["casual", "cozy"],
  "price_range": "Moderate"
}}

Return ONLY valid JSON, no markdown or explanations."""

        response = gemini_service.model.generate_content(extract_prompt)
        result_text = response.text.strip()
        
        # Clean markdown if present
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        import json
        structured = json.loads(result_text)
        
        return structured
        
    except Exception as e:
        print(f"[EXTRACT STRUCTURED] Error: {str(e)}")
        # Return defaults on error
        return {
            "cuisines": [],
            "atmosphere": [],
            "price_range": "Moderate"
        }
