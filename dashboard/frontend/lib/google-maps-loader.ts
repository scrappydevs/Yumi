// Singleton Google Maps loader to prevent multiple script loads

let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;
let cachedApiKey: string | null = null;

// Cache API key in sessionStorage for faster subsequent loads
const getCachedApiKey = async (): Promise<string> => {
  // Check memory cache first
  if (cachedApiKey) {
    return cachedApiKey;
  }

  // Check sessionStorage
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem('gmaps_api_key');
    if (cached) {
      cachedApiKey = cached;
      return cached;
    }
  }

  // Fetch from backend
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${apiUrl}/api/config/maps-key`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch API key: ${response.status}`);
  }

  const data = await response.json();
  const apiKey = data.apiKey;

  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  // Cache it
  cachedApiKey = apiKey;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('gmaps_api_key', apiKey);
  }

  return apiKey;
};

export const loadGoogleMaps = async (): Promise<void> => {
  // If already loaded, return immediately
  if (isLoaded && window.google) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;
  
  loadPromise = new Promise<void>(async (resolve, reject) => {
    try {
      const apiKey = await getCachedApiKey();

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps script already exists, waiting for load...');
        // Wait for existing script to load
        if (window.google) {
          isLoaded = true;
          isLoading = false;
          resolve();
          return;
        }
        
        // Listen for the existing script to load
        existingScript.addEventListener('load', () => {
          isLoaded = true;
          isLoading = false;
          resolve();
        });
        existingScript.addEventListener('error', () => {
          isLoading = false;
          reject(new Error('Failed to load existing Google Maps script'));
        });
        return;
      }

      // Create new script with optimized loading
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('✅ Google Maps API loaded successfully');
        isLoaded = true;
        isLoading = false;
        resolve();
      };
      
      script.onerror = () => {
        isLoading = false;
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);
      console.log('Google Maps script added to page');
      
    } catch (error) {
      isLoading = false;
      reject(error);
    }
  });

  return loadPromise;
};

export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded && !!window.google;
};
