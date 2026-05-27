
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;
let cachedApiKey: string | null = null;

const getCachedApiKey = async (): Promise<string> => {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem('gmaps_api_key');
    if (cached) {
      cachedApiKey = cached;
      return cached;
    }
  }

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

  cachedApiKey = apiKey;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('gmaps_api_key', apiKey);
  }

  return apiKey;
};

export const loadGoogleMaps = async (): Promise<void> => {
  if (isLoaded && window.google) {
    return Promise.resolve();
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  
  loadPromise = new Promise<void>(async (resolve, reject) => {
    try {
      const apiKey = await getCachedApiKey();

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        if (window.google?.maps?.Map) {
          isLoaded = true;
          isLoading = false;
          resolve();
          return;
        }
        
        const pollInterval = 100;
        const maxAttempts = 50;
        let attempts = 0;
        
        const checkExistingGoogleMaps = () => {
          attempts++;
          
          if (window.google?.maps?.Map) {
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

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        
        const pollInterval = 100; // Check every 100ms
        const maxAttempts = 50; // 50 * 100ms = 5 seconds
        let attempts = 0;
        
        const checkGoogleMaps = () => {
          attempts++;
          
          if (window.google?.maps?.Map) {
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
