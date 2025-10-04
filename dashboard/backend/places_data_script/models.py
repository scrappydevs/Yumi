"""
Data models for restaurant information.
"""
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime


@dataclass
class GridCell:
    """Represents a grid cell center point."""
    lat: float
    lng: float
    status: str = "pending"  # pending, processing, completed, failed
    places_found: int = 0
    error_message: Optional[str] = None

    def to_string(self) -> str:
        """Convert to string format for file storage."""
        return f"{self.lat},{self.lng},{self.status},{self.places_found},{self.error_message or ''}"

    @classmethod
    def from_string(cls, line: str) -> 'GridCell':
        """Parse from string format."""
        parts = line.strip().split(',')
        return cls(
            lat=float(parts[0]),
            lng=float(parts[1]),
            status=parts[2] if len(parts) > 2 else "pending",
            places_found=int(parts[3]) if len(parts) > 3 and parts[3] else 0,
            error_message=parts[4] if len(parts) > 4 and parts[4] else None
        )


@dataclass
class Restaurant:
    """Represents a restaurant from Google Places."""
    place_id: str
    name: str
    formatted_address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone_number: Optional[str] = None
    website: Optional[str] = None
    google_maps_url: Optional[str] = None
    rating_avg: Optional[float] = None
    user_ratings_total: Optional[int] = None
    price_level: Optional[int] = None


@dataclass
class RestaurantPhoto:
    """Represents a restaurant photo."""
    photo_reference: str
    width: int
    height: int
    html_attributions: List[str]


@dataclass
class RestaurantReview:
    """Represents a restaurant review from Google."""
    author_name: str
    rating: int
    text: str
    time: int
    relative_time_description: str
    author_url: Optional[str] = None
