"""
Restaurant Database Service - Query restaurants from public.restaurants table.

This service replaces Google Places API with database queries for better performance
and control over restaurant data.

SETUP REQUIRED:
Run setup_restaurant_search_rpc.sql in Supabase SQL Editor first!
"""
from typing import List, Dict, Any, Optional
from supabase_client import get_supabase


class RestaurantDatabaseService:
    """Service for querying restaurants from the database."""

    def __init__(self):
        """Initialize the service."""
        self.supabase = get_supabase()
        print("[RESTAURANT DB] Service initialized")

    def get_nearby_restaurants(
        self,
        latitude: float,
        longitude: float,
        radius_meters: int = 5000,
        limit: int = 50,
        min_rating: float = 0.0,
        min_reviews: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get nearby restaurants using PostGIS spatial queries via RPC function.

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            radius_meters: Search radius in meters (default: 5000m = 5km)
            limit: Maximum number of restaurants to return
            min_rating: Minimum average rating (default: 0.0)
            min_reviews: Minimum number of reviews (default: 0)

        Returns:
            List of restaurant dicts with all fields + distance
        """
        try:
            print(f"\n{'='*80}")
            print(f"[RESTAURANT DB] 🗄️  DATABASE QUERY")
            print(
                f"[RESTAURANT DB] RPC Function: search_nearby_restaurants_with_food_images")
            print(f"[RESTAURANT DB] Parameters:")
            print(f"[RESTAURANT DB]   - search_lat: {latitude}")
            print(f"[RESTAURANT DB]   - search_lng: {longitude}")
            print(
                f"[RESTAURANT DB]   - radius_m: {radius_meters}m ({radius_meters/1609.34:.2f} miles)")
            print(f"[RESTAURANT DB]   - result_limit: {limit}")
            print(f"[RESTAURANT DB]   - min_rating: {min_rating}")
            print(f"[RESTAURANT DB]   - min_reviews: {min_reviews}")

            # Call the search_nearby_restaurants_with_food_images RPC function (food images for initial view)
            response = self.supabase.rpc('search_nearby_restaurants_with_food_images', {
                'search_lat': latitude,
                'search_lng': longitude,
                'radius_m': radius_meters,
                'result_limit': limit,
                'min_rating': min_rating,
                'min_reviews': min_reviews
            }).execute()

            if not response.data:
                print(
                    f"[RESTAURANT DB] ❌ No restaurants found in {radius_meters}m radius")
                print(f"{'='*80}\n")
                return []

            restaurants = response.data
            print(
                f"[RESTAURANT DB] ✅ Query returned {len(restaurants)} restaurants")
            print(f"[RESTAURANT DB] Sample results (top 5):")
            for i, r in enumerate(restaurants[:5], 1):
                has_photo = "🍔" if r.get('food_image_url') else "🚫"
                dish_name = f" - {r.get('dish_name', 'N/A')}" if r.get(
                    'dish_name') else ""
                print(
                    f"[RESTAURANT DB]   {i}. {r['name']} - {r['cuisine']} ({r['rating_avg']}⭐, {r['user_ratings_total']} reviews) {has_photo}{dish_name}")

            # Format for compatibility with existing code
            print(
                f"[RESTAURANT DB] 🔄 Formatting {len(restaurants)} restaurants for response...")
            formatted_restaurants = []
            skipped_no_photo = 0

            for r in restaurants:
                food_image_url = r.get('food_image_url')

                # Skip restaurants without food images
                if not food_image_url:
                    skipped_no_photo += 1
                    continue

                # Get dish name for the response
                dish_name = r.get('dish_name', 'Unknown dish')

                formatted_restaurants.append({
                    'place_id': r['place_id'],
                    'name': r['name'],
                    'address': r['formatted_address'],
                    'latitude': r['latitude'],
                    'longitude': r['longitude'],
                    'rating': float(r['rating_avg']) if r['rating_avg'] else 0.0,
                    'user_ratings_total': r['user_ratings_total'],
                    'price_level': r['price_level'],
                    'cuisine': r['cuisine'] or 'Unknown',
                    'atmosphere': r['atmosphere'],
                    'description': r['description'],
                    'phone_number': r['phone_number'],
                    'website': r['website'],
                    'google_maps_url': r['google_maps_url'],
                    'photo_url': food_image_url,  # Using food image for initial view
                    'dish_name': dish_name,  # Include dish name
                    'distance_meters': r['distance_meters']
                })

            print(
                f"[RESTAURANT DB] ✅ Formatted {len(formatted_restaurants)} restaurants (skipped {skipped_no_photo} without food images)")
            print(f"{'='*80}\n")
            return formatted_restaurants

        except Exception as e:
            print(
                f"[RESTAURANT DB ERROR] Failed to get nearby restaurants: {str(e)}")
            print(
                f"[RESTAURANT DB ERROR] Make sure you've run setup_restaurant_search_rpc.sql in Supabase!")
            import traceback
            traceback.print_exc()
            return []

    def search_by_cuisine(
        self,
        latitude: float,
        longitude: float,
        cuisine_types: List[str],
        radius_meters: int = 5000,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Search restaurants by cuisine type(s).

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            cuisine_types: List of cuisine types to search for
            radius_meters: Search radius in meters
            limit: Maximum number of restaurants to return

        Returns:
            List of restaurant dicts
        """
        # Get all nearby restaurants first
        all_restaurants = self.get_nearby_restaurants(
            latitude, longitude, radius_meters, limit * 2  # Get more to filter
        )

        print(
            f"[RESTAURANT DB] Filtering {len(all_restaurants)} restaurants for cuisines: {cuisine_types}")

        # Filter by cuisine in Python (simple for MVP)
        cuisine_lower = [c.lower() for c in cuisine_types]
        filtered = []

        for r in all_restaurants:
            restaurant_cuisine = (r.get('cuisine') or '').lower()
            if any(c in restaurant_cuisine for c in cuisine_lower):
                filtered.append(r)

        print(
            f"[RESTAURANT DB] Found {len(filtered)} restaurants matching cuisine filter")
        return filtered[:limit]

    def extract_city_from_address(self, formatted_address: str) -> str:
        """
        Extract city name from formatted address.

        Format: "1 Brattle St, Cambridge, MA 02138, USA"
        City is the second component when split by commas.

        Args:
            formatted_address: Full formatted address string

        Returns:
            City name or "Unknown"
        """
        try:
            parts = [p.strip() for p in formatted_address.split(',')]
            if len(parts) >= 3:
                # City is usually the second element (after street address)
                return parts[1]
            return "Unknown"
        except Exception:
            return "Unknown"


# Singleton instance
_restaurant_db_service_instance: Optional[RestaurantDatabaseService] = None


def get_restaurant_db_service() -> RestaurantDatabaseService:
    """Get or create the singleton RestaurantDatabaseService instance."""
    global _restaurant_db_service_instance
    if _restaurant_db_service_instance is None:
        _restaurant_db_service_instance = RestaurantDatabaseService()
    return _restaurant_db_service_instance
