"""
Profiles Router - User profile and friends management endpoints for iOS app
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from utils.auth import get_user_id_from_token
from supabase_client import get_supabase

router = APIRouter(prefix="/profiles", tags=["profiles"])

# ============================================================================
# Request/Response Models
# ============================================================================

class AddFriendRequest(BaseModel):
    friend_id: str

class RemoveFriendRequest(BaseModel):
    friend_id: str

# ============================================================================
# Endpoints
# ============================================================================

@router.get("/me")
async def get_my_profile(user_id: str = Depends(get_user_id_from_token)):
    """
    Get current user's profile
    
    Args:
        user_id: Extracted from JWT token (automatic)
    
    Returns:
        Current user's profile with all fields
    """
    try:
        print(f"[GET MY PROFILE] Request from user: {user_id}")
        
        supabase = get_supabase()
        
        # Fetch user profile
        response = supabase.table("profiles")\
            .select("*")\
            .eq("id", user_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        print(f"[GET MY PROFILE] ✅ Profile found for user {user_id}")
        return response.data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET MY PROFILE ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")


@router.get("/{profile_id}")
async def get_profile_by_id(
    profile_id: str,
    user_id: str = Depends(get_user_id_from_token)
):
    """
    Get a specific user's profile by ID
    
    Args:
        profile_id: Profile UUID to fetch
        user_id: Extracted from JWT token (automatic)
    
    Returns:
        User profile
    """
    try:
        print(f"[GET PROFILE] Request for profile {profile_id} from user: {user_id}")
        
        supabase = get_supabase()
        
        # Fetch user profile
        response = supabase.table("profiles")\
            .select("*")\
            .eq("id", profile_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        print(f"[GET PROFILE] ✅ Profile found")
        return response.data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET PROFILE ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")
