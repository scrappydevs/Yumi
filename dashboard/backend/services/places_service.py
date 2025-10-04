"""
Google Places API service for finding nearby restaurants.
"""

import os
import requests
from typing import List, Dict, Optional


class PlacesService:
    """Service for interacting with Google Places API."""

    def __init__(self):
        """Initialize Places API with key from environment."""
        self.api_key = os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not set")
        
        self.base_url = "https://maps.googleapis.com/maps/api/place"
        print(f"[PLACES] Initialized with API key: {self.api_key[:10]}...")

    def find_nearby_restaurants(
        self, 
        latitude: float, 
        longitude: float, 
        radius: int = 1000,
        limit: int = 25
    ) -> List[Dict[str, any]]:
        """
        Find nearby restaurants using Google Places API.

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            radius: Search radius in meters (default 1000m = 1km)
            limit: Maximum number of results (default 25)

        Returns:
            List of restaurant dictionaries with: name, cuisine, distance, rating, address

        Raises:
            Exception: If API call fails
        """
        try:
            print(f"[PLACES] Searching for restaurants near ({latitude}, {longitude})")
            
            # Nearby Search endpoint
            url = f"{self.base_url}/nearbysearch/json"
            
            params = {
                "location": f"{latitude},{longitude}",
                "radius": radius,
                "type": "restaurant",
                "key": self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                print(f"[PLACES ERROR] API returned {response.status_code}: {response.text}")
                raise Exception(f"Places API error: {response.status_code}")
            
            data = response.json()
            
            if data.get("status") not in ["OK", "ZERO_RESULTS"]:
                error_msg = data.get("error_message", data.get("status"))
                print(f"[PLACES ERROR] API status: {error_msg}")
                raise Exception(f"Places API error: {error_msg}")
            
            results = data.get("results", [])
            
            if not results:
                print("[PLACES] No restaurants found nearby")
                return []
            
            # Parse and format results
            restaurants = []
            for place in results[:limit]:
                restaurant = {
                    "name": place.get("name", "Unknown"),
                    "rating": place.get("rating", 0),
                    "address": place.get("vicinity", ""),
                    "price_level": place.get("price_level", 0),  # 0-4 scale
                    "types": place.get("types", []),
                    "latitude": place.get("geometry", {}).get("location", {}).get("lat"),
                    "longitude": place.get("geometry", {}).get("location", {}).get("lng"),
                }
                
                # Try to infer cuisine type from types
                cuisine = self._infer_cuisine_from_types(place.get("types", []))
                restaurant["cuisine"] = cuisine
                
                # Calculate approximate distance (in place results, but we'll use the order)
                restaurant["distance_rank"] = len(restaurants) + 1
                
                restaurants.append(restaurant)
                print(f"[PLACES]   {restaurant['distance_rank']}. {restaurant['name']} - {restaurant['cuisine']} ({restaurant['rating']}⭐)")
            
            print(f"[PLACES] Found {len(restaurants)} restaurants")
            return restaurants
            
        except Exception as e:
            print(f"[PLACES ERROR] Failed to fetch restaurants: {str(e)}")
            # Return empty list instead of failing - AI can still analyze without restaurants
            return []

    def _infer_cuisine_from_types(self, types: List[str]) -> str:
        """
        Infer cuisine type from Google Places types array.
        
        Args:
            types: List of place types from Google Places API
            
        Returns:
            Cuisine type string or "General"
        """
        # Map Google types to cuisine categories
        cuisine_mapping = {
            "chinese_restaurant": "Chinese",
            "japanese_restaurant": "Japanese",
            "italian_restaurant": "Italian",
            "mexican_restaurant": "Mexican",
            "indian_restaurant": "Indian",
            "thai_restaurant": "Thai",
            "french_restaurant": "French",
            "american_restaurant": "American",
            "pizza_restaurant": "Italian/Pizza",
            "sushi_restaurant": "Japanese/Sushi",
            "fast_food_restaurant": "Fast Food",
            "cafe": "Cafe",
            "bakery": "Bakery",
            "bar": "Bar & Grill",
            "steak_house": "Steakhouse",
            "seafood_restaurant": "Seafood",
            "vegetarian_restaurant": "Vegetarian",
            "vegan_restaurant": "Vegan",
        }
        
        for place_type in types:
            if place_type in cuisine_mapping:
                return cuisine_mapping[place_type]
        
        # Check for partial matches
        type_str = " ".join(types).lower()
        if "chinese" in type_str:
            return "Chinese"
        elif "japanese" in type_str or "sushi" in type_str:
            return "Japanese"
        elif "italian" in type_str or "pizza" in type_str:
            return "Italian"
        elif "mexican" in type_str:
            return "Mexican"
        elif "indian" in type_str:
            return "Indian"
        elif "thai" in type_str:
            return "Thai"
        elif "american" in type_str:
            return "American"
        elif "fast_food" in type_str or "fast food" in type_str:
            return "Fast Food"
        
        return "General"

    def format_restaurants_for_ai(self, restaurants: List[Dict[str, any]]) -> str:
        """
        Format restaurant list for AI prompt.
        
        Args:
            restaurants: List of restaurant dictionaries
            
        Returns:
            Formatted string for AI prompt
        """
        if not restaurants:
            return "No nearby restaurants found."
        
        lines = ["NEARBY RESTAURANTS (within 1km, ordered by distance):"]
        for i, restaurant in enumerate(restaurants, 1):
            rating_str = f"{restaurant['rating']}⭐" if restaurant['rating'] > 0 else "No rating"
            price_str = "$" * restaurant['price_level'] if restaurant['price_level'] > 0 else ""
            
            line = f"{i}. {restaurant['name']}"
            if restaurant['cuisine'] and restaurant['cuisine'] != "General":
                line += f" - {restaurant['cuisine']}"
            line += f" ({rating_str}"
            if price_str:
                line += f", {price_str}"
            line += ")"
            
            lines.append(line)
        
        return "\n".join(lines)


# Singleton instance
_places_service: Optional[PlacesService] = None


def get_places_service() -> PlacesService:
    """Get or create the singleton PlacesService instance."""
    global _places_service
    if _places_service is None:
        _places_service = PlacesService()
    return _places_service

