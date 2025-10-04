from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from supabase_client import get_supabase
import json

router = APIRouter(prefix="/friends", tags=["friends"])

@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str, current_user_id: str = None):
    """
    Get detailed user profile with food preferences
    """
    supabase = get_supabase()
    try:
        # Get user profile
        profile_result = supabase.table('profiles')\
            .select('id, username, display_name, avatar_url, friends')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not profile_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = {
            'id': profile_result.data['id'],
            'username': profile_result.data['username'],
            'display_name': profile_result.data['display_name'],
            'avatar_url': profile_result.data['avatar_url'],
        }
        
        # Calculate mutual friends if current_user_id is provided
        if current_user_id and current_user_id != user_id:
            try:
                current_user_profile = supabase.table('profiles')\
                    .select('friends')\
                    .eq('id', current_user_id)\
                    .single()\
                    .execute()
                
                if current_user_profile.data:
                    current_user_friends = set(current_user_profile.data.get('friends', []))
                    target_user_friends = set(profile_result.data.get('friends', []))
                    mutual_friends = current_user_friends.intersection(target_user_friends)
                    user_data['mutual_friends_count'] = len(mutual_friends)
            except Exception as mutual_error:
                print(f"⚠️  Could not calculate mutual friends: {mutual_error}")
                user_data['mutual_friends_count'] = 0
        else:
            user_data['mutual_friends_count'] = 0
        
        # Try to get food preferences from user_food_profiles
        try:
            food_profile_result = supabase.rpc('compute_user_food_profile', {
                'target_user_id': user_id
            }).execute()
            
            if food_profile_result.data and len(food_profile_result.data) > 0:
                food_profile = food_profile_result.data[0]
                
                # Parse JSON fields
                preferences = {
                    'favorite_cuisines': food_profile.get('favorite_cuisines', []),
                    'favorite_restaurants': food_profile.get('favorite_restaurants', []),
                    'taste_profile': food_profile.get('taste_profile', {}),
                    'dietary_restrictions': food_profile.get('dietary_restrictions', []),
                    'price_preference': food_profile.get('price_preference', 'Unknown'),
                }
                
                user_data['preferences'] = preferences
        except Exception as pref_error:
            print(f"⚠️  Could not fetch food preferences for user {user_id}: {pref_error}")
            user_data['preferences'] = None
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/{user_id}")
async def get_friend_graph(user_id: str, force_refresh: bool = False):
    """
    Get friend network graph with similarity scores
    Returns cached graph if available and recent (< 1 hour old)
    """
    supabase = get_supabase()
    try:
        # Check for cached graph first (unless force refresh)
        if not force_refresh:
            try:
                cached_result = supabase.table('friend_graphs')\
                    .select('*')\
                    .eq('user_id', user_id)\
                    .maybe_single()\
                    .execute()
                
                if cached_result.data and cached_result.data.get('graph_content'):
                    print(f"✅ Returning cached graph for user {user_id}")
                    return cached_result.data['graph_content']
            except Exception as cache_error:
                print(f"⚠️  Cache lookup failed (table may not exist): {cache_error}")
        
        print(f"🔄 Computing fresh graph for user {user_id}")
        # Get user's profile with friends array
        profile_result = supabase.table('profiles')\
            .select('id, username, display_name, avatar_url, friends')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not profile_result.data or not profile_result.data.get('friends'):
            return {
                'friends': [],
                'similarities': []
            }
        
        friend_ids = profile_result.data['friends']
        
        if not friend_ids:
            return {
                'friends': [],
                'similarities': []
            }
        
        # Get all friend profiles
        friends_result = supabase.table('profiles')\
            .select('id, username, display_name, avatar_url, friends')\
            .in_('id', friend_ids)\
            .execute()
        
        # Format friends data
        friends = []
        current_user_data = {
            'id': profile_result.data['id'],
            'username': profile_result.data['username'],
            'display_name': profile_result.data['display_name'],
            'avatar_url': profile_result.data['avatar_url'],
            'is_current_user': True,
        }
        friends.append(current_user_data)
        
        for friend in friends_result.data or []:
            # Count mutual friends
            mutual_friends = set(friend.get('friends', [])) & set(friend_ids)
            friends.append({
                'id': friend['id'],
                'username': friend['username'],
                'display_name': friend['display_name'],
                'avatar_url': friend['avatar_url'],
                'is_current_user': False,
                'mutual_friends_count': len(mutual_friends),
            })
        
        # Get similarity scores from database
        similarities = []
        has_similarity_data = False
        
        try:
            similarity_result = supabase.table('friend_similarities')\
                .select('*')\
                .or_(f'user_id_1.eq.{user_id},user_id_2.eq.{user_id}')\
                .execute()
            
            if similarity_result.data:
                has_similarity_data = True
                for sim in similarity_result.data or []:
                    # Determine source and target
                    source = sim['user_id_1'] if sim['user_id_1'] == user_id else sim['user_id_2']
                    target = sim['user_id_2'] if sim['user_id_1'] == user_id else sim['user_id_1']
                    
                    # Only include if both users are in our friend list
                    if target in friend_ids or source == user_id:
                        similarities.append({
                            'source': source,
                            'target': target,
                            'similarity_score': sim.get('similarity_score', 0.5),
                            'explanation': sim.get('explanation', 'Similar food preferences'),
                        })
        except Exception as e:
            print(f"Note: similarity data not available: {e}")
        
        # If no similarity data found, generate default similarities
        if not has_similarity_data or not similarities:
            print("Generating default similarities for visualization")
            for friend in friends_result.data or []:
                similarities.append({
                    'source': user_id,
                    'target': friend['id'],
                    'similarity_score': 0.5,
                    'explanation': 'Friends on Yumi',
                })
        
        graph_data = {
            'friends': friends,
            'similarities': similarities
        }
        
        # Store in cache
        try:
            supabase.rpc('upsert_friend_graph', {
                'p_user_id': user_id,
                'p_graph_content': graph_data
            }).execute()
            print(f"💾 Cached graph for user {user_id}")
        except Exception as cache_error:
            print(f"⚠️  Failed to cache graph: {cache_error}")
        
        return graph_data
        
    except Exception as e:
        print(f"Error fetching friend graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/graph/{user_id}/compute")
