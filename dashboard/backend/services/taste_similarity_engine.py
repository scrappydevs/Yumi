"""
Simplified similarity computation based on taste profile text.
Uses the natural language preferences stored in profiles.preferences
"""
from typing import Dict, Any


def get_embedding_service():
    """Get the embedding service (lazy import to avoid circular dependencies)"""
    from services.embedding_service import get_embedding_service as _get_service
    return _get_service()


async def compute_taste_similarity(
    supabase,
    user_id_1: str,
    user_id_2: str
) -> Dict[str, Any]:
    """
    Compute similarity between two users based on their taste profile text.
    Uses semantic similarity of their natural language preferences.
    
    Args:
        supabase: Supabase client
        user_id_1: First user's UUID
        user_id_2: Second user's UUID
    
    Returns:
        Dict with similarity score and metadata
    """
    
    # Get both user profiles with taste preferences
    profile1_result = supabase.table('profiles')\
        .select('id, username, display_name, preferences')\
        .eq('id', user_id_1)\
        .single()\
        .execute()
    
    profile2_result = supabase.table('profiles')\
        .select('id, username, display_name, preferences')\
        .eq('id', user_id_2)\
        .single()\
        .execute()
    
    profile1 = profile1_result.data
    profile2 = profile2_result.data
    
    # Get taste profile text
    prefs1 = profile1.get('preferences', '') or ''
    prefs2 = profile2.get('preferences', '') or ''
    
    username1 = profile1.get('username', 'unknown')
    username2 = profile2.get('username', 'unknown')
    
    # Debug logging
    print(f"[SIMILARITY DEBUG] {username1}: prefs length = {len(prefs1)}")
    print(f"[SIMILARITY DEBUG] {username2}: prefs length = {len(prefs2)}")
    
    # If either user has no preferences, return low similarity
    if not prefs1.strip() or not prefs2.strip():
        print(f"[SIMILARITY] ⚠️  {username1} or {username2} missing taste profile (empty string)")
        return {
            'similarity_score': 0.3,  # Default low similarity
            'cuisine_overlap': [],
            'shared_restaurants': [],
            'explanation': 'Similarity based on basic connection (taste profiles pending)'
        }
    
    # Use embedding service to compute semantic similarity
    embedding_service = get_embedding_service()
    
    # Generate embeddings for both taste profiles
    emb1 = embedding_service.generate_embedding(prefs1)
    emb2 = embedding_service.generate_embedding(prefs2)
    
    # Calculate cosine similarity
    similarity_score = embedding_service.calculate_similarity(emb1, emb2)
    
    print(f"[SIMILARITY] {profile1['username']} <-> {profile2['username']}: {similarity_score:.3f}")
    
    # Generate detailed explanation with specific cuisines using LLM
    try:
        from services.gemini_service import GeminiService
        gemini = GeminiService()
        
        prompt = f"""Analyze these two users' food preferences and create a SHORT explanation of what they have in common.

User 1 ({profile1['display_name']}):
{prefs1[:500]}...

User 2 ({profile2['display_name']}):
{prefs2[:500]}...

Task: Generate a SINGLE SENTENCE (max 15 words) explaining their shared food interests.
- Mention SPECIFIC cuisines or restaurants they both like
- Be concrete and specific
- No generic phrases like "similar taste profiles"

Examples:
- "Both love Thai and Japanese cuisine with spicy, bold flavors"
- "Share passion for Italian food and fine dining experiences"
- "Both enjoy Mexican street food and casual dining"

Return ONLY the explanation sentence, no quotes or extra text."""
        
        response = gemini.model.generate_content(prompt)
        explanation = response.text.strip().strip('"\'')
        
        # Clean up markdown if present
        if explanation.startswith('```'):
            lines = explanation.split('\n')
            explanation = lines[1] if len(lines) > 1 else explanation
            
        print(f"[SIMILARITY] Generated explanation: {explanation}")
        
    except Exception as e:
        print(f"[SIMILARITY] Failed to generate detailed explanation: {e}")
        # Fallback to simple explanation
        if similarity_score >= 0.8:
            explanation = f"Very similar taste profiles"
        elif similarity_score >= 0.6:
            explanation = f"Share common dining preferences"
        elif similarity_score >= 0.4:
            explanation = f"Have some overlapping tastes"
        else:
            explanation = f"Diverse taste profiles"
    
    return {
        'similarity_score': float(similarity_score),
        'cuisine_overlap': [],  # Not extracted from text for now
        'shared_restaurants': [],  # Not extracted from text for now
        'explanation': explanation
    }


# For backwards compatibility, export under the old name
compute_similarity = compute_taste_similarity

