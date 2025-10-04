"""
Users Router - User search and discovery endpoints for iOS app
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from utils.auth import get_user_id_from_token
from supabase_client import get_supabase

router = APIRouter(prefix="/users", tags=["users"])

# ============================================================================
# Endpoints
# ============================================================================

@router.get("/search")
async def search_users(
    q: str = Query(..., description="Search query for username"),
    user_id: str = Depends(get_user_id_from_token)
):
    """
    Search for users by username
    
    Args:
        q: Search query string
        user_id: Extracted from JWT token (automatic)
    
    Returns:
        List of matching user profiles
    """
    try:
        print(f"[SEARCH USERS] Request from user: {user_id}, query: '{q}'")
        
        if not q or not q.strip():
            return []
        
        supabase = get_supabase()
        
        # Search for users by username (case-insensitive)
        # Limit to 20 results
        response = supabase.table("profiles")\
            .select("id, username, display_name, avatar_url, bio, created_at, updated_at")\
            .ilike("username", f"%{q}%")\
            .limit(20)\
            .execute()
        
        users = response.data or []
        
        print(f"[SEARCH USERS] ✅ Found {len(users)} matching users")
        return users
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SEARCH USERS ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"User search failed: {str(e)}")