async def compute_friend_similarities(user_id: str):
    """
    Compute/refresh similarities for a user's friend network
    """
    supabase = get_supabase()
    try:
        # 1. Get user's profile with friends array
        profile_result = supabase.table('profiles')\
            .select('friends')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not profile_result.data or not profile_result.data.get('friends'):
            return {'computed': 0, 'message': 'No friends found'}
        
        friend_ids = profile_result.data['friends']
        
        if not friend_ids:
            return {'computed': 0, 'message': 'No friends found'}
        
        # 2. Try to compute food profiles (if the tables exist)
        try:
            supabase.rpc('compute_user_food_profile', {
                'p_user_id': user_id
            }).execute()
        except Exception as e:
            print(f"Note: compute_user_food_profile not available: {e}")
        
        # 3. For each friend, compute similarity
        try:
            from ..services.similarity_engine import compute_similarity
            
            computed_count = 0
            for friend_id in friend_ids:
                # Compute friend's profile if not exists
                try:
                    supabase.rpc('compute_user_food_profile', {
                        'p_user_id': friend_id
                    }).execute()
                except:
                    pass
                
                # Compute similarity
                similarity_data = await compute_similarity(
                    supabase,
                    user_id,
                    friend_id
                )
                
                # Store in database (ensure lower UUID first)
                user_id_1 = min(user_id, friend_id)
                user_id_2 = max(user_id, friend_id)
                
                supabase.table('friend_similarities').upsert({
                    'user_id_1': user_id_1,
                    'user_id_2': user_id_2,
                    **similarity_data
                }).execute()
                
                computed_count += 1
            
            return {'computed': computed_count, 'message': f'Computed {computed_count} similarities'}
        except Exception as e:
            # If similarity computation fails, return success anyway (graph will use defaults)
            print(f"Note: Advanced similarity computation not available: {e}")
            return {
                'computed': 0, 
                'message': 'Graph available with basic connections. Advanced similarity requires database setup.'
            }
        
    except Exception as e:
        print(f"Error computing similarities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{user_id}")
async def get_user_food_profile(user_id: str):
    """
    Get or compute user's food profile
    """
    supabase = get_supabase()
    try:
        # Try to get existing profile
        result = supabase.table('user_food_profiles')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        
        # Compute if doesn't exist
        supabase.rpc('compute_user_food_profile', {
            'p_user_id': user_id
        }).execute()
        
        # Fetch again
        result = supabase.table('user_food_profiles')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        
        return {}
        
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

