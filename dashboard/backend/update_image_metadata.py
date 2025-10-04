"""
Script to analyze images and populate missing dish/cuisine metadata using Gemini.

This script:
1. Fetches all images from the database that are missing dish or cuisine
2. Downloads each image from its URL
3. Uses Gemini Flash to analyze the image and extract dish/cuisine
4. Updates the database with the new metadata
"""
from services.gemini_service import GeminiService, get_gemini_service
import os
import sys
import logging
import requests
import time
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
        logging.FileHandler('image_metadata_update.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ImageMetadataUpdater:
    """Updates missing dish/cuisine metadata for images using Gemini."""

    ALLOWED_CUISINES = {
        "American", "Italian", "French", "Chinese", "Japanese", "Mexican", "Indian", "Thai",
        "Greek", "Spanish", "Korean", "Vietnamese", "Lebanese", "Turkish", "Moroccan",
        "Ethiopian", "Brazilian", "Peruvian", "Jamaican", "Cuban", "German", "Polish",
        "Russian", "Swedish", "Portuguese", "Filipino", "Malaysian", "Indonesian",
        "Singaporean", "Egyptian", "Iranian", "Afghan", "Nepalese", "Burmese",
        "Cambodian", "Georgian", "Armenian", "Argentinian", "Colombian", "Venezuelan",
        "Chilean", "Ecuadorian", "Bolivian", "Uruguayan", "Paraguayan", "Hungarian",
        "Austrian", "Swiss", "Belgian", "Dutch", "Danish", "Norwegian", "Finnish", "Icelandic"
    }

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

        logger.info("✅ Initialized ImageMetadataUpdater")

    def get_images_missing_metadata(self) -> List[Dict]:
        """
        Fetch all images that are missing dish or cuisine.

        Returns:
            List of image records with missing metadata
        """
        try:
            logger.info("Fetching images with missing dish or cuisine...")

            # Query for images where dish is NULL OR cuisine is NULL
            response = self.client.table("images")\
                .select("id, uuid, image_url, description, dish, cuisine")\
                .or_("dish.is.null,cuisine.is.null")\
                .not_.is_("image_url", "null")\
                .execute()

            images = response.data
            logger.info(f"Found {len(images)} images missing metadata")

            return images

        except Exception as e:
            logger.error(f"Failed to fetch images: {e}")
            return []

    def download_image(self, image_url: str) -> Optional[bytes]:
        """
        Download image from URL.

        Args:
            image_url: URL of the image

        Returns:
            Image bytes or None if download failed
        """
        try:
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            logger.error(f"Failed to download image from {image_url}: {e}")
            return None

    def analyze_image(self, image_bytes: bytes) -> Optional[Dict[str, str]]:
        """
        Analyze image using Gemini to extract dish and cuisine.

        Args:
            image_bytes: Raw image bytes

        Returns:
            Dictionary with 'dish' and 'cuisine' keys, or None if not food or failed
        """
        try:
            # First, check if the image contains food
            from PIL import Image
            import io
            import google.generativeai as genai

            image = Image.open(io.BytesIO(image_bytes))

            # Quick check: is this food?
            food_check_prompt = """Is this image showing food or a meal? 
            
Answer with ONLY one word:
- YES if this is food, a meal, a dish, a drink, or any edible item
- NO if this is not food (e.g., a person, place, object, scenery, etc.)

Answer:"""

            response = self.gemini_service.model.generate_content(
                [food_check_prompt, image])

            if response.text:
                answer = response.text.strip().upper()
                if answer == "NO" or "NO" in answer:
                    logger.info(
                        "⏭️  Image is not food - skipping without update")
                    return None

            # If it's food, proceed with detailed analysis
            result = self.gemini_service.analyze_food_image(image_bytes)

            # Validate that we got valid results
            dish = result.get('dish', 'Unknown Dish')
            cuisine = result.get('cuisine', 'Unknown')

            # Only return if we got meaningful results (not "Unknown")
            if dish != 'Unknown Dish' or cuisine != 'Unknown':
                # Double-check cuisine is in allowed list
                if cuisine not in self.ALLOWED_CUISINES:
                    logger.warning(
                        f"Cuisine '{cuisine}' not in allowed list, setting to None")
                    cuisine = None

                return {
                    'dish': dish if dish != 'Unknown Dish' else None,
                    'cuisine': cuisine if cuisine != 'Unknown' else None,
                    'description': result.get('description', '')
                }
            else:
                logger.warning(
                    "Gemini returned Unknown for both dish and cuisine")
                return None

        except Exception as e:
            logger.error(f"Failed to analyze image with Gemini: {e}")
            return None

    def update_image_metadata(self, image_id: int, dish: Optional[str], cuisine: Optional[str]) -> bool:
        """
        Update image record with dish and cuisine.

        Args:
            image_id: ID of the image record
            dish: Dish name
            cuisine: Cuisine type

        Returns:
            True if update succeeded, False otherwise
        """
        try:
            update_data = {}

            if dish:
                update_data['dish'] = dish
            if cuisine:
                update_data['cuisine'] = cuisine

            if not update_data:
                logger.warning(f"No data to update for image {image_id}")
                return False

            self.client.table("images")\
                .update(update_data)\
                .eq("id", image_id)\
                .execute()

            logger.info(
                f"✅ Updated image {image_id}: dish='{dish}', cuisine='{cuisine}'")
            return True

        except Exception as e:
            logger.error(f"Failed to update image {image_id}: {e}")
            return False

    def process_single_image(self, image: Dict) -> tuple[bool, str]:
        """
        Process a single image: download, analyze, update.

        Args:
            image: Image record from database

        Returns:
            Tuple of (success: bool, status: str) where status is 'success', 'skipped', or 'failed'
        """
        image_id = image['id']
        image_url = image['image_url']
        current_dish = image.get('dish')
        current_cuisine = image.get('cuisine')

        logger.info(f"\n{'='*60}")
        logger.info(f"Processing image {image_id}")
        logger.info(f"URL: {image_url}")
        logger.info(
            f"Current: dish='{current_dish}', cuisine='{current_cuisine}'")

        # Skip if both are already set
        if current_dish and current_cuisine:
            logger.info(f"Skipping - both dish and cuisine already set")
            return True, 'skipped'

        # Download image
        logger.info("Downloading image...")
        image_bytes = self.download_image(image_url)
        if not image_bytes:
            logger.error(f"❌ Failed to download image {image_id}")
            return False, 'failed'

        logger.info(f"Downloaded {len(image_bytes)} bytes")

        # Analyze with Gemini
        logger.info("Analyzing with Gemini Flash...")
        analysis = self.analyze_image(image_bytes)

        if not analysis:
            # Check if this was a non-food image (logged in analyze_image)
            # Return as skipped rather than failed
            return True, 'skipped'

        # Determine what to update (only update missing fields)
        dish_to_update = analysis['dish'] if not current_dish and analysis.get(
            'dish') else current_dish
        cuisine_to_update = analysis['cuisine'] if not current_cuisine and analysis.get(
            'cuisine') else current_cuisine

        logger.info(
            f"Analysis: dish='{dish_to_update}', cuisine='{cuisine_to_update}'")

        # Update database
        success = self.update_image_metadata(
            image_id, dish_to_update, cuisine_to_update)

        if success:
            logger.info(f"✅ Successfully processed image {image_id}")
            return True, 'success'
        else:
            logger.error(f"❌ Failed to update image {image_id}")
            return False, 'failed'

    def run(self, batch_size: int = 10, delay_seconds: float = 1.0):
        """
        Main execution loop to process all images.

        Args:
            batch_size: Number of images to process before logging progress
            delay_seconds: Delay between API calls to avoid rate limits
        """
        logger.info("\n" + "="*60)
        logger.info("Starting Image Metadata Update Script")
        logger.info("="*60)

        # Fetch images needing updates
        images = self.get_images_missing_metadata()

        if not images:
            logger.info("✅ No images found that need metadata updates!")
            return

        total = len(images)
        logger.info(f"\nProcessing {total} images...")

        success_count = 0
        skipped_count = 0
        failure_count = 0

        for idx, image in enumerate(images, 1):
            logger.info(f"\n[{idx}/{total}] Processing image...")

            try:
                success, status = self.process_single_image(image)

                if status == 'success':
                    success_count += 1
                elif status == 'skipped':
                    skipped_count += 1
                elif status == 'failed':
                    failure_count += 1

                # Log progress every batch_size images
                if idx % batch_size == 0:
                    logger.info(f"\n{'='*60}")
                    logger.info(f"PROGRESS: {idx}/{total} images processed")
                    logger.info(
                        f"✅ Updated: {success_count}, ⏭️  Skipped: {skipped_count}, ❌ Failed: {failure_count}")
                    logger.info(f"{'='*60}\n")

                # Rate limiting delay
                if idx < total:  # Don't delay after last image
                    time.sleep(delay_seconds)

            except Exception as e:
                logger.error(
                    f"Unexpected error processing image {image.get('id')}: {e}")
                failure_count += 1
                continue

        # Final summary
        logger.info("\n" + "="*60)
        logger.info("FINAL SUMMARY")
        logger.info("="*60)
        logger.info(f"Total images processed: {total}")
        logger.info(f"✅ Successful updates: {success_count}")
        logger.info(f"⏭️  Skipped (non-food/already set): {skipped_count}")
        logger.info(f"❌ Failed updates: {failure_count}")
        if (success_count + skipped_count) > 0:
            logger.info(
                f"Success rate: {(success_count/(success_count+skipped_count)*100):.1f}%")
        logger.info("="*60)


def main():
    """Main entry point."""
    try:
        updater = ImageMetadataUpdater()

        # Run with default settings:
        # - Process 10 images between progress logs
        # - 1 second delay between API calls
        updater.run(batch_size=10, delay_seconds=1.0)

    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Script interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
