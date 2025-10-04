"""
Supabase client configuration
"""
import os
from supabase import create_client, Client
from typing import Optional

class SupabaseClient:
    _instance: Optional[Client] = None
    
    @classmethod
    def initialize(cls):
        """Initialize Supabase client"""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
        
        cls._instance = create_client(url, key)
        print(f"✅ Supabase client initialized: {url}")
        return cls._instance
    
    @classmethod
    def get_client(cls) -> Client:
        """Get the Supabase client instance"""
        if cls._instance is None:
            cls.initialize()
        return cls._instance

def get_supabase() -> Client:
    """Dependency to get Supabase client"""
    return SupabaseClient.get_client()
