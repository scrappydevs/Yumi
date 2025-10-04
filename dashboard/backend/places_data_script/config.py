"""
Configuration for Google Places data fetching script.
"""
import os

# Google Places API Configuration
GOOGLE_PLACES_API_KEY = "AIzaSyB6gszOVviovlP2VW7YQXFupD00iCAIP7w"

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

# File paths
GRID_PROGRESS_FILE = "grid_progress.txt"
PROCESSED_PLACES_FILE = "processed_places.txt"
LOG_FILE = "places_fetch.log"

# Place types to search for
PLACE_TYPE = "restaurant"
