import { useState, useEffect } from 'react';
import { reverseGeocode } from '@/lib/geocoding';

export function useReverseGeocode(geolocation: string | null) {
  const [locationName, setLocationName] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function geocode() {
      if (!geolocation) {
        setLocationName('No location');
        setLoading(false);
        return;
      }

      try {
        const result = await reverseGeocode(geolocation);
        setLocationName(result.formatted);
      } catch (error) {
        console.error('Geocoding error:', error);
        setLocationName(geolocation);
      } finally {
        setLoading(false);
      }
    }

    geocode();
  }, [geolocation]);

  return { locationName, loading };
}

