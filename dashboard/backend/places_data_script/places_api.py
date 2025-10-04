"""
Google Places API wrapper with rate limiting and pagination.
"""
import requests
import time
from typing import List, Optional, Dict, Any
from models import Restaurant, RestaurantPhoto, RestaurantReview
from config import (
    GOOGLE_PLACES_API_KEY,
    SEARCH_RADIUS_METERS,
    NEXT_PAGE_TOKEN_DELAY,
    MAX_RETRIES,
    RATE_LIMIT_DELAY,
    PLACE_TYPE,
    PLACE_DETAILS_FIELDS,
    MAX_PHOTOS_PER_RESTAURANT
)
import logging

logger = logging.getLogger(__name__)


class PlacesAPI:
    """Wrapper for Google Places API operations."""

    BASE_URL = "https://maps.googleapis.com/maps/api/place"

    def __init__(self):
        self.api_key = GOOGLE_PLACES_API_KEY
        self.session = requests.Session()

    def nearby_search(self, lat: float, lng: float,
                      page_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform a Nearby Search for restaurants.

        Args:
            lat: Latitude of center point
            lng: Longitude of center point
            page_token: Optional token for pagination

        Returns:
            API response dict
        """
        url = f"{self.BASE_URL}/nearbysearch/json"

        params = {
            "key": self.api_key,
            "type": PLACE_TYPE
        }

        if page_token:
            params["pagetoken"] = page_token
        else:
            params["location"] = f"{lat},{lng}"
            params["radius"] = SEARCH_RADIUS_METERS

        for attempt in range(MAX_RETRIES):
            try:
                time.sleep(RATE_LIMIT_DELAY)
                response = self.session.get(url, params=params, timeout=10)
                response.raise_for_status()

                data = response.json()

                if data.get("status") == "INVALID_REQUEST" and page_token:
                    # Token not ready yet, wait and retry
                    logger.warning(
                        f"Page token not ready, waiting {NEXT_PAGE_TOKEN_DELAY}s...")
                    time.sleep(NEXT_PAGE_TOKEN_DELAY)
                    continue

                if data.get("status") not in ["OK", "ZERO_RESULTS"]:
                    logger.error(
                        f"API error: {data.get('status')} - {data.get('error_message', '')}")
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(2 ** attempt)
                        continue

                return data

            except requests.exceptions.RequestException as e:
                logger.error(
                    f"Request failed (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2 ** attempt)
                else:
                    raise

        return {"status": "ERROR", "results": []}

    def get_all_nearby_restaurants(self, lat: float, lng: float) -> List[Dict[str, Any]]:
        """
        Get all nearby restaurants with pagination.

        Args:
            lat: Latitude of center point
            lng: Longitude of center point

        Returns:
            List of place dicts
        """
        all_places = []
        page_token = None
        page_count = 0
        max_pages = 3  # Google typically limits to 60 results (3 pages × 20)

        while page_count < max_pages:
            if page_token:
                # Wait before using page token
                time.sleep(NEXT_PAGE_TOKEN_DELAY)

            response = self.nearby_search(lat, lng, page_token=page_token)

            if response.get("status") == "OK":
                results = response.get("results", [])
                all_places.extend(results)
                logger.info(
                    f"Page {page_count + 1}: Found {len(results)} places")
            elif response.get("status") == "ZERO_RESULTS":
                logger.info("No results found")
                break
            else:
                logger.error(f"Search failed: {response.get('status')}")
                break

            # Check for next page
            page_token = response.get("next_page_token")
            if not page_token:
                break

            page_count += 1

        logger.info(f"Total places found: {len(all_places)}")
        return all_places

    def get_place_details(self, place_id: str) -> Optional[Restaurant]:
        """
        Get detailed information for a specific place.

        Args:
            place_id: Google Places ID

        Returns:
            Restaurant object or None
        """
        url = f"{self.BASE_URL}/details/json"

        params = {
            "key": self.api_key,
            "place_id": place_id,
            "fields": ",".join(PLACE_DETAILS_FIELDS)
        }

        try:
            time.sleep(RATE_LIMIT_DELAY)
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data.get("status") != "OK":
                logger.error(
                    f"Details API error for {place_id}: {data.get('status')}")
                return None

            result = data.get("result", {})

            # Parse geometry
            geometry = result.get("geometry", {})
            location = geometry.get("location", {})

            # Create Restaurant object
            restaurant = Restaurant(
                place_id=place_id,
                name=result.get("name", "Unknown"),
                formatted_address=result.get("formatted_address"),
                lat=location.get("lat"),
                lng=location.get("lng"),
                phone_number=result.get("formatted_phone_number") or result.get(
                    "international_phone_number"),
                website=result.get("website"),
                google_maps_url=result.get("url"),
                rating_avg=result.get("rating"),
                user_ratings_total=result.get("user_ratings_total", 0),
                price_level=result.get("price_level")
            )

            return restaurant

        except Exception as e:
            logger.error(f"Failed to get details for {place_id}: {e}")
            return None

    def get_place_photos(self, place_id: str) -> List[RestaurantPhoto]:
        """
        Get photo references for a place from details API.

        Args:
            place_id: Google Places ID

        Returns:
            List of RestaurantPhoto objects
        """
        url = f"{self.BASE_URL}/details/json"

        params = {
            "key": self.api_key,
            "place_id": place_id,
            "fields": "photos"
        }

        try:
            time.sleep(RATE_LIMIT_DELAY)
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data.get("status") != "OK":
                return []

            result = data.get("result", {})
            photos_data = result.get("photos", [])

            photos = []
            for photo in photos_data[:MAX_PHOTOS_PER_RESTAURANT]:
                photos.append(RestaurantPhoto(
                    photo_reference=photo.get("photo_reference"),
                    width=photo.get("width"),
                    height=photo.get("height"),
                    html_attributions=photo.get("html_attributions", [])
                ))

            return photos

        except Exception as e:
            logger.error(f"Failed to get photos for {place_id}: {e}")
            return []

    def download_photo(self, photo_reference: str, max_width: int = 1600) -> Optional[bytes]:
        """
        Download photo by reference.

        Args:
            photo_reference: Photo reference from Places API
            max_width: Maximum width in pixels

        Returns:
            Image bytes or None
        """
        url = f"{self.BASE_URL}/photo"

        params = {
            "key": self.api_key,
            "photoreference": photo_reference,
            "maxwidth": max_width
        }

        try:
            time.sleep(RATE_LIMIT_DELAY)
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            return response.content

        except Exception as e:
            logger.error(f"Failed to download photo: {e}")
            return None

    def get_place_reviews(self, place_id: str) -> List[RestaurantReview]:
        """
        Get reviews for a place from details API.

        Args:
            place_id: Google Places ID

        Returns:
            List of RestaurantReview objects
        """
        url = f"{self.BASE_URL}/details/json"

        params = {
            "key": self.api_key,
            "place_id": place_id,
            "fields": "reviews"
        }

        try:
            time.sleep(RATE_LIMIT_DELAY)
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data.get("status") != "OK":
                return []

            result = data.get("result", {})
            reviews_data = result.get("reviews", [])

            reviews = []
            for review in reviews_data:
                reviews.append(RestaurantReview(
                    author_name=review.get("author_name", "Anonymous"),
                    rating=review.get("rating", 0),
                    text=review.get("text", ""),
                    time=review.get("time", 0),
                    relative_time_description=review.get(
                        "relative_time_description", ""),
                    author_url=review.get("author_url")
                ))

            return reviews

        except Exception as e:
            logger.error(f"Failed to get reviews for {place_id}: {e}")
            return []
