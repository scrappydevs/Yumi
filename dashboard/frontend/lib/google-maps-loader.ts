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
        console.log('Google Maps script already exists, checking API...');
        // Check if API is fully available
        if (window.google?.maps?.Map) {
          console.log('✅ Google Maps API already available');
          isLoaded = true;
          isLoading = false;
          resolve();
          return;
        }
        
        // Poll for API to be ready (existing script might still be initializing)
        console.log('Waiting for existing script to initialize API...');
        const pollInterval = 100;
        const maxAttempts = 50;
        let attempts = 0;
        
        const checkExistingGoogleMaps = () => {
          attempts++;
          
          if (window.google?.maps?.Map) {
            console.log(`✅ Existing Google Maps API ready after ${attempts * pollInterval}ms`);
            isLoaded = true;
            isLoading = false;
            resolve();
          } else if (attempts >= maxAttempts) {
            console.error('❌ Existing Google Maps API failed to initialize');
            isLoading = false;
            reject(new Error('Existing Google Maps API initialization timeout'));
          } else {
            setTimeout(checkExistingGoogleMaps, pollInterval);
          }
        };
        
        checkExistingGoogleMaps();
        return;
      }

      // Create new script with optimized loading
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('✅ Google Maps script loaded, waiting for API initialization...');
        
        // Poll for google.maps.Map to be available (max 5 seconds)
        const pollInterval = 100; // Check every 100ms
        const maxAttempts = 50; // 50 * 100ms = 5 seconds
        let attempts = 0;
        
        const checkGoogleMaps = () => {
          attempts++;
          
          if (window.google?.maps?.Map) {
            console.log(`✅ Google Maps API fully initialized after ${attempts * pollInterval}ms`);
            isLoaded = true;
            isLoading = false;
            resolve();
          } else if (attempts >= maxAttempts) {
            console.error('❌ Google Maps API failed to initialize after 5 seconds');
            isLoading = false;
            reject(new Error('Google Maps API initialization timeout'));
          } else {
            setTimeout(checkGoogleMaps, pollInterval);
          }
        };
        
        checkGoogleMaps();
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
