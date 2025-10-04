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
        # Use NEXT_PUBLIC_SUPABASE_URL from Infisical
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        # Use NEXT_PUBLIC_SUPABASE_SERVICE_KEY from Infisical
        supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_SERVICE_KEY")

        # Debug logging to see what keys are available
        print(f"[SUPABASE INIT] URL found: {bool(supabase_url)}")
        print(f"[SUPABASE INIT] Service key found: {bool(supabase_key)}")
        if supabase_key:
            print(f"[SUPABASE INIT] Key length: {len(supabase_key)} chars")

        if not supabase_url or not supabase_key:
            raise ValueError("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_SERVICE_KEY environment variables must be set")
        
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
            print(f"✅ Created storage bucket: {self.bucket_name}")
        except Exception as e:
            error_msg = str(e)
            # Bucket already exists - this is fine, just means it was created before
            if "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
                print(f"✅ Storage bucket '{self.bucket_name}' ready (already exists)")
            else:
                print(f"⚠️  Bucket {self.bucket_name} status: {error_msg}")

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

    def create_food_image(
        self,
        image_url: str,
        food_description: str,
        geolocation: str,
        timestamp: str,
        dish: str = "Analyzing...",
        cuisine: str = "Analyzing..."
    ) -> Dict[str, Any]:
        """
        Create entry in images table with AI-generated food description.
        
        Args:
            image_url: URL of uploaded image
            food_description: AI-generated description of the food (can be placeholder)
            geolocation: Location string (lat,long)
            timestamp: ISO8601 timestamp
            
        Returns:
            Created image record with id
            
        Raises:
            Exception: If database insert fails
        """
        try:
            image_data = {
                "description": food_description,  # AI describes the food
                "image_url": image_url,
                "timestamp": timestamp,
                "geolocation": geolocation,
                "dish": dish,
                "cuisine": cuisine
            }
            
            print(f"[DB] Creating image entry: {food_description[:50]}...")
            image_response = self.client.table("images").insert(image_data).execute()
            
            if not image_response.data or len(image_response.data) == 0:
                raise Exception("Failed to create image entry")
            
            image_record = image_response.data[0]
            print(f"[DB] Image entry created with ID: {image_record['id']}")
            
            return image_record

        except Exception as e:
            print(f"Database insert error: {str(e)}")
            raise Exception(f"Failed to create food image entry: {str(e)}")

    def update_image_description(
        self, 
        image_id: int, 
        food_description: str, 
        dish: str = None, 
        cuisine: str = None
    ) -> None:
        """
        Update the AI-generated description for an existing image.
        This is called after background AI analysis completes.
        
        Args:
            image_id: ID of the image to update
            food_description: AI-generated description of the food
            dish: Name of the dish
            cuisine: Type of cuisine
            
        Raises:
            Exception: If database update fails
        """
        try:
            print(f"[DB] Updating image {image_id} with AI analysis...")
            
            update_data = {"description": food_description}
            if dish:
                update_data["dish"] = dish
            if cuisine:
                update_data["cuisine"] = cuisine
            
            update_response = self.client.table("images")\
                .update(update_data)\
                .eq("id", image_id)\
                .execute()
            
            if not update_response.data or len(update_response.data) == 0:
                raise Exception(f"Failed to update image {image_id}")
            
            print(f"[DB] Image {image_id} description updated successfully")

        except Exception as e:
            print(f"Database update error: {str(e)}")
            raise Exception(f"Failed to update image description: {str(e)}")

    def create_review(
        self,
        user_id: str,
        image_id: int,
        user_review: str,
        restaurant_name: str,
        rating: int
    ) -> Dict[str, Any]:
        """
        Create review entry in reviews table, linked to existing image.
        
        Args:
            user_id: User UUID
            image_id: ID from images table
            user_review: User's written review
            restaurant_name: Name of the restaurant
            rating: Star rating (1-5)
            
        Returns:
            Created review record
            
        Raises:
            Exception: If database insert fails
        """
        try:
            review_data = {
                "image_id": image_id,  # Foreign key to images table
                "description": user_review,  # User's review/opinion
                "uid": user_id,
                "overall_rating": rating,  # 1-5 stars
                "restaurant_name": restaurant_name
            }
            
            print(f"[DB] Creating review entry for restaurant: {restaurant_name}")
            review_response = self.client.table("reviews").insert(review_data).execute()
            
            if not review_response.data or len(review_response.data) == 0:
                raise Exception("Failed to create review entry")
            
            review_record = review_response.data[0]
            print(f"[DB] Review entry created with ID: {review_record['id']}")
            
            return review_record

        except Exception as e:
            print(f"Database insert error: {str(e)}")
            raise Exception(f"Failed to create review: {str(e)}")

    def get_image_by_id(self, image_id: int) -> Dict[str, Any]:
        """
        Fetch a single image by ID.
        
        Args:
            image_id: ID of the image
            
        Returns:
            Image record with all fields
            
        Raises:
            Exception: If fetch fails
        """
        try:
            response = self.client.table("images")\
                .select("*")\
                .eq("id", image_id)\
                .single()\
                .execute()
            
            return response.data if response.data else {}
            
        except Exception as e:
            raise Exception(f"Failed to fetch image: {str(e)}")
    
    def get_user_reviews(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetch all reviews for a user (with image data joined).
        
        Args:
            user_id: User UUID
            
        Returns:
            List of review records with image data
            
        Raises:
            Exception: If database query fails
        """
        try:
            # Join reviews with images table to get all data
            response = self.client.table("reviews")\
                .select("*, images(*)")\
                .eq("uid", user_id)\
                .order("images(timestamp)", desc=True)\
                .execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"Database query error: {str(e)}")
            raise Exception(f"Failed to fetch reviews: {str(e)}")

    def get_all_reviews(self) -> List[Dict[str, Any]]:
        """
        Fetch all reviews (for dashboard, with image data joined).
        
        Returns:
            List of all review records with image data
            
        Raises:
            Exception: If database query fails
        """
        try:
            # Join reviews with images table to get all data
            response = self.client.table("reviews")\
                .select("*, images(*)")\
                .order("images(timestamp)", desc=True)\
                .execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"Database query error: {str(e)}")
            raise Exception(f"Failed to fetch all reviews: {str(e)}")


# Singleton instance
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service instance."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service

