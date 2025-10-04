"""
Implicit Signals Service - Track user interactions for preference learning.

This service tracks implicit user signals (searches, clicks, reservations)
and stores them with appropriate weights for preference learning.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from supabase_client import get_supabase


# Signal weights for different interaction types
SIGNAL_WEIGHTS = {
    'search': 1.0,          # User searches for something
    'view': 2.0,            # User hovers/opens modal
    'click': 3.0,           # User clicks on restaurant
    'maps_view': 5.0,       # User views in maps (strong intent)
    'reservation': 10.0,    # User makes reservation (highest signal)
}


class ImplicitSignalsService:
    """Service for tracking and analyzing implicit user signals."""

    def __init__(self):
        """Initialize with Supabase client."""
        self.supabase = get_supabase()
        print("[IMPLICIT SIGNALS] Service initialized")

    def track_search(
        self,
        user_id: str,
        query: str,
        latitude: float = None,
        longitude: float = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Track a search query.

        Args:
            user_id: User UUID
            query: Search query text
            latitude: Optional search location latitude
            longitude: Optional search location longitude
            metadata: Optional additional metadata (e.g., mentions, group search)

        Returns:
            Created interaction record
        """
        try:
            interaction = {
                'user_id': user_id,
                'interaction_type': 'search',
                'search_query': query,
                'signal_weight': SIGNAL_WEIGHTS['search'],
                'latitude': latitude,
                'longitude': longitude,
                'metadata': metadata or {},
                'created_at': datetime.utcnow().isoformat()
            }

            result = self.supabase.table(
                'user_interactions').insert(interaction).execute()

            print(
                f"[IMPLICIT SIGNALS] ✅ Tracked search: '{query[:50]}...' for user {user_id[:8]}...")
            return result.data[0] if result.data else {}

        except Exception as e:
            print(f"[IMPLICIT SIGNALS ERROR] Failed to track search: {str(e)}")
            # Don't crash - tracking is non-critical
            return {}

    def track_restaurant_interaction(
        self,
        user_id: str,
        interaction_type: str,
        place_id: str,
        restaurant_name: str,
        cuisine: str = None,
        atmosphere: str = None,
        address: str = None,
        latitude: float = None,
        longitude: float = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Track a restaurant interaction (view, click, maps_view, reservation).

        Args:
            user_id: User UUID
            interaction_type: Type of interaction (view, click, maps_view, reservation)
            place_id: Google Place ID (can be None for some restaurants)
            restaurant_name: Name of restaurant
            cuisine: Optional cuisine type (e.g., "Italian", "Thai")
            atmosphere: Optional atmosphere (e.g., "Casual", "Fine Dining", "Trendy", "Cozy")
            address: Optional restaurant address
            latitude: Optional restaurant latitude
            longitude: Optional restaurant longitude
            metadata: Optional additional metadata

        Returns:
            Created interaction record

        Note:
            All restaurant fields except name can be None. This is normal - 
            not all restaurants have complete data.
        """
        try:
            if interaction_type not in SIGNAL_WEIGHTS:
                print(
                    f"[IMPLICIT SIGNALS WARNING] Unknown interaction type: {interaction_type}")
                return {}

            interaction = {
                'user_id': user_id,
                'interaction_type': interaction_type,
                'restaurant_place_id': place_id,
                'restaurant_name': restaurant_name,
                'restaurant_cuisine': cuisine,
                'restaurant_atmosphere': atmosphere,
                'restaurant_address': address,
                'signal_weight': SIGNAL_WEIGHTS[interaction_type],
                'latitude': latitude,
                'longitude': longitude,
                'metadata': metadata or {},
                'created_at': datetime.utcnow().isoformat()
            }

            result = self.supabase.table(
                'user_interactions').insert(interaction).execute()

            print(f"[IMPLICIT SIGNALS] ✅ Tracked {interaction_type} on '{restaurant_name}' "
                  f"(weight: {SIGNAL_WEIGHTS[interaction_type]}) for user {user_id[:8]}...")
            return result.data[0] if result.data else {}

        except Exception as e:
            print(
                f"[IMPLICIT SIGNALS ERROR] Failed to track restaurant interaction: {str(e)}")
            return {}

    def get_recent_interactions(
        self,
        user_id: str,
        days: int = 90,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get user's recent interactions for preference analysis.

        Args:
            user_id: User UUID
            days: Number of days to look back (default: 90)
            limit: Maximum number of interactions to return

        Returns:
            List of interaction records, ordered by created_at DESC
        """
        try:
            cutoff_date = (datetime.utcnow() -
                           timedelta(days=days)).isoformat()

            result = self.supabase.table('user_interactions')\
                .select('*')\
                .eq('user_id', user_id)\
                .gte('created_at', cutoff_date)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()

            interactions = result.data or []
            print(
                f"[IMPLICIT SIGNALS] Retrieved {len(interactions)} recent interactions for user {user_id[:8]}...")
            return interactions

        except Exception as e:
            print(
                f"[IMPLICIT SIGNALS ERROR] Failed to get interactions: {str(e)}")
            return []

    def get_interaction_summary(self, user_id: str, days: int = 90) -> Dict[str, Any]:
        """
        Get a summary of user's interaction patterns.

        Args:
            user_id: User UUID
            days: Number of days to analyze

        Returns:
            Summary dict with counts, top cuisines, top restaurants, etc.
        """
        try:
            interactions = self.get_recent_interactions(
                user_id, days=days, limit=500)

            if not interactions:
                return {
                    'total_interactions': 0,
                    'search_count': 0,
                    'view_count': 0,
                    'click_count': 0,
                    'maps_view_count': 0,
                    'reservation_count': 0,
                    'top_cuisines': [],
                    'top_restaurants': [],
                    'search_queries': []
                }

            # Count by type
            type_counts = {}
            cuisines = {}
            atmospheres = {}
            restaurants = {}
            search_queries = []

            for interaction in interactions:
                itype = interaction.get('interaction_type', 'unknown')
                type_counts[itype] = type_counts.get(itype, 0) + 1

                # Track cuisines (weighted by signal strength)
                cuisine = interaction.get('restaurant_cuisine')
                if cuisine:
                    weight = interaction.get('signal_weight', 1.0)
                    cuisines[cuisine] = cuisines.get(cuisine, 0) + weight

                # Track atmospheres (weighted by signal strength)
                atmosphere = interaction.get('restaurant_atmosphere')
                if atmosphere:
                    weight = interaction.get('signal_weight', 1.0)
                    atmospheres[atmosphere] = atmospheres.get(
                        atmosphere, 0) + weight

                # Track restaurants (weighted)
                restaurant = interaction.get('restaurant_name')
                if restaurant:
                    weight = interaction.get('signal_weight', 1.0)
                    restaurants[restaurant] = restaurants.get(
                        restaurant, 0) + weight

                # Collect search queries
                query = interaction.get('search_query')
                if query:
                    search_queries.append(query)

            # Sort cuisines, atmospheres, and restaurants by weight
            top_cuisines = sorted(
                cuisines.items(), key=lambda x: x[1], reverse=True)[:10]
            top_atmospheres = sorted(
                atmospheres.items(), key=lambda x: x[1], reverse=True)[:10]
            top_restaurants = sorted(
                restaurants.items(), key=lambda x: x[1], reverse=True)[:10]

            summary = {
                'total_interactions': len(interactions),
                'search_count': type_counts.get('search', 0),
                'view_count': type_counts.get('view', 0),
                'click_count': type_counts.get('click', 0),
                'maps_view_count': type_counts.get('maps_view', 0),
                'reservation_count': type_counts.get('reservation', 0),
                'top_cuisines': [{'cuisine': c, 'weight': w} for c, w in top_cuisines],
                'top_atmospheres': [{'atmosphere': a, 'weight': w} for a, w in top_atmospheres],
                'top_restaurants': [{'name': r, 'weight': w} for r, w in top_restaurants],
                'search_queries': search_queries[:20]  # Last 20 searches
            }

            print(
                f"[IMPLICIT SIGNALS] Generated summary for user {user_id[:8]}...")
            print(f"  Total interactions: {summary['total_interactions']}")
            print(
                f"  Top cuisines: {[c['cuisine'] for c in summary['top_cuisines'][:3]]}")

            return summary

        except Exception as e:
            print(
                f"[IMPLICIT SIGNALS ERROR] Failed to generate summary: {str(e)}")
            return {}


# Singleton instance
_implicit_signals_service: Optional[ImplicitSignalsService] = None


def get_implicit_signals_service() -> ImplicitSignalsService:
    """Get or create singleton instance of ImplicitSignalsService."""
    global _implicit_signals_service

    if _implicit_signals_service is None:
        _implicit_signals_service = ImplicitSignalsService()

    return _implicit_signals_service
