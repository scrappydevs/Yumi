"""
Configuration for Google Places data fetching script.
"""
import os
import subprocess
from dotenv import load_dotenv


def sync_secrets():
    """Sync secrets from Infisical to .env file before loading environment variables"""
    try:
        result = subprocess.run(
            ["infisical", "export", "--env=dev", "--format=dotenv"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        if result.returncode == 0:
            # Write the output to .env file in backend directory
            env_path = os.path.join(os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))), '.env')
            with open(env_path, 'w') as f:
                f.write(result.stdout)
    except (FileNotFoundError, Exception):
        # Silently continue if Infisical is not available
        pass


# Sync and load secrets
sync_secrets()
load_dotenv(dotenv_path=os.path.join(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))), '.env'))

# Google Places API Configuration
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")

# Bounding box coordinates (Boston/Cambridge area)
BOTTOM_RIGHT = (42.358788, -71.075420)
TOP_LEFT = (42.389825, -71.148797)

# Priority location to process first
PRIORITY_LOCATION = (42.373479, -71.121816)

# Grid configuration
SEARCH_RADIUS_METERS = 500
OVERLAP_FACTOR = 0.3  # 30% overlap between circles (step by 70% of radius)

# API configuration
MAX_RESULTS_PER_LOCATION = 60  # Max from Google Places (3 pages × 20)
NEXT_PAGE_TOKEN_DELAY = 2  # Seconds to wait before using next_page_token
MAX_RETRIES = 3
RATE_LIMIT_DELAY = 0.2  # Seconds between API calls (5 requests/sec)

# Place Details fields to request
PLACE_DETAILS_FIELDS = [
    "place_id",
    "name",
    "formatted_address",
    "geometry",
    "formatted_phone_number",
    "international_phone_number",
    "website",
    "url",  # Google Maps URL
    "rating",
    "user_ratings_total",
    "price_level",
    "reviews",
    "photos"
]

# Photos configuration
MAX_PHOTOS_PER_RESTAURANT = 10
PHOTO_MAX_WIDTH = 1600

# Supabase configuration
SUPABASE_URL = os.getenv(
    "SUPABASE_URL", "https://ocwyjzrgxgpfwruobjfh.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jd3lqenJneGdwZndydW9iamZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MzExMywiZXhwIjoyMDc0OTQ5MTEzfQ.Fqsi4noCnZfepdcN5LCkzuDaEYAAmS6AUINT0xKvzRQ")
SUPABASE_STORAGE_BUCKET = "images"

# File paths (relative to places_data_script directory)
_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
GRID_PROGRESS_FILE = os.path.join(_MODULE_DIR, "grid_progress.txt")
PROCESSED_PLACES_FILE = os.path.join(_MODULE_DIR, "processed_places.txt")
LOG_FILE = os.path.join(_MODULE_DIR, "places_fetch.log")

# Place types to search for
PLACE_TYPE = "restaurant"
