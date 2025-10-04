/**
 * Reverse geocoding utilities to convert coordinates to location names
 */

type GeocodeResult = {
  city: string | null;
  state: string | null;
  country: string | null;
  formatted: string;
};

const geocodeCache = new Map<string, GeocodeResult>();

export async function reverseGeocode(geolocation: string | null): Promise<GeocodeResult> {
  if (!geolocation) {
    return { city: null, state: null, country: null, formatted: 'Unknown location' };
  }

  // Check cache first
  if (geocodeCache.has(geolocation)) {
    return geocodeCache.get(geolocation)!;
  }

  try {
    const coords = geolocation.split(',').map(c => parseFloat(c.trim()));
    if (coords.length !== 2 || coords.some(isNaN)) {
      return { city: null, state: null, country: null, formatted: geolocation };
    }

    const [lat, lng] = coords;

    // Use OpenStreetMap Nominatim API (free, no API key needed)
    // Note: Add User-Agent header as per their usage policy
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        headers: {
          'User-Agent': 'Aegis-Infrastructure-App/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    const address = data.address || {};

    const city = 
      address.city || 
      address.town || 
      address.village || 
      address.municipality || 
      address.county ||
      null;

    const state = address.state || null;
    const country = address.country || null;

    let formatted = '';
    if (city && state) {
      formatted = `${city}, ${state}`;
    } else if (city) {
      formatted = city;
    } else if (state) {
      formatted = state;
    } else {
      formatted = geolocation;
    }

    const result = { city, state, country, formatted };
    geocodeCache.set(geolocation, result);

    return result;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return { city: null, state: null, country: null, formatted: geolocation };
  }
}

export function parseCoordinates(geolocation: string | null): [number, number] | null {
  if (!geolocation) return null;
  
  try {
    const coords = geolocation.split(',').map(c => parseFloat(c.trim()));
    if (coords.length === 2 && !coords.some(isNaN)) {
      return [coords[0], coords[1]];
    }
  } catch (e) {
    console.error('Failed to parse coordinates:', e);
  }
  
  return null;
}

