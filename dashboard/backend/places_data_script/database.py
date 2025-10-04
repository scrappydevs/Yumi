"""
Database operations for storing restaurant data in Supabase.
"""
from supabase import create_client, Client
from typing import List, Set, Optional
import hashlib
import logging
from models import Restaurant, RestaurantPhoto, RestaurantReview
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_STORAGE_BUCKET

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages database operations for restaurant data."""

    def __init__(self):
        if not SUPABASE_SERVICE_KEY:
            raise ValueError(
                "SUPABASE_SERVICE_KEY environment variable must be set")

        self.client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self.bucket_name = SUPABASE_STORAGE_BUCKET
        self._ensure_bucket_exists()
        self._ensure_tables_exist()

    def _ensure_bucket_exists(self):
        """Create storage bucket if it doesn't exist."""
        try:
            self.client.storage.create_bucket(
                self.bucket_name,
                options={"public": True}
            )
            logger.info(f"Created storage bucket: {self.bucket_name}")
        except Exception as e:
            logger.debug(f"Bucket {self.bucket_name} status: {str(e)}")

    def _ensure_tables_exist(self):
        """Ensure required tables exist in database."""
        # Check if restaurants table exists by trying to query it
        try:
            self.client.table("restaurants").select(
                "place_id").limit(1).execute()
            logger.info("✅ restaurants table exists")
        except Exception as e:
            logger.warning(f"⚠️  restaurants table may not exist: {e}")
            logger.warning(
                "Tables should already exist in your Supabase database")

    def get_processed_place_ids(self) -> Set[str]:
        """Get set of already processed place IDs to avoid duplicates."""
        try:
            response = self.client.table(
                "restaurants").select("place_id").execute()
            return {item["place_id"] for item in response.data}
        except Exception as e:
            logger.error(f"Failed to get processed place IDs: {e}")
            return set()

    def save_restaurant(self, restaurant: Restaurant) -> Optional[str]:
        """
        Save restaurant to database using existing schema.

        Args:
            restaurant: Restaurant object

        Returns:
            Restaurant UUID or None
        """
        try:
            # Check if restaurant already exists
            existing = self.client.table("restaurants")\
                .select("id")\
                .eq("place_id", restaurant.place_id)\
                .execute()

            if existing.data and len(existing.data) > 0:
                # Update existing
                restaurant_id = existing.data[0]["id"]

                # Build update data
                update_data = {
                    "name": restaurant.name,
                    "formatted_address": restaurant.formatted_address or "",
                    "phone_number": restaurant.phone_number,
                    "website": restaurant.website,
                    "google_maps_url": restaurant.google_maps_url,
                    "price_level": restaurant.price_level,
                    "rating_avg": restaurant.rating_avg,
                    "user_ratings_total": restaurant.user_ratings_total or 0,
                    "updated_at": "now()"
                }

                # Add location if we have coordinates
                if restaurant.lat is not None and restaurant.lng is not None:
                    # PostGIS format: POINT(longitude latitude)
                    update_data["location"] = f"SRID=4326;POINT({restaurant.lng} {restaurant.lat})"

                self.client.table("restaurants")\
                    .update(update_data)\
                    .eq("id", restaurant_id)\
                    .execute()

                logger.info(f"Updated existing restaurant: {restaurant.name}")
                return restaurant_id
            else:
                # Insert new
                insert_data = {
                    "place_id": restaurant.place_id,
                    "name": restaurant.name,
                    "formatted_address": restaurant.formatted_address or "",
                    "phone_number": restaurant.phone_number,
                    "website": restaurant.website,
                    "google_maps_url": restaurant.google_maps_url,
                    "price_level": restaurant.price_level,
                    "rating_avg": restaurant.rating_avg,
                    "user_ratings_total": restaurant.user_ratings_total or 0
                }

                # Add location if we have coordinates (required field)
                if restaurant.lat is not None and restaurant.lng is not None:
                    # PostGIS format: POINT(longitude latitude)
                    insert_data["location"] = f"SRID=4326;POINT({restaurant.lng} {restaurant.lat})"
                else:
                    logger.error(
                        f"Cannot insert restaurant {restaurant.name} without location")
                    return None

                response = self.client.table(
                    "restaurants").insert(insert_data).execute()

                if response.data and len(response.data) > 0:
                    restaurant_id = response.data[0]["id"]
                    logger.info(f"Inserted new restaurant: {restaurant.name}")
                    return restaurant_id
                else:
                    logger.error("No data returned from insert")
                    return None

        except Exception as e:
            logger.error(f"Failed to save restaurant {restaurant.name}: {e}")
            return None

    def upload_photo_to_storage(self, photo_bytes: bytes, filename: str) -> Optional[str]:
        """
        Upload photo to Supabase storage.

        Args:
            photo_bytes: Image bytes
            filename: Filename to save as

        Returns:
            Public URL or None
        """
        try:
            # Upload to storage
            self.client.storage.from_(self.bucket_name).upload(
                filename,
                photo_bytes,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )

            # Get public URL
            url = self.client.storage.from_(
                self.bucket_name).get_public_url(filename)

            return url

        except Exception as e:
            logger.error(f"Failed to upload photo {filename}: {e}")
            return None

    def save_restaurant_image(self, restaurant_id: str, photo: RestaurantPhoto,
                              photo_url: str, restaurant_name: str):
        """
        Save restaurant photo to images table.

        Args:
            restaurant_id: Restaurant UUID
            photo: RestaurantPhoto object
            photo_url: URL of uploaded photo
            restaurant_name: Name of restaurant (for logging)
        """
        try:
            # Check if image already exists by URL
            existing = self.client.table("images")\
                .select("id")\
                .eq("image_url", photo_url)\
                .execute()

            if existing.data and len(existing.data) > 0:
                logger.debug(f"Image already exists: {photo_url}")
                return

            # Create attribution text from html_attributions
            attribution = " ".join(
                photo.html_attributions) if photo.html_attributions else f"Photo from Google Places"

            data = {
                "restaurant_id": restaurant_id,
                "image_url": photo_url,
                "description": attribution,
                "timestamp": "now()"
            }

            self.client.table("images").insert(data).execute()
            logger.info(f"Saved image for restaurant {restaurant_name}")

        except Exception as e:
            logger.error(f"Failed to save image metadata: {e}")

    def save_restaurant_reviews(self, restaurant_id: str, restaurant_name: str, reviews: List[RestaurantReview]):
        """
        Save restaurant reviews to reviews table.

        Args:
            restaurant_id: Restaurant UUID
            restaurant_name: Restaurant name
            reviews: List of RestaurantReview objects
        """
        try:
            for review in reviews:
                # Create external_review_id as hash of author+time for deduplication
                review_identifier = f"{review.author_name}_{review.time}"
                external_review_id = hashlib.md5(
                    review_identifier.encode()).hexdigest()

                # Check if review already exists
                existing = self.client.table("reviews")\
                    .select("id")\
                    .eq("external_review_id", external_review_id)\
                    .execute()

                if existing.data and len(existing.data) > 0:
                    logger.debug(
                        f"Review already exists: {external_review_id}")
                    continue

                # Combine author name and review text
                description = f"{review.text}"
                if review.author_name and review.author_name != "Anonymous":
                    description = f"Review by {review.author_name}: {review.text}"

                data = {
                    "restaurant_id": restaurant_id,
                    "restaurant_name": restaurant_name,
                    "description": description,
                    "rating": review.rating,
                    "overall_rating": review.rating,  # Copy to overall_rating as well
                    "source": "google",
                    "external_review_id": external_review_id
                }

                self.client.table("reviews").insert(data).execute()

            logger.info(
                f"Saved {len(reviews)} reviews for restaurant {restaurant_name}")

        except Exception as e:
            logger.error(f"Failed to save reviews: {e}")

    def get_restaurant_count(self) -> int:
        """Get total count of restaurants in database."""
        try:
            response = self.client.table("restaurants").select(
                "id", count="exact").execute()
            return response.count or 0
        except Exception as e:
            logger.error(f"Failed to get restaurant count: {e}")
            return 0
