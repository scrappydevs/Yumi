"""
Script to generate restaurant profiles using AI analysis of images and reviews.

This script:
1. Fetches all restaurants with empty descriptions
2. Gathers food images (with dishes), location images, and text reviews
3. Uses Gemini to synthesize a complete restaurant profile:
   - Cuisine (one word)
   - Atmosphere (short phrase)
   - Description (2-3 sentences)
4. Updates the restaurant record in the database
"""
from services.gemini_service import GeminiService, get_gemini_service
import os
import sys
import logging
import subprocess
from typing import Optional, Dict, List
from supabase import create_client, Client
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(os.path.dirname(__file__))


def sync_secrets():
    """Sync secrets from Infisical to .env file before loading environment variables"""
    try:
        print("🔄 Syncing secrets from Infisical to .env...")
        result = subprocess.run(
            ["infisical", "export", "--env=dev", "--format=dotenv"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if result.returncode == 0:
            # Write the output to .env file
            with open('.env', 'w') as f:
                f.write(result.stdout)
            print("✅ Secrets synced to .env successfully!")
            return True
        else:
            print(
                "⚠️  Could not sync from Infisical. Using existing .env file if available")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
            return False
    except FileNotFoundError:
        print("⚠️  Infisical CLI not found. Install with: brew install infisical/get-cli/infisical")
        print("   Using existing .env file if available")
        return False
    except Exception as e:
        print(f"⚠️  Could not sync secrets: {e}")
        print("   Using existing .env file if available")
        return False


# Sync and load secrets BEFORE importing modules that need environment variables
sync_secrets()
load_dotenv()

# Now import modules that depend on environment variables

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('restaurant_description_generation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class RestaurantDescriptionGenerator:
    """Generates restaurant descriptions using AI analysis of images and reviews."""

    def __init__(self):
        """Initialize with Supabase and Gemini clients."""
        # Get Supabase credentials from environment (loaded via Infisical)
        supabase_url = os.getenv("SUPABASE_URL")
        # Check for service key with both possible names
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv(
            "NEXT_PUBLIC_SUPABASE_SERVICE_KEY")

        if not supabase_url:
            raise ValueError("SUPABASE_URL environment variable must be set")
        if not supabase_key:
            raise ValueError(
                "SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_SERVICE_KEY environment variable must be set")

        self.client: Client = create_client(supabase_url, supabase_key)
        self.gemini_service = get_gemini_service()

        logger.info("✅ Initialized RestaurantDescriptionGenerator")

    def ensure_description_column(self):
        """Ensure the restaurants table has a description column."""
        try:
            # Try to add description column if it doesn't exist
            logger.info("Checking if description column exists...")
            # This is a no-op if column already exists
            self.client.rpc('exec_sql', {
                'sql': 'ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS description TEXT;'
            }).execute()
            logger.info("✅ Description column ready")
        except Exception as e:
            logger.warning(
                f"Could not add description column (may already exist): {e}")

    def get_restaurants_without_description(self) -> List[Dict]:
        """
        Fetch all restaurants with empty or NULL descriptions.

        Returns:
            List of restaurant records without descriptions
        """
        try:
            logger.info(
                "Fetching restaurants with missing descriptions...")

            # Query for restaurants where description is NULL or empty
            response = self.client.table("restaurants")\
                .select("id, name, formatted_address, rating_avg, price_level, user_ratings_total")\
                .or_("description.is.null,description.eq.")\
                .execute()

            restaurants = response.data
            logger.info(
                f"Found {len(restaurants)} restaurants missing descriptions")

            return restaurants

        except Exception as e:
            logger.error(f"Failed to fetch restaurants: {e}")
            return []

    def get_restaurant_food_images(self, restaurant_id: str) -> List[Dict]:
        """
        Get food images with descriptions/dishes.

        Args:
            restaurant_id: UUID of the restaurant

        Returns:
            List of food image records
        """
        try:
            response = self.client.table("images")\
                .select("id, description, dish, cuisine")\
                .eq("restaurant_id", restaurant_id)\
                .not_.is_("dish", "null")\
                .execute()

            images = response.data or []
            logger.debug(
                f"Found {len(images)} food images for restaurant {restaurant_id}")
            return images

        except Exception as e:
            logger.error(
                f"Failed to fetch food images for restaurant {restaurant_id}: {e}")
            return []

    def get_restaurant_location_images(self, restaurant_id: str) -> List[Dict]:
        """
        Get location/ambiance images (ones without dish descriptions).

        Args:
            restaurant_id: UUID of the restaurant

        Returns:
            List of location image records
        """
        try:
            response = self.client.table("images")\
                .select("id, image_url, description")\
                .eq("restaurant_id", restaurant_id)\
                .is_("dish", "null")\
                .not_.is_("image_url", "null")\
                .limit(5)\
                .execute()

            images = response.data or []
            logger.debug(
                f"Found {len(images)} location images for restaurant {restaurant_id}")
            return images

        except Exception as e:
            logger.error(
                f"Failed to fetch location images for restaurant {restaurant_id}: {e}")
            return []

    def get_restaurant_reviews(self, restaurant_id: str, limit: int = 20) -> List[Dict]:
        """
        Get text reviews for a restaurant.

        Args:
            restaurant_id: UUID of the restaurant
            limit: Maximum number of reviews to fetch

        Returns:
            List of review records
        """
        try:
            response = self.client.table("reviews")\
                .select("id, description, rating, overall_rating, source")\
                .eq("restaurant_id", restaurant_id)\
                .not_.is_("description", "null")\
                .order("rating", desc=True)\
                .limit(limit)\
                .execute()

            reviews = response.data or []
            logger.debug(
                f"Found {len(reviews)} reviews for restaurant {restaurant_id}")
            return reviews

        except Exception as e:
            logger.error(
                f"Failed to fetch reviews for restaurant {restaurant_id}: {e}")
            return []

    def generate_description(
        self,
        restaurant_name: str,
        restaurant_address: Optional[str],
        rating: Optional[float],
        user_ratings_total: Optional[int],
        price_level: Optional[int],
        food_images: List[Dict],
        location_images: List[Dict],
        reviews: List[Dict]
    ) -> Optional[Dict[str, str]]:
        """
        Generate restaurant profile (cuisine, atmosphere, description) using Gemini AI.

        Args:
            restaurant_name: Name of the restaurant
            restaurant_address: Address of the restaurant
            rating: Average rating
            user_ratings_total: Total number of ratings
            price_level: Price level (1-4)
            food_images: List of food image records with dishes
            location_images: List of location/ambiance images
            reviews: List of review records

        Returns:
            Dict with 'cuisine', 'atmosphere', 'description' or None if failed
        """
        try:
            import google.generativeai as genai

            # Prepare context from food images
            food_context = []
            for img in food_images:
                if img.get('dish'):
                    dish_info = f"Dish: {img['dish']}"
                    if img.get('cuisine'):
                        dish_info += f" ({img['cuisine']} cuisine)"
                    food_context.append(dish_info)
                if img.get('description'):
                    food_context.append(f"Note: {img['description']}")

            # Prepare context from location images
            location_context = []
            for img in location_images:
                if img.get('description'):
                    location_context.append(f"Location: {img['description']}")

            # Prepare context from reviews
            review_context = []
            for review in reviews:
                if review.get('description'):
                    rating_str = f"({review.get('rating', 'N/A')}⭐)" if review.get(
                        'rating') else ""
                    review_context.append(
                        f"{rating_str}: {review['description']}")

            # Build comprehensive prompt
            price_symbols = {
                1: "$",
                2: "$$",
                3: "$$$",
                4: "$$$$"
            }
            price_str = price_symbols.get(
                price_level, "") if price_level else ""
            rating_str = f"{rating:.1f}⭐ ({user_ratings_total} ratings)" if rating and user_ratings_total else ""

            prompt = f"""You are analyzing a restaurant to generate its profile for a food discovery app.

RESTAURANT: {restaurant_name}
LOCATION: {restaurant_address or 'N/A'}
RATING: {rating_str} PRICE: {price_str}

AVAILABLE INFORMATION:

FOOD/DISHES ({len(food_context)} items):
{chr(10).join(food_context[:15]) if food_context else 'No dish information available'}

LOCATION/AMBIANCE ({len(location_context)} notes):
{chr(10).join(location_context[:5]) if location_context else 'No location details available'}

CUSTOMER REVIEWS ({len(review_context)} reviews):
{chr(10).join(review_context[:10]) if review_context else 'No reviews available'}

TASK:
Generate a restaurant profile with THREE components:

1. CUISINE: ONE WORD identifying the primary cuisine type (e.g., Italian, Mexican, American, Thai, Japanese, Chinese, etc.)
   - Base this on the dishes served and reviews
   - Must be a single word

2. ATMOSPHERE: A SHORT PHRASE (2-4 words) describing the vibe (e.g., "Casual family dining", "Upscale romantic", "Lively bar scene", "Cozy neighborhood spot")
   - Based on reviews, location images, price level, and overall feel
   - Focus on the experience/ambiance

3. DESCRIPTION: 2-3 sentences capturing the essence (50-100 words)
   - Include signature dishes and what makes it special
   - Conversational and engaging (as if recommending to a friend)
   - Use concrete details from the data above

Format your response EXACTLY as:
CUISINE: [one word]
ATMOSPHERE: [2-4 word phrase]
DESCRIPTION: [2-3 sentences]

EXAMPLES:
CUISINE: Italian
ATMOSPHERE: Romantic date night
DESCRIPTION: Cozy Italian spot perfect for date night, known for their house-made pasta and wood-fired pizzas. The intimate candlelit atmosphere and excellent wine selection create a romantic vibe, though it can get noisy on weekends.

CUISINE: Mexican
ATMOSPHERE: Lively casual dining
DESCRIPTION: Casual taco joint with a lively bar scene and creative Mexican fusion. Great for groups looking for a fun night out with margaritas and shareable apps. The fish tacos and street corn are must-tries.

Now generate for {restaurant_name}:"""

            # Call Gemini API
            response = self.gemini_service.model.generate_content(prompt)

            if response.text:
                text = response.text.strip()

                # Parse the structured response
                result = {
                    'cuisine': None,
                    'atmosphere': None,
                    'description': None
                }

                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('CUISINE:'):
                        cuisine = line.replace('CUISINE:', '').strip()
                        # Clean up formatting
                        cuisine = cuisine.replace('*', '').replace('#', '')
                        result['cuisine'] = cuisine
                    elif line.startswith('ATMOSPHERE:'):
                        atmosphere = line.replace('ATMOSPHERE:', '').strip()
                        # Clean up formatting
                        atmosphere = atmosphere.replace(
                            '*', '').replace('#', '')
                        result['atmosphere'] = atmosphere
                    elif line.startswith('DESCRIPTION:'):
                        description = line.replace('DESCRIPTION:', '').strip()
                        # Clean up formatting
                        description = description.replace(
                            '*', '').replace('#', '').replace('**', '')
                        result['description'] = description

                # Validation
                if not result['cuisine'] or not result['atmosphere'] or not result['description']:
                    logger.warning(
                        f"Incomplete response: cuisine={result['cuisine']}, atmosphere={result['atmosphere']}, description={bool(result['description'])}")
                    return None

                logger.info(
                    f"✅ Generated profile: {result['cuisine']} | {result['atmosphere']} | {len(result['description'])} chars")
                return result
            else:
                logger.warning("Gemini returned empty response")
                return None

        except Exception as e:
            logger.error(f"Failed to generate profile: {e}")
            return None

    def update_restaurant_profile(self, restaurant_id: str, cuisine: str, atmosphere: str, description: str) -> bool:
        """
        Update restaurant record with generated profile.

        Args:
            restaurant_id: UUID of the restaurant
            cuisine: Cuisine type (one word)
            atmosphere: Atmosphere description (short phrase)
            description: Generated description text

        Returns:
            True if update succeeded, False otherwise
        """
        try:
            update_data = {
                "cuisine": cuisine,
                "atmosphere": atmosphere,
                "description": description
            }

            self.client.table("restaurants")\
                .update(update_data)\
                .eq("id", restaurant_id)\
                .execute()

            logger.info(f"✅ Updated restaurant {restaurant_id}")
            return True

        except Exception as e:
            logger.error(
                f"Failed to update restaurant {restaurant_id}: {e}")
            return False

    def process_single_restaurant(self, restaurant: Dict) -> tuple[bool, str]:
        """
        Process a single restaurant: gather data, generate description, update.

        Args:
            restaurant: Restaurant record from database

        Returns:
            Tuple of (success: bool, status: str)
        """
        restaurant_id = restaurant['id']
        restaurant_name = restaurant['name']

        logger.info(f"\n{'='*60}")
        logger.info(f"Processing: {restaurant_name}")
        logger.info(f"ID: {restaurant_id}")

        # Gather associated data
        logger.info("Gathering food images, location images, and reviews...")
        food_images = self.get_restaurant_food_images(restaurant_id)
        location_images = self.get_restaurant_location_images(restaurant_id)
        reviews = self.get_restaurant_reviews(restaurant_id, limit=20)

        logger.info(
            f"Found {len(food_images)} food images, {len(location_images)} location images, {len(reviews)} reviews")

        # Check if we have enough data to generate a meaningful profile
        if len(food_images) == 0 and len(reviews) == 0:
            logger.warning(
                "⏭️  No food images or reviews available - skipping")
            return True, 'skipped'

        # Generate profile using Gemini
        logger.info("Generating restaurant profile with Gemini...")
        profile = self.generate_description(
            restaurant_name=restaurant_name,
            restaurant_address=restaurant.get('formatted_address'),
            rating=restaurant.get('rating_avg'),
            user_ratings_total=restaurant.get('user_ratings_total'),
            price_level=restaurant.get('price_level'),
            food_images=food_images,
            location_images=location_images,
            reviews=reviews
        )

        if not profile:
            logger.error("❌ Failed to generate profile")
            return False, 'failed'

        logger.info(
            f"Generated: {profile['cuisine']} | {profile['atmosphere']}")
        logger.info(f"Description: \"{profile['description'][:100]}...\"")

        # Update database
        success = self.update_restaurant_profile(
            restaurant_id,
            profile['cuisine'],
            profile['atmosphere'],
            profile['description']
        )

        if success:
            logger.info(f"✅ Successfully processed {restaurant_name}")
            return True, 'success'
        else:
            logger.error(f"❌ Failed to update {restaurant_name}")
            return False, 'failed'

    def run(self, batch_size: int = 5, delay_seconds: float = 2.0):
        """
        Main execution loop to process all restaurants.

        Args:
            batch_size: Number of restaurants to process before logging progress
            delay_seconds: Delay between API calls to avoid rate limits
        """
        import time

        logger.info("\n" + "="*60)
        logger.info("Starting Restaurant Profile Generation")
        logger.info("Generating: Cuisine, Atmosphere, Description")
        logger.info("="*60)

        # Ensure description column exists
        # self.ensure_description_column()

        # Fetch restaurants needing descriptions
        restaurants = self.get_restaurants_without_description()

        if not restaurants:
            logger.info(
                "✅ No restaurants found that need descriptions!")
            return

        total = len(restaurants)
        logger.info(f"\nProcessing {total} restaurants...")

        success_count = 0
        skipped_count = 0
        failure_count = 0

        for idx, restaurant in enumerate(restaurants, 1):
            logger.info(f"\n[{idx}/{total}] Processing restaurant...")

            try:
                success, status = self.process_single_restaurant(restaurant)

                if status == 'success':
                    success_count += 1
                elif status == 'skipped':
                    skipped_count += 1
                elif status == 'failed':
                    failure_count += 1

                # Log progress every batch_size restaurants
                if idx % batch_size == 0:
                    logger.info(f"\n{'='*60}")
                    logger.info(
                        f"PROGRESS: {idx}/{total} restaurants processed")
                    logger.info(
                        f"✅ Generated: {success_count}, ⏭️  Skipped: {skipped_count}, ❌ Failed: {failure_count}")
                    logger.info(f"{'='*60}\n")

                # Rate limiting delay
                if idx < total:  # Don't delay after last restaurant
                    time.sleep(delay_seconds)

            except Exception as e:
                logger.error(
                    f"Unexpected error processing restaurant {restaurant.get('name')}: {e}")
                failure_count += 1
                continue

        # Final summary
        logger.info("\n" + "="*60)
        logger.info("FINAL SUMMARY")
        logger.info("="*60)
        logger.info(f"Total restaurants processed: {total}")
        logger.info(f"✅ Successful profiles: {success_count}")
        logger.info(
            f"⏭️  Skipped (no data): {skipped_count}")
        logger.info(f"❌ Failed: {failure_count}")
        if (success_count + skipped_count) > 0:
            logger.info(
                f"Success rate: {(success_count/(success_count+skipped_count)*100):.1f}%")
        logger.info("="*60)
        logger.info("Generated fields: cuisine, atmosphere, description")


def main():
    """Main entry point."""
    try:
        generator = RestaurantDescriptionGenerator()

        # Run with settings:
        # - Process 5 restaurants between progress logs
        # - 2 second delay between API calls (descriptions are more complex)
        generator.run(batch_size=5, delay_seconds=2.0)

    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Script interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
