"""
Configuration Router
Provides frontend configuration like API keys (public ones only)
"""
from fastapi import APIRouter
import os

router = APIRouter(prefix="/api/config", tags=["config"])

@router.get("/maps-key")
async def get_maps_api_key():
    """
    Get Google Maps API key for frontend use
    Note: This is safe because the key is public (NEXT_PUBLIC_) and restricted to specific domains
    """
    api_key = os.getenv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', '')
    
    if not api_key:
        return {"error": "Google Maps API key not configured"}
    
    return {"apiKey": api_key}

