"""
Supabase service for database and storage operations.
"""
from supabase import create_client, Client
import os
from datetime import datetime
import uuid
from typing import Optional, List, Dict, Any


class SupabaseService:
    """Service for interacting with Supabase database and storage."""
    
    def __init__(self):
        """Initialize Supabase client with credentials from environment."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        self.bucket_name = os.getenv("SUPABASE_STORAGE_BUCKET", "issue-images")
        
        # Ensure bucket exists (will fail silently if it already exists)
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Create storage bucket if it doesn't exist."""
        try:
            # Try to create the bucket (will fail if already exists, which is fine)
            self.client.storage.create_bucket(
                self.bucket_name,
                options={"public": True}
            )
            print(f"Created storage bucket: {self.bucket_name}")
        except Exception as e:
            # Bucket likely already exists, which is fine
            print(f"Bucket {self.bucket_name} status: {str(e)}")

    def upload_image(self, user_id: str, image_bytes: bytes, extension: str) -> str:
        """
        Upload image to Supabase Storage.
        
        Args:
            user_id: User UUID
            image_bytes: Raw image data
            extension: File extension (jpg, png)
            
        Returns:
            Public URL of uploaded image
            
        Raises:
            Exception: If upload fails
        """
        try:
            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            filename = f"{timestamp}_{unique_id}.{extension}"
            path = f"{user_id}/{filename}"

            # Upload to storage
            self.client.storage.from_(self.bucket_name).upload(
                path=path,
                file=image_bytes,
                file_options={"content-type": f"image/{extension}"}
            )

            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(path)
            return public_url

        except Exception as e:
            print(f"Image upload error: {str(e)}")
            raise Exception(f"Failed to upload image: {str(e)}")

    def create_issue(
        self, 
        user_id: str, 
        image_url: str, 
        description: str, 
        geolocation: str, 
        timestamp: str
    ) -> Dict[str, Any]:
        """
        Create new issue in database.
        
        Args:
            user_id: User UUID (this should be 'uid' to match the database schema)
            image_url: URL of uploaded image (stored in image_id as text)
            description: Issue description
            geolocation: Location string (lat,long)
            timestamp: ISO8601 timestamp
            
        Returns:
            Created issue record
            
        Raises:
            Exception: If database insert fails
        """
        try:
            # Based on the database schema, the fields are:
            # id, image_id, group_id, description, geolocation, timestamp, status, uid
            data = {
                "image_id": image_url,  # Using image_id to store URL
                "description": description,
                "geolocation": geolocation,
                "timestamp": timestamp,
                "status": "incomplete",  # Using the enum value from schema
                "uid": user_id  # Using 'uid' as per the schema
            }

            response = self.client.table("issues").insert(data).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            else:
                raise Exception("No data returned from insert")

        except Exception as e:
            print(f"Database insert error: {str(e)}")
            raise Exception(f"Failed to create issue: {str(e)}")

    def get_user_issues(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetch all issues for a user.
        
        Args:
            user_id: User UUID
            
        Returns:
            List of issue records
            
        Raises:
            Exception: If database query fails
        """
        try:
            response = self.client.table("issues")\
                .select("*")\
                .eq("uid", user_id)\
                .order("timestamp", desc=True)\
                .execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"Database query error: {str(e)}")
            raise Exception(f"Failed to fetch issues: {str(e)}")

    def get_all_issues(self) -> List[Dict[str, Any]]:
        """
        Fetch all issues (for dashboard).
        
        Returns:
            List of all issue records
            
        Raises:
            Exception: If database query fails
        """
        try:
            response = self.client.table("issues")\
                .select("*")\
                .order("timestamp", desc=True)\
                .execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"Database query error: {str(e)}")
<<<<<<< HEAD
            raise Exception(f"Failed to fetch all reviews: {str(e)}")
    
    def get_review_with_image(self, review_id: str) -> Dict[str, Any]:
        """
        Fetch a single review by ID with joined image data.
        Used for taste profile updates after review submission.
        
        Args:
            review_id: Review UUID
            
        Returns:
            Review record with nested image data
            
        Raises:
            Exception: If fetch fails
        """
        try:
            response = self.client.table("reviews")\
                .select("*, images(*)")\
                .eq("id", review_id)\
                .single()\
                .execute()
            
            return response.data if response.data else {}
            
        except Exception as e:
            print(f"Database query error: {str(e)}")
            raise Exception(f"Failed to fetch review: {str(e)}")
=======
            raise Exception(f"Failed to fetch all issues: {str(e)}")
>>>>>>> 083f619e1afc9fd6fef236bc23166e753fa6a82b


# Singleton instance
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service instance."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service

