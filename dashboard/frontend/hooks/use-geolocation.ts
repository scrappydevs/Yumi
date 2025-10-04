import { useState, useEffect, useCallback } from 'react';

export interface GeolocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeolocationState {
  coords: GeolocationCoords | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
}

export interface UseGeolocationReturn extends GeolocationState {
  getCurrentLocation: () => Promise<GeolocationCoords>;
  clearError: () => void;
}

/**
 * Hook to get and manage user's current geolocation
 * 
 * @param autoFetch - If true, automatically fetch location on mount (default: false)
 * @param enableHighAccuracy - Request high accuracy GPS (default: true)
 * @param timeout - Timeout in ms for geolocation request (default: 10000)
 * @param maximumAge - Maximum age of cached position in ms (default: 0)
 */
export function useGeolocation(
  autoFetch: boolean = false,
  enableHighAccuracy: boolean = true,
  timeout: number = 10000,
  maximumAge: number = 0
): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    isLoading: false,
    error: null,
    isSupported: typeof window !== 'undefined' && 'geolocation' in navigator,
  });

  const getCurrentLocation = useCallback(async (): Promise<GeolocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!state.isSupported) {
        const error = 'Geolocation is not supported by your browser';
        setState(prev => ({ ...prev, error, isLoading: false }));
        reject(new Error(error));
        return;
      }

      // Check if running on secure context
      const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      if (!isSecureContext) {
        const error = 'Geolocation requires HTTPS or localhost. Your browser may block the request.';
        console.warn('⚠️ Geolocation requires secure context (HTTPS)');
        setState(prev => ({ ...prev, error, isLoading: false }));
        reject(new Error(error));
        return;
      }

      console.log('📍 Requesting geolocation permission...');
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeolocationCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          
          setState({
            coords,
            isLoading: false,
            error: null,
            isSupported: true,
          });
          
          console.log('✅ Location detected:', coords);
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              console.error('❌ Geolocation permission denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please check your device settings.';
              console.error('❌ Geolocation unavailable');
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              console.error('❌ Geolocation timeout');
              break;
            default:
              console.error('❌ Geolocation error:', error.message);
          }
          
          setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [state.isSupported, enableHighAccuracy, timeout, maximumAge]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-fetch on mount if requested
  useEffect(() => {
    if (autoFetch && state.isSupported && !state.coords && !state.isLoading) {
      getCurrentLocation().catch(() => {
        // Error already handled in getCurrentLocation
      });
    }
  }, [autoFetch, state.isSupported, state.coords, state.isLoading, getCurrentLocation]);

  return {
    ...state,
    getCurrentLocation,
    clearError,
  };
}

