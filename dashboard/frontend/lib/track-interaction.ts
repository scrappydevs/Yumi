/**
 * Frontend utility for tracking implicit user interactions with restaurants.
 * 
 * This tracks user behavior (searches, clicks, views, reservations) to build
 * natural language preference profiles.
 * 
 * **Auto-updates preferences every ~10 interactions on the backend.**
 */

interface TrackInteractionParams {
  interactionType: 'view' | 'click' | 'maps_view' | 'reservation';
  placeId?: string;
  restaurantName?: string;
  cuisine?: string;
  atmosphere?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Track a restaurant interaction (non-blocking, fire-and-forget).
 * 
 * Signal weights:
 * - view: 2.0 (hover/modal)
 * - click: 3.0 (explicit selection)
 * - maps_view: 5.0 (strong intent)
 * - reservation: 10.0 (highest signal - commitment)
 * 
 * **Preferences auto-update every ~10 interactions.**
 * 
 * @param params Interaction parameters
 */
export async function trackInteraction(params: TrackInteractionParams): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('interaction_type', params.interactionType);
    
    if (params.placeId) formData.append('place_id', params.placeId);
    if (params.restaurantName) formData.append('restaurant_name', params.restaurantName);
    if (params.cuisine) formData.append('cuisine', params.cuisine);
    if (params.atmosphere) formData.append('atmosphere', params.atmosphere);
    if (params.address) formData.append('address', params.address);
    if (params.latitude !== undefined) formData.append('latitude', params.latitude.toString());
    if (params.longitude !== undefined) formData.append('longitude', params.longitude.toString());

    // Fire-and-forget - don't wait for response
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/track-interaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAccessToken()}`,
      },
      body: formData,
    }).catch(err => {
      // Silent fail - tracking is non-critical
      console.debug('[Track] Failed to track interaction:', err);
    });

    console.log(`[Track] ${params.interactionType} on ${params.restaurantName || 'restaurant'}`);
  } catch (error) {
    // Silent fail - tracking should never break user experience
    console.debug('[Track] Error:', error);
  }
}

/**
 * Helper to get access token from Supabase session.
 */
async function getAccessToken(): Promise<string> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  } catch (error) {
    console.debug('[Track] Failed to get access token:', error);
    return '';
  }
}

/**
 * Track when user views a restaurant (e.g., hovers over card, opens modal).
 */
export function trackView(restaurant: {
  place_id?: string;
  name: string;
  cuisine?: string;
  atmosphere?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}) {
  trackInteraction({
    interactionType: 'view',
    placeId: restaurant.place_id,
    restaurantName: restaurant.name,
    cuisine: restaurant.cuisine,
    atmosphere: restaurant.atmosphere,
    address: restaurant.address,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
  });
}

/**
 * Track when user clicks on a restaurant (explicit selection).
 */
export function trackClick(restaurant: {
  place_id?: string;
  name: string;
  cuisine?: string;
  atmosphere?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}) {
  trackInteraction({
    interactionType: 'click',
    placeId: restaurant.place_id,
    restaurantName: restaurant.name,
    cuisine: restaurant.cuisine,
    atmosphere: restaurant.atmosphere,
    address: restaurant.address,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
  });
}

/**
 * Track when user views restaurant in maps (high intent signal).
 */
export function trackMapsView(restaurant: {
  place_id?: string;
  name: string;
  cuisine?: string;
  atmosphere?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}) {
  trackInteraction({
    interactionType: 'maps_view',
    placeId: restaurant.place_id,
    restaurantName: restaurant.name,
    cuisine: restaurant.cuisine,
    atmosphere: restaurant.atmosphere,
    address: restaurant.address,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
  });
}

/**
 * Track when user makes a reservation (highest signal - actual commitment).
 */
export function trackReservation(restaurant: {
  place_id?: string;
  name: string;
  cuisine?: string;
  atmosphere?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}) {
  trackInteraction({
    interactionType: 'reservation',
    placeId: restaurant.place_id,
    restaurantName: restaurant.name,
    cuisine: restaurant.cuisine,
    atmosphere: restaurant.atmosphere,
    address: restaurant.address,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
  });
}

