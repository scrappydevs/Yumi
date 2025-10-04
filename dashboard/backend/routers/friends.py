"""
Friends Router - Friend management endpoints for iOS app
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from utils.auth import get_user_id_from_token
from supabase_client import get_supabase

router = APIRouter(prefix="/friends", tags=["friends"])

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

@router.get("")
async def get_friends(user_id: str = Depends(get_user_id_from_token)):
    """
    Get list of user's friends
    
    Args:
        user_id: Extracted from JWT token (automatic)
    
    Returns:
        List of friend profiles
    """
    try:
        print(f"[GET FRIENDS] Request from user: {user_id}")
        
        supabase = get_supabase()
        
        # Get user's friends array
        user_response = supabase.table("profiles")\
            .select("friends")\
            .eq("id", user_id)\
            .single()\
            .execute()
        
        if not user_response.data:
            return []
        
        friend_ids = user_response.data.get("friends", [])
        
        if not friend_ids:
            print(f"[GET FRIENDS] User has no friends")
            return []
        
        print(f"[GET FRIENDS] User has {len(friend_ids)} friends")
        
        # Fetch friend profiles
        friends_response = supabase.table("profiles")\
            .select("id, username, display_name, avatar_url, bio, created_at, updated_at, friends, preferences, phone, phone_verified, onboarded")\
            .in_("id", friend_ids)\
            .execute()
        
        friends = friends_response.data or []

        print(f"[GET FRIENDS] ✅ Returning {len(friends)} friend profiles")

        # Debug: Print first friend to see field structure
        if friends:
            import json
            print(f"[GET FRIENDS DEBUG] Sample friend data: {json.dumps(friends[0], default=str, indent=2)}")

        return friends
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET FRIENDS ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch friends: {str(e)}")


@router.post("/add")
async def add_friend(
    request: AddFriendRequest,
    user_id: str = Depends(get_user_id_from_token)
):
    """
    Add a user as a friend
    
    Args:
        request: Contains friend_id to add
        user_id: Extracted from JWT token (automatic)
    
    Returns:
        Success message
    """
    try:
        print(f"[ADD FRIEND] User {user_id} adding friend {request.friend_id}")
        
        if user_id == request.friend_id:
            raise HTTPException(status_code=400, detail="Cannot add yourself as a friend")
        
        supabase = get_supabase()
        
        # Check if friend profile exists
        friend_check = supabase.table("profiles")\
            .select("id")\
            .eq("id", request.friend_id)\
            .single()\
            .execute()
        
        if not friend_check.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get current user's friends array
        user_response = supabase.table("profiles")\
            .select("friends")\
            .eq("id", user_id)\
            .single()\
            .execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        current_friends = user_response.data.get("friends", []) or []
        
        # Check if already friends
        if request.friend_id in current_friends:
            print(f"[ADD FRIEND] Already friends")
            return {"message": "Already friends", "status": "success"}
        
        # Add friend to array
        new_friends = current_friends + [request.friend_id]
        
        # Update user's friends array
        supabase.table("profiles")\
            .update({"friends": new_friends})\
            .eq("id", user_id)\
            .execute()
        
        # Also add current user to friend's friends array (mutual friendship)
        friend_response = supabase.table("profiles")\
            .select("friends")\
            .eq("id", request.friend_id)\
            .single()\
            .execute()
        
        if friend_response.data:
            friend_current_friends = friend_response.data.get("friends", []) or []
            if user_id not in friend_current_friends:
                friend_new_friends = friend_current_friends + [user_id]
                supabase.table("profiles")\
                    .update({"friends": friend_new_friends})\
                    .eq("id", request.friend_id)\
                    .execute()
        
        print(f"[ADD FRIEND] ✅ Friend added successfully")
        return {"message": "Friend added successfully", "status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADD FRIEND ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to add friend: {str(e)}")


@router.post("/remove")
async def remove_friend(
    request: RemoveFriendRequest,
    user_id: str = Depends(get_user_id_from_token)
):
    """
    Remove a friend
    
    Args:
        request: Contains friend_id to remove
        user_id: Extracted from JWT token (automatic)
    
    Returns:
        Success message
    """
    try:
        print(f"[REMOVE FRIEND] User {user_id} removing friend {request.friend_id}")
        
        supabase = get_supabase()
        
        # Get current user's friends array
        user_response = supabase.table("profiles")\
            .select("friends")\
            .eq("id", user_id)\
            .single()\
            .execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        current_friends = user_response.data.get("friends", []) or []
        
        # Check if actually friends
        if request.friend_id not in current_friends:
            print(f"[REMOVE FRIEND] Not friends")
            return {"message": "Not friends", "status": "success"}
        
        # Remove friend from array
        new_friends = [f for f in current_friends if f != request.friend_id]
        
        # Update user's friends array
        supabase.table("profiles")\
            .update({"friends": new_friends})\
            .eq("id", user_id)\
            .execute()
        
        # Also remove current user from friend's friends array
        friend_response = supabase.table("profiles")\
            .select("friends")\
            .eq("id", request.friend_id)\
            .single()\
            .execute()
        
        if friend_response.data:
            friend_current_friends = friend_response.data.get("friends", []) or []
            if user_id in friend_current_friends:
                friend_new_friends = [f for f in friend_current_friends if f != user_id]
                supabase.table("profiles")\
                    .update({"friends": friend_new_friends})\
                    .eq("id", request.friend_id)\
                    .execute()
        
        print(f"[REMOVE FRIEND] ✅ Friend removed successfully")
        return {"message": "Friend removed successfully", "status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[REMOVE FRIEND ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to remove friend: {str(e)}")
