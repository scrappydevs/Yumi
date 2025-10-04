# Geolocation Feature

## Overview
Added a comprehensive geolocation feature to the web dashboard that allows users to easily find and use their current location for restaurant searches.

## What's New

### 1. Reusable Geolocation Hook (`use-geolocation.ts`)
A custom React hook that provides:
- **Manual location fetching** via `getCurrentLocation()` - respects user privacy by only requesting on explicit action
- **Optional automatic detection** on mount (disabled by default)
- **Error handling** with user-friendly messages for common scenarios:
  - Permission denied
  - Location unavailable
  - Timeout errors
- **Loading states** for better UX
- **Browser support detection**

#### Usage Example
```typescript
import { useGeolocation } from '@/hooks/use-geolocation';

function MyComponent() {
  // Pass false to prevent auto-requesting location on mount (recommended)
  const { coords, isLoading, error, getCurrentLocation } = useGeolocation(false);
  
  // Only request location when user explicitly clicks a button
  const handleUseLocation = async () => {
    const coords = await getCurrentLocation(); // This will prompt for permission
    // coords will contain { lat, lng, accuracy? }
  };
}
```

### 2. Enhanced Location Picker (Overview Page)

#### Features:
- **"Use Current Location" Button**: Prominently displayed at the top of the location dropdown
  - Only requests permission when clicked (respects user privacy)
  - Shows helpful text: "We'll ask for location permission"
- **Visual Indicators**:
  - Green checkmark icon when using current location
  - Pulsing green dot on the location button
  - Loading spinner while detecting location
- **Error Messages**: Clear, actionable error messages if location detection fails
- **Automatic City Detection**: When current location is used, automatically finds the nearest city from the predefined list
- **Manual Override**: Users can still select a city manually, which disables the current location mode

#### Visual States:
1. **Default**: Shows city name with navigation icon (rotating)
2. **Current Location Active**: 
   - Green location icon (Locate) instead of navigation icon
   - Pulsing green indicator dot
   - Green highlight in dropdown
3. **Detecting**: Loading spinner with "Locating..." text

## Implementation Details

### Locations & Coordinates
The app supports these cities with predefined coordinates:
- Boston (42.3601, -71.0589)
- New York City (40.7580, -73.9855)
- San Francisco (37.7749, -122.4194)
- Los Angeles (34.0522, -118.2437)
- Chicago (41.8781, -87.6298)
- Miami (25.7617, -80.1918)
- Austin (30.2672, -97.7431)

### Auto-Detection Algorithm
When a user's location is detected:
1. Get GPS coordinates from browser
2. Calculate Euclidean distance to all predefined cities
3. Set location to the nearest city
4. Use actual GPS coordinates for restaurant searches (more accurate than city center)

## Benefits

1. **Improved Accuracy**: Users get results based on their exact location, not just city center
2. **Better UX**: Clear visual feedback throughout the location detection process
3. **Flexibility**: Easy toggle between current location and manual city selection
4. **Reusability**: The hook can be used in other components (e.g., spatial/map views)
5. **Error Handling**: Graceful fallbacks when location is unavailable or denied

## Browser Compatibility
Uses the standard [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API):
- ✅ Chrome, Edge, Safari, Firefox (all modern versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ Requires HTTPS in production
- ⚠️ User must grant location permissions

## Privacy & Security
- **User-initiated only**: Location is ONLY requested when user explicitly clicks "Use Current Location"
- **Transparent**: Shows "We'll ask for location permission" before user clicks
- **No storage**: Location data is not stored permanently or transmitted to third parties
- **User control**: User can revoke permissions at any time via browser settings
- **Graceful fallback**: Falls back to manual city selection if permissions are denied

## Future Enhancements
- [ ] Remember user's location preference in localStorage
- [ ] Add "Use Current Location" to other pages (e.g., spatial map)
- [ ] Show actual address/neighborhood instead of nearest city
- [ ] Add geofencing for location-based notifications
- [ ] Support custom location search (not just predefined cities)

