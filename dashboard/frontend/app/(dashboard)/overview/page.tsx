'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Users,
  Sparkles,
  Send,
  Star,
  Navigation,
  ChevronDown,
  MessageSquare,
  Mic,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiquidGlassBlob } from '@/components/liquid-glass-blob';
import { MetallicSphereComponent } from '@/components/metallic-sphere';
import { MentionInput } from '@/components/ui/mention-input';
import { Mention } from '@/hooks/use-friend-mentions';
import { useSimpleTTS } from '@/hooks/use-simple-tts';
import { useVADRecording } from '@/hooks/use-vad-recording';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';

// Cuisine-based fallback images for restaurants without photos
const CUISINE_FALLBACK_IMAGES: { [key: string]: string } = {
  // Asian
  'Japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop', // sushi
  'Chinese': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=200&h=200&fit=crop', // chinese food
  'Thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=200&h=200&fit=crop', // pad thai
  'Korean': 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=200&h=200&fit=crop', // korean bbq
  'Vietnamese': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200&h=200&fit=crop', // pho
  'Indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop', // indian curry
  
  // Italian & Mediterranean
  'Italian': 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=200&h=200&fit=crop', // pasta
  'Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop', // pizza
  'Mediterranean': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop', // mediterranean
  'Greek': 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=200&h=200&fit=crop', // greek food
  
  // American & Fast Food
  'American': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', // burger
  'Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', // burger
  'BBQ': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=200&h=200&fit=crop', // bbq
  'Steakhouse': 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=200&h=200&fit=crop', // steak
  'Seafood': 'https://images.unsplash.com/photo-1559737558-2f4d82e4738a?w=200&h=200&fit=crop', // seafood
  
  // Latin American
  'Mexican': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop', // tacos
  'Latin': 'https://images.unsplash.com/photo-1626509653291-18d6f0290d3d?w=200&h=200&fit=crop', // latin food
  'Spanish': 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=200&h=200&fit=crop', // paella
  
  // Other
  'French': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop', // fine dining
  'Cafe': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop', // cafe
  'Coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop', // cafe
  'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop', // bakery
  'Dessert': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&h=200&fit=crop', // dessert
  'Ice Cream': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&h=200&fit=crop', // dessert
  'Vegetarian': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop', // salad
  'Vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop', // salad
  'Bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop', // bar
  'Pub': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop', // bar
  'Sushi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop', // sushi
  'Ramen': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200&h=200&fit=crop', // ramen
  'Noodle': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200&h=200&fit=crop', // noodles
  'Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop', // sandwich
  'Deli': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop', // deli
  
  // Default fallback
  'default': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop', // restaurant
};

// Helper function to get fallback image based on cuisine, name, or description
function getFallbackImage(cuisine?: string, nameOrDescription?: string): string {
  // Try cuisine first
  if (cuisine) {
    const cuisineMatch = Object.keys(CUISINE_FALLBACK_IMAGES).find(
      key => cuisine.toLowerCase().includes(key.toLowerCase())
    );
    if (cuisineMatch) {
      console.log(`🖼️ Fallback matched cuisine "${cuisine}" -> ${cuisineMatch}`);
      return CUISINE_FALLBACK_IMAGES[cuisineMatch];
    }
  }
  
  // Try name/description if cuisine didn't match
  if (nameOrDescription) {
    const descMatch = Object.keys(CUISINE_FALLBACK_IMAGES).find(
      key => nameOrDescription.toLowerCase().includes(key.toLowerCase())
    );
    if (descMatch) {
      console.log(`🖼️ Fallback matched name "${nameOrDescription}" -> ${descMatch}`);
      return CUISINE_FALLBACK_IMAGES[descMatch];
    }
  }
  
  // Always return default fallback - NEVER empty!
  console.log(`🖼️ Using default fallback for: ${nameOrDescription || 'unknown'}`);
  return CUISINE_FALLBACK_IMAGES['default'];
}

// Ensure a restaurant always has an image URL (never empty/null/undefined)
function ensureImageUrl(restaurant: any): string {
  if (restaurant.photo_url && restaurant.photo_url.trim()) {
    return restaurant.photo_url;
  }
  // No photo URL - use fallback
  return getFallbackImage(restaurant.cuisine, restaurant.name || restaurant.description);
}

// City coordinates mapping
const CITY_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  'New York City': { lat: 40.7580, lng: -73.9855 },
  'Boston': { lat: 42.3601, lng: -71.0589 },  // Near Harvard
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'Miami': { lat: 25.7617, lng: -80.1918 },
  'Austin': { lat: 30.2672, lng: -97.7431 },
};

interface SearchResult {
  name: string;
  cuisine: string;
  rating: number;
  address: string;
  price_level: number;
  match_score: number;
  reasoning: string;
  photo_url?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

// Helper function to estimate travel times
function calculateTravelTimes(distanceKm: number): { walk: string, drive: string } {
  const walkSpeed = 5; // km/h
  const driveSpeed = 30; // km/h average in city
  
  const walkMinutes = Math.round((distanceKm / walkSpeed) * 60);
  const driveMinutes = Math.round((distanceKm / driveSpeed) * 60);
  
  return {
    walk: walkMinutes < 60 ? `${walkMinutes} min` : `${Math.round(walkMinutes / 60)} hr ${walkMinutes % 60} min`,
    drive: driveMinutes < 60 ? `${driveMinutes} min` : `${Math.round(driveMinutes / 60)} hr ${driveMinutes % 60} min`
  };
}

export default function DiscoverPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<SearchResult | null>(null);
  const [hoveredRestaurant, setHoveredRestaurant] = useState<SearchResult | null>(null);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotationCyclesRef = useRef(0);  // Use ref for real-time access in interval
  const [location, setLocation] = useState('Boston');  // Default to Boston
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [dropdownPositionAbove, setDropdownPositionAbove] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showingResults, setShowingResults] = useState(false);  // New state for showing results
  const [isNarrowing, setIsNarrowing] = useState(false);  // New state for narrowing phase
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [expandedOnce, setExpandedOnce] = useState(false);
  const [absorbedIndices, setAbsorbedIndices] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('Finding the perfect spot for you');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [glowingIndices, setGlowingIndices] = useState<Set<number>>(new Set());

  // Rotating loading phrases - more varied and engaging (useMemo to prevent recreating)
  const loadingPhrases = useMemo(() => [
    'Finding the perfect spot for you',
    'Reading the culinary landscape',
    'Consulting the food gods',
    'Matching your vibe',
    'Uncovering hidden gems',
    'Decoding your taste DNA',
    'Scanning the flavor matrix',
    'Channeling your cravings',
  ], []);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [allNearbyImages, setAllNearbyImages] = useState<Array<{url: string, name: string, id: string, index?: number}>>([]);
  const [visibleImageIds, setVisibleImageIds] = useState<string[]>([]);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);
  const [lastLoadedLocation, setLastLoadedLocation] = useState<string>('');
  const [volume, setVolume] = useState(0.8); // 80% default volume
  const [friendsData, setFriendsData] = useState<Array<{id: string, username: string, display_name: string, avatar_url: string, recent_activity?: string}>>([]);
  const [hoveredFriend, setHoveredFriend] = useState<{id: string, username: string, display_name: string, avatar_url: string, recentReviews?: any[], favoriteRestaurants?: any[]} | null>(null);
  const { speak, isSpeaking, stop, setVolume: setAudioVolume } = useSimpleTTS();
  const { user } = useAuth();
  
  // VAD Recording hook for auto-stop on silence with streaming transcription
  const {
    isRecording,
    isTranscribing,
    vadScore,
    isSpeechDetected,
    toggleRecording,
  } = useVADRecording({
    silenceThreshold: 2500, // 2.5 seconds of silence
    speechThreshold: 0.5,
    enableStreaming: true, // Enable real-time streaming transcription
    streamingInterval: 2000, // Send chunks every 2 seconds
    onPartialTranscription: (text) => {
      // Update prompt with streaming text in real-time
      console.log('[Overview] Received partial transcription:', text);
      setPrompt(text);
    },
    onTranscriptionComplete: (text) => {
      // Final transcription (more accurate)
      console.log('[Overview] Received final transcription:', text);
      setPrompt(text);
    },
    onError: (error) => {
      console.error('VAD Recording error:', error);
    },
  });
  
  // Derived state: is this a group search?
  const isGroupSearch = mentions.length > 0;

  // Sync volume with audio output
  useEffect(() => {
    if (setAudioVolume) {
      setAudioVolume(volume);
    }
  }, [volume, setAudioVolume]);

  useEffect(() => {
    setMounted(true);
    console.log('🎬 Orbit animation started! Initial cycles:', rotationCyclesRef.current);
    
    // Orbit animation - smooth rotation at all times
    const interval = setInterval(() => {
      // Dynamic speed based on state and cycle count
      let speed;
      if (isThinking) {
        speed = 1.2;  // Faster during thinking
      } else if (showingResults) {
        speed = 0.6;  // Slower when showing results
      } else {
        // Latent state: SUPER fast for first 2 cycles, then slow down
        speed = rotationCyclesRef.current < 1 ? 5.0 : 0.8;
      }
      
      setRotation((prev) => {
        const newRotation = (prev + speed) % 360;
        // Track complete cycles (when we pass 360/0 degrees)
        if (prev > newRotation && !isThinking && !showingResults) {
          rotationCyclesRef.current += 1;
          console.log(`🔄 Rotation cycle complete! Count: ${rotationCyclesRef.current}, Speed will be: ${rotationCyclesRef.current < 1 ? 5.0 : 0.8}`);
        }
        return newRotation;
      });
    }, 50);
    
    // Get user's actual geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserCoords(coords);
          console.log(`📍 Detected location: ${coords.lat}, ${coords.lng}`);
          
          // Auto-detect closest city
          const distances = Object.entries(CITY_COORDINATES).map(([city, cityCoords]) => {
            const distance = Math.sqrt(
              Math.pow(coords.lat - cityCoords.lat, 2) + 
              Math.pow(coords.lng - cityCoords.lng, 2)
            );
            return { city, distance };
          });
          
          const closest = distances.sort((a, b) => a.distance - b.distance)[0];
          if (closest) {
            console.log(`🎯 Closest city: ${closest.city}`);
            setLocation(closest.city);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        }
      );
    }
    
    return () => {
      clearInterval(interval);
    };
  }, [isThinking, showingResults]);

  // Load default recommendations on mount and when location changes
  useEffect(() => {
    // Only load if:
    // - User is authenticated and component is mounted
    // - Not currently loading or thinking
    // - Location has actually changed (prevent duplicate calls)
    if (user && mounted && !isLoadingDefaults && !isThinking && location !== lastLoadedLocation) {
      loadDefaultRecommendations();
    }
  }, [user, mounted, location, isLoadingDefaults, isThinking, lastLoadedLocation]); // location change triggers reload

  // Load friends data for profile pictures
  useEffect(() => {
    if (!user || !mounted) return;

    async function loadFriends() {
      try {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('friends')
          .eq('id', user!.id)
          .single();

        if (profile?.friends && profile.friends.length > 0) {
          // Fetch friend profiles (limit to 6 for cleaner orbit)
          const { data: friends } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', profile.friends.slice(0, 6));

          if (friends) {
            setFriendsData(friends);
            console.log(`👥 Loaded ${friends.length} friends for orbit`);
          }
        }
      } catch (error) {
        console.error('Error loading friends:', error);
      }
    }

    loadFriends();
  }, [user, mounted]);

  // Rotate phrases while thinking/loading
  useEffect(() => {
    if (!isThinking) {
      setCurrentPhrase(loadingPhrases[0]); // Reset to first phrase
      return;
    }

    let phraseIndex = 0;
    
    // Speak the first phrase when thinking starts (always say the exact text)
    console.log('[Overview] Starting thinking, first phrase:', loadingPhrases[0]);
    if (!isMuted && speak) {
      speak(loadingPhrases[0]).catch(err => console.error('Speak error:', err));
    }

    const interval = setInterval(() => {
      phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
      const newPhrase = loadingPhrases[phraseIndex];
      console.log('[Overview] Rotating to phrase:', newPhrase);
      setCurrentPhrase(newPhrase);
      
      // Speak each new phrase if not muted (exact text match)
      if (!isMuted && speak) {
        speak(newPhrase).catch(err => console.error('Speak error:', err));
      }
    }, 3000); // Change phrase every 3 seconds

    return () => clearInterval(interval);
  }, [isThinking, loadingPhrases, isMuted, speak]); // Added speak back with proper handling

  useEffect(() => {
    if (isThinking) {
      setExpandedOnce(true);
    }
  }, [isThinking]);

  // During thinking - just keep images spinning in a constant circle (no swapping)
  useEffect(() => {
    // Clear any fade animations when thinking starts/stops
    if (!isThinking || isNarrowing) {
      setAbsorbedIndices([]);
    }
    // No swapping animation during thinking - just let them spin!
  }, [isThinking, isNarrowing]);

  // Random glow effect while thinking (but not during narrowing phase)
  useEffect(() => {
    if (!isThinking || isNarrowing) {
      setGlowingIndices(new Set());
      return;
    }

    const interval = setInterval(() => {
      const numImages = allNearbyImages.length;
      if (numImages === 0) return;

      // Randomly select 2-4 images to glow
      const numToGlow = Math.floor(Math.random() * 3) + 2; // 2 to 4 images
      const newGlowing = new Set<number>();
      
      while (newGlowing.size < Math.min(numToGlow, numImages)) {
        const randomIndex = Math.floor(Math.random() * numImages);
        newGlowing.add(randomIndex);
      }
      
      setGlowingIndices(newGlowing);
    }, 1500); // Change glowing images every 1.5 seconds

    return () => clearInterval(interval);
  }, [isThinking, isNarrowing, allNearbyImages.length]);

  // VAD recording now handled by useVADRecording hook above

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    const searchQuery = prompt;  // Save the query before clearing
    setPrompt('');  // Clear the input immediately
    setIsThinking(true);
    setShowingResults(false);  // Reset results state
    setIsNarrowing(false);  // Reset narrowing state
    setSearchError(null);
    setSearchResults([]);
    setAllNearbyImages([]); // Reset images for new search
    setVisibleImageIds([]);
    rotationCyclesRef.current = 0;  // Reset rotation cycles for next latent state
    
    // Check if this is a group search (has mentions)
    const isGroupSearch = mentions.length > 0;
    
    // Note: The rotating phrases with voice are handled by the useEffect hook
    // No need to speak here to avoid voice overlap
    
    // Set up 30-second timeout
    const timeoutId = setTimeout(() => {
      const timeoutText = 'No results found';
      setCurrentPhrase(timeoutText);
      setSearchError(timeoutText);
      setIsThinking(false);
      setShowingResults(false);
      if (!isMuted) {
        speak(timeoutText);
      }
    }, 30000); // 30 seconds
    
    try {
      // Get coordinates - use actual user location if available, otherwise use selected city
      const coords = userCoords || CITY_COORDINATES[location] || CITY_COORDINATES['Boston'];
      
      // Get auth session for JWT token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated. Please sign in.');
      }
      
      // PHASE 1: Fetch nearby restaurants immediately (no LLM, fast)
      // Step 1: Finding restaurants
      const step1Text = 'Finding restaurants nearby';
      setCurrentPhrase(step1Text);
      if (!isMuted) {
        await speak(step1Text);
      }
      console.log('📍 Fetching nearby restaurants...');
      const nearbyFormData = new FormData();
      nearbyFormData.append('latitude', coords.lat.toString());
      nearbyFormData.append('longitude', coords.lng.toString());
      nearbyFormData.append('radius', '2000');
      nearbyFormData.append('limit', '20');
      
      const nearbyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/restaurants/nearby`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: nearbyFormData,
      });
      
      if (!nearbyResponse.ok) {
        throw new Error('Failed to fetch nearby restaurants');
      }
      
      const nearbyData = await nearbyResponse.json();
      console.log(`✅ Got ${nearbyData.restaurants.length} nearby restaurants`);
      
      // Immediately show all nearby restaurant images with staggered animation
      const allImages = nearbyData.restaurants
        .map((r: any, index: number) => ({
          url: ensureImageUrl(r),
          name: r.name,
          id: r.place_id || `restaurant-${r.name}`,
          index
        }));
      
      if (allImages.length > 0) {
        // Just update images - let existing useEffect handle swapping animation
        setAllNearbyImages(allImages);
        
        // Show only ~10-15 images initially (so animation has images to swap in/out)
        const initialCount = Math.min(15, allImages.length);
        const initialImageIds = allImages.slice(0, initialCount).map((img: {id: string}) => img.id);
        setVisibleImageIds(initialImageIds);
        
        // Wait for "Finding restaurants nearby" speech to complete
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 2: Analyzing food preferences
        const step2Text = isGroupSearch 
          ? "Analyzing everyone's food preferences"
          : 'Analyzing your food preferences';
        setCurrentPhrase(step2Text);
        if (!isMuted) {
          await speak(step2Text);
        }
        
        // Wait for step 2 speech to complete before continuing
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // PHASE 2: Now call LLM for analysis (happens while images swap)
        console.log('🤖 Asking LLM to analyze restaurants...');
        console.log(`   Query: "${searchQuery}"`);
        console.log(`   Location: (${coords.lat}, ${coords.lng})`);
        if (isGroupSearch) {
          console.log(`👥 Group search with ${mentions.length} friends: ${mentions.map(m => m.username).join(', ')}`);
        }

        const searchFormData = new FormData();
        searchFormData.append('query', searchQuery);  // Use saved query
        searchFormData.append('latitude', coords.lat.toString());
        searchFormData.append('longitude', coords.lng.toString());
        
        // Add friend IDs if this is a group search
        if (isGroupSearch) {
          const friendIds = mentions.map(m => m.id).join(',');
          searchFormData.append('friend_ids', friendIds);
          console.log(`📋 Including friend IDs: ${friendIds}`);
        }
        
        // Use appropriate endpoint based on whether it's a group search
        const searchEndpoint = isGroupSearch
          ? '/api/restaurants/search-group'
          : '/api/restaurants/search';

        console.log(`📡 Calling ${searchEndpoint}...`);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${searchEndpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: searchFormData,
        });

        console.log(`📡 Response status: ${response.status}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Search failed' }));
          console.error('❌ Search failed:', errorData);
          throw new Error(errorData.detail || 'Failed to search restaurants');
        }

        const data = await response.json();
        console.log('✅ LLM analysis complete');
        console.log(`📊 Received ${data.top_restaurants?.length || 0} top restaurants`);
        console.log(`📊 Received ${data.all_nearby_restaurants?.length || 0} nearby restaurants`);
        
        // PHASE 3: Show final results
        if (data.top_restaurants && data.top_restaurants.length > 0) {
          // Filter to only restaurants with place_ids (photos have fallbacks now)
          const restaurantsWithIds = data.top_restaurants.filter((r: SearchResult) => r.place_id);
          const finalCount = Math.min(5, restaurantsWithIds.length);
          
          // Ensure all restaurants have a photo_url (use fallback if needed)
          restaurantsWithIds.forEach((r: SearchResult) => {
            if (!r.photo_url) {
              r.photo_url = getFallbackImage(r.cuisine, r.name);
            }
          });
          
          // Get the top N IDs
          const topIds = restaurantsWithIds
            .slice(0, finalCount)
            .map((r: SearchResult) => r.place_id);
          
          console.log(`🎯 Found top ${finalCount}: ${topIds.join(', ')}`);
          
          // Update status to "Narrowing down"
          setCurrentPhrase('Narrowing down');
          setIsNarrowing(true);  // Enable narrowing mode for different exit animation
          
          // Build current pool of images
          let currentImagePool = [...allNearbyImages];
          const existingIds = new Set(currentImagePool.map((img: {id: string}) => img.id));
          
          // First, merge filtered images into allNearbyImages (to ensure top N are available)
          if (data.all_nearby_restaurants && data.all_nearby_restaurants.length > 0) {
            const filteredImages = data.all_nearby_restaurants
              .filter((r: any) => r.place_id)
              .map((r: any, index: number) => ({
                url: ensureImageUrl(r),
                name: r.name,
                id: r.place_id,
                index: currentImagePool.length + index
              }));
            
            console.log(`🖼️ Merging ${filteredImages.length} filtered restaurants into image pool`);
            
            // Merge new images with existing ones (avoid duplicates)
            const newImages = filteredImages.filter((img: {id: string}) => !existingIds.has(img.id));
            newImages.forEach((img: {id: string}) => existingIds.add(img.id));
            currentImagePool = [...currentImagePool, ...newImages];
          }
          
          // CRITICAL: Ensure ALL top 5 restaurants are in the image pool
          const topRestaurants = restaurantsWithIds.slice(0, finalCount);
          topRestaurants.forEach((restaurant: SearchResult, idx: number) => {
            if (!existingIds.has(restaurant.place_id!)) {
              console.log(`⚠️ Adding missing top restaurant to pool: ${restaurant.name}`);
              currentImagePool.push({
                url: restaurant.photo_url!,
                name: restaurant.name,
                id: restaurant.place_id!,
                index: currentImagePool.length
              });
              existingIds.add(restaurant.place_id!);
            }
          });
          
          // Update the image pool
          setAllNearbyImages(currentImagePool);
          console.log(`✅ Image pool now has ${currentImagePool.length} restaurants, all top ${finalCount} guaranteed present`);
          
          // Verify all top restaurants have images in the pool
          topRestaurants.forEach((restaurant: SearchResult) => {
            const imageInPool = currentImagePool.find(img => img.id === restaurant.place_id);
            if (imageInPool) {
              console.log(`  ✓ ${restaurant.name}: ${imageInPool.url.substring(0, 50)}...`);
            } else {
              console.error(`  ✗ MISSING: ${restaurant.name} (ID: ${restaurant.place_id})`);
            }
          });
          
          // FIRST: Add ALL missing top images instantly (all at once)
          let currentVisible = [...visibleImageIds];
          const imagesToAdd = topIds.filter((id: string) => !currentVisible.includes(id));
          if (imagesToAdd.length > 0) {
            console.log(`➕ Adding ${imagesToAdd.length} top result images instantly...`);
            currentVisible = [...currentVisible, ...imagesToAdd];
            setVisibleImageIds(currentVisible);
            console.log(`✅ All top ${finalCount} restaurants now visible`);
          }
          
          // Brief pause to let the new images appear
          await new Promise(resolve => setTimeout(resolve, 600));
          
          // NOW: Gradually remove non-top images one by one (top images stay visible!)
          const imagesToRemove = currentVisible.filter((id: string) => !topIds.includes(id));
          
          // Shuffle for random removal effect
          const shuffledImagesToRemove = [...imagesToRemove].sort(() => Math.random() - 0.5);
          
          console.log(`🔽 Narrowing from ${currentVisible.length} to ${finalCount} images...`);
          
          // Remove one image at a time with delay (randomly) - but keep the top 5!
          for (const idToRemove of shuffledImagesToRemove) {
            await new Promise(resolve => setTimeout(resolve, 300)); // Delay between each removal
            currentVisible = currentVisible.filter(id => id !== idToRemove);
            setVisibleImageIds([...currentVisible]);
            console.log(`  ↓ ${currentVisible.length} remaining (keeping top ${finalCount})`);
          }
          
          // Wait for animations to settle
          await new Promise(resolve => setTimeout(resolve, 600));
          
          // Stop thinking and show results
          const step3Text = isGroupSearch
            ? `Found ${finalCount} great option${finalCount !== 1 ? 's' : ''} for your group`
            : `Found ${finalCount} great option${finalCount !== 1 ? 's' : ''}`;
          setCurrentPhrase(step3Text);
          
          // Switch to results state (keep images visible, calm blob)
          setIsThinking(false);
          setIsNarrowing(false);  // Exit narrowing mode
          setShowingResults(true);
          
          // Use the processed restaurants (with fallback images)
          setSearchResults(restaurantsWithIds.slice(0, finalCount));
          
          // Speak result if not muted - ensure TTS matches displayed text
          if (!isMuted) {
            await speak(step3Text);
          }
        } else {
          // No recommendations from LLM
          const noResultsText = 'No restaurants found. Try a different query or location.';
          setSearchError(noResultsText);
          setCurrentPhrase(noResultsText);
          setIsThinking(false);
          setShowingResults(false);
          if (!isMuted) {
            await speak(noResultsText);
          }
        }
      }
      
      // Clear timeout on successful completion
      clearTimeout(timeoutId);
      
    } catch (error) {
      console.error('Search error:', error);
      const errorText = error instanceof Error ? error.message : 'Failed to search restaurants';
      setSearchError(errorText);
      setCurrentPhrase('Sorry, something went wrong');
      setIsThinking(false);
      
      // Clear timeout on error
      clearTimeout(timeoutId);
      
      if (!isMuted) {
        await speak('Sorry, something went wrong');
      }
    }
  };

  const loadDefaultRecommendations = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingDefaults) {
      console.log('⏭️ Already loading defaults, skipping...');
      return;
    }
    
    setIsLoadingDefaults(true);
    
    try {
      // Get coordinates - use actual user location if available, otherwise use selected city
      const coords = userCoords || CITY_COORDINATES[location] || CITY_COORDINATES['Boston'];
      
      // Get auth session for JWT token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('🔒 Not authenticated, skipping default recommendations');
        setIsLoadingDefaults(false);
        return;
      }
      
      console.log(`📍 Loading nearby restaurants for ${location}...`);
      
      // Use the FAST nearby endpoint (no LLM, just Google Places)
      const formData = new FormData();
      formData.append('latitude', coords.lat.toString());
      formData.append('longitude', coords.lng.toString());
      formData.append('radius', '2000');
      formData.append('limit', '15');  // Fetch 20 for latent state
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/restaurants/nearby`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        console.error('❌ Failed to load nearby restaurants');
        setIsLoadingDefaults(false);
        return;
      }
      
      const data = await response.json();
      console.log(`✅ Got ${data.restaurants?.length || 0} nearby restaurants`);
      
      // Load restaurants for the photo wheel
      if (data.restaurants && data.restaurants.length > 0) {
        const images = data.restaurants
          .map((r: any) => ({
            url: ensureImageUrl(r),
            name: r.name,
            id: r.place_id || `restaurant-${r.name}`
          }));
        
        // Set all nearby images and visible images
        if (images.length > 0) {
          console.log(`🖼️ Displaying ${images.length} restaurant images`);
          setAllNearbyImages(images);
          setVisibleImageIds(images.map((img: {id: string}) => img.id));
          setLastLoadedLocation(location); // Mark this location as loaded
        }
        
        // Don't show results panel for default view
        setSearchResults([]);
      }
      
      console.log('✅ Nearby restaurants loaded successfully');
      
    } catch (error) {
      console.error('Error loading default recommendations:', error);
      // Fail silently - not critical to page load
    } finally {
      setIsLoadingDefaults(false);
    }
  };

  // toggleRecording now comes from useVADRecording hook

  if (!mounted) {
  return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-purple-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-white">
      
      {/* Sound Controls - Top Left */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
        <motion.button
          onClick={() => {
            setIsMuted(!isMuted);
            if (!isMuted && isSpeaking) stop();
          }}
          className="glass-layer-1 w-11 h-11 rounded-full shadow-soft relative overflow-hidden flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-red-500" />
          ) : (
            <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-purple-500 animate-pulse' : 'text-gray-600'}`} />
          )}
        </motion.button>

        {!isMuted && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 100, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="glass-layer-1 px-3 py-2.5 rounded-full shadow-soft flex items-center"
          >
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => setVolume(parseFloat(e.target.value) / 100)}
              className="w-20 h-1 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #9B87F5 0%, #9B87F5 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Test AI Button - Bottom Left */}
      <div className="absolute bottom-6 left-6 z-10">
        <motion.button
          onClick={() => setIsThinking(!isThinking)}
          className="glass-layer-1 px-4 py-2.5 rounded-full shadow-soft relative overflow-hidden flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
          <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-purple-600 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs font-medium">
            {isThinking ? 'Thinking...' : 'Test AI'}
          </span>
        </motion.button>
      </div>

      {/* Location Tagger - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <motion.div
          className="relative"
          initial={{ y: -10, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
          }}
          transition={{ 
            delay: 0.1,
            duration: 0.6,
            ease: "easeOut"
          }}
        >
          <motion.button
            className="glass-layer-1 pl-4 pr-5 py-3 rounded-full shadow-soft relative overflow-hidden flex items-center gap-2.5"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const spaceBelow = window.innerHeight - rect.bottom;
              const dropdownHeight = 180; // Approximate height for 6 items
              setDropdownPositionAbove(spaceBelow < dropdownHeight);
              setShowLocationPicker(!showLocationPicker);
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Specular highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-full" />
            
            <div className="flex items-center gap-2 relative">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Navigation className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              </motion.div>
              <span className="text-sm font-semibold">{location}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
        </div>
          </motion.button>

          {/* Location Picker Dropdown */}
          <AnimatePresence>
            {showLocationPicker && (
              <motion.div
                className={`absolute ${dropdownPositionAbove ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} right-0 glass-layer-1 rounded-xl shadow-strong overflow-hidden`}
                initial={{ opacity: 0, y: dropdownPositionAbove ? 10 : -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: dropdownPositionAbove ? 10 : -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ width: '110px' }}
              >
                {/* Specular highlight */}
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                
                <div className="relative py-2">
                  {['Boston', 'New York City', 'San Francisco', 'Los Angeles', 'Chicago', 'Miami', 'Austin'].map((loc) => (
                    <motion.button
                      key={loc}
                      className="w-full px-2 py-1.5 text-left text-xs font-medium hover:bg-white/40 transition-colors truncate"
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationPicker(false);
                      }}
                      whileHover={{ x: 2 }}
                      style={{
                        background: location === loc ? 'linear-gradient(90deg, rgba(155, 135, 245, 0.15), transparent)' : 'transparent',
                      }}
                    >
                      {loc}
                    </motion.button>
                  ))}
        </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Main Content - Orbiting Photos with Center Dot */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative w-[700px] h-[700px]" style={{ perspective: '1000px' }}>
          
          {/* Three.js Blob - Always mounted, just hidden/shown */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              opacity: (isThinking || showingResults) ? 1 : 0,
              transition: 'opacity 0.6s ease-out',
              zIndex: (isThinking || showingResults) ? 10 : -1,
            }}
          >
            {/* Apple-style pink and blue glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{
                scale: isThinking ? [1, 1.3, 1] : 1,
                opacity: isThinking ? [0.4, 0.6, 0.4] : 0,
                rotate: isThinking ? [0, 180, 360] : 0,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: 'radial-gradient(circle at 30% 40%, rgba(255, 107, 157, 0.5), rgba(0, 122, 255, 0.4), transparent 70%)',
                filter: 'blur(60px)',
              }}
            />
            
            {/* Secondary glow - blue to pink */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{
                scale: isThinking ? [1.1, 1.4, 1.1] : 1,
                opacity: isThinking ? [0.3, 0.5, 0.3] : 0,
                rotate: isThinking ? [360, 180, 0] : 0,
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              style={{
                background: 'radial-gradient(circle at 70% 60%, rgba(90, 200, 250, 0.4), rgba(255, 55, 95, 0.3), transparent 70%)',
                filter: 'blur(70px)',
              }}
            />
            
            <div className="w-[280px] h-[280px] relative">
              <LiquidGlassBlob isAnimating={isThinking} />
            </div>
            
            <motion.p
              className="text-sm font-semibold whitespace-nowrap text-center mt-6 bg-gradient-to-r from-[#FF375F] via-[#007AFF] to-[#5AC8FA] bg-clip-text text-transparent"
              animate={{
                opacity: (isThinking || showingResults) ? (isThinking ? [0.5, 1, 0.5] : 1) : 0,
                scale: isThinking ? [0.98, 1.02, 0.98] : 1,
              }}
              transition={{
                duration: 2.5,
                repeat: isThinking ? Infinity : 0,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              {currentPhrase}
            </motion.p>
          </div>
          
          {/* Metallic Sphere - 3D, subtle and latent */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              opacity: (isThinking || showingResults) ? 0 : 1,
              transition: 'opacity 0.01s ease-out',
              zIndex: 5,
            }}
          >
            {/* Subtle glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                opacity: [0.15, 0.25, 0.15],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: 'radial-gradient(circle at center, rgba(200, 200, 220, 0.2), transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            
            <div className="w-24 h-24 relative ml-3">
              <MetallicSphereComponent isActive={false} />
            </div>
            
            <motion.p
              className="mt-6 text-md font-bold whitespace-nowrap text-center bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              Feeling Hungry?
            </motion.p>
          </div>

          {/* Orbiting Restaurant Photos - Dynamic from actual search results */}
          <AnimatePresence mode="sync">
          {(() => {
            // Filter to only visible images
            const visibleImages = allNearbyImages.filter(img => visibleImageIds.includes(img.id));
            const numImages = visibleImages.length;
            
            if (numImages === 0) return null;
            
            return visibleImages.map((item, visibleIndex) => {
              // Find the original index in allNearbyImages (for animation system)
              const originalIndex = allNearbyImages.findIndex(img => img.id === item.id);
              
              // Check if being faded out (during thinking)
              const isFadingOut = absorbedIndices.includes(originalIndex) && isThinking;
              
              // Calculate position on circle (use visibleIndex for positioning)
              const angle = ((visibleIndex / Math.max(numImages, 3)) * 360 + rotation) * (Math.PI / 180);
              const baseRadius = (isThinking || showingResults) ? 420 : 300;  // Larger radius when thinking/showing results
              const x = 350 + Math.cos(angle) * baseRadius;
              const y = 350 + Math.sin(angle) * baseRadius;
              
              // Find the matching restaurant data if available
              const matchingRestaurant = searchResults.find(r => r.place_id === item.id);
              
              return (
                <motion.div
                  key={item.id}
                  className="absolute"
                  initial={{ 
                    opacity: 0, 
                    scale: 0.3,  // Start small
                    left: '50%',  // Start at center
                    top: '50%'    // Start at center
                  }}
                  animate={{
                    left: x,
                    top: y,
                    opacity: isFadingOut ? 0 : 1,  // Fade to completely invisible
                    scale: 1,  // Expand to full size
                  }}
                  exit={{
                    // Fade out in place
                    opacity: 0,
                    scale: 0.9,
                    transition: { duration: 0.4, ease: 'easeOut' }
                  }}
                  transition={{
                    // Instant movement during fast rotation (< 2 cycles), smooth during slow rotation
                    left: { duration: rotationCyclesRef.current < 1 ? 0 : 0, ease: 'linear' },
                    top: { duration: rotationCyclesRef.current < 1 ? 0 : 0, ease: 'linear' },
                    opacity: { duration: 0.4, ease: 'easeInOut' },
                    scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                    // No delay - all images appear at once to prevent repositioning
                  }}
                  style={{
                    x: '-50%',
                    y: '-50%',
                    zIndex: 'auto',
                  }}
                >
                  <motion.div
                    className="rounded-2xl p-2.5 shadow-medium cursor-pointer relative overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.35)',
                      backdropFilter: 'blur(30px) saturate(180%)',
                      border: '0.25px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: 'inset 0 0 30px -8px rgba(255, 255, 255, 0.9), 0 8px 28px rgba(0, 0, 0, 0.12)',
                      transformStyle: 'preserve-3d',
                    }}
                    animate={isThinking && glowingIndices.has(visibleIndex) ? {
                      boxShadow: [
                        'inset 0 0 30px -8px rgba(255, 255, 255, 0.9), 0 8px 28px rgba(0, 0, 0, 0.12)',
                        `inset 0 0 30px -8px rgba(255, 255, 255, 0.9), 0 0 40px 8px rgba(139, 92, 246, 0.6), 0 0 60px 12px rgba(59, 130, 246, 0.4)`,
                        'inset 0 0 30px -8px rgba(255, 255, 255, 0.9), 0 8px 28px rgba(0, 0, 0, 0.12)',
                      ],
                    } : {}}
                    transition={isThinking && glowingIndices.has(visibleIndex) ? {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    } : {}}
                    whileHover={{ 
                      scale: 1.1,
                      zIndex: 50,
                      boxShadow: 'inset 0 0 35px -8px rgba(255, 255, 255, 0.95), 0 16px 48px rgba(0, 0, 0, 0.2)',
                      transition: { duration: 0.3 }
                    }}
                    onMouseEnter={() => matchingRestaurant && setHoveredRestaurant(matchingRestaurant)}
                    onMouseLeave={() => setHoveredRestaurant(null)}
                    onClick={() => matchingRestaurant && setSelectedRestaurant(matchingRestaurant)}
                  >
                    {/* Inner specular highlight */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none rounded-t-2xl"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
                      }}
                    />
                    
                    <div className="relative group">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="object-cover rounded-xl"
                        style={{
                          width: '112px',
                          height: '112px',
                          minWidth: '112px',
                          minHeight: '112px',
                          maxWidth: '112px',
                          maxHeight: '112px',
                          boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
                        }}
                      />
                      {/* Info overlay on hover */}
                      {matchingRestaurant && (
                        <motion.div 
                          className="absolute inset-0 rounded-xl flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          whileHover={{ 
                            opacity: 1,
                            transition: { duration: 0.2 }
                          }}
                          style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.3), transparent)',
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="text-white text-[10px] font-bold truncate mb-0.5">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span className="text-white text-[9px] font-semibold">{matchingRestaurant.rating}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            });
          })()}
          </AnimatePresence>

          {/* Orbiting Friend Avatars - Between center and restaurants */}
          <AnimatePresence>
          {friendsData.length > 0 && !isThinking && !showingResults && friendsData.map((friend, index) => {
            // Calculate position on inner circle (radius 150)
            const angle = ((index / friendsData.length) * 360 + rotation * 0.7) * (Math.PI / 180); // Slower rotation
            const friendRadius = 150;
            const x = 350 + Math.cos(angle) * friendRadius;
            const y = 350 + Math.sin(angle) * friendRadius;
            
            return (
              <motion.div
                key={friend.id}
                className="absolute"
                initial={{ scale: 0.3, left: '50%', top: '50%', opacity: 0 }}
                animate={{
                  left: `${x}px`,
                  top: `${y}px`,
                  scale: 1,
                  opacity: 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  left: { duration: 0, ease: 'linear' },
                  top: { duration: 0, ease: 'linear' },
                  opacity: { duration: 0.4, ease: 'easeInOut' },
                  scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                }}
                style={{
                  width: '64px',
                  height: '64px',
                  marginLeft: '-32px',
                  marginTop: '-32px',
                  zIndex: 5,
                  cursor: 'pointer',
                }}
                onMouseEnter={async () => {
                  // Fetch friend's recent activity
                  try {
                    const supabase = createClient();
                    
                    // Get recent reviews
                    const { data: reviews } = await supabase
                      .from('reviews')
                      .select('restaurant_name, rating, comment, created_at')
                      .eq('user_id', friend.id)
                      .order('created_at', { ascending: false })
                      .limit(3);
                    
                    console.log(`👤 Loaded activity for ${friend.display_name || friend.username}: ${reviews?.length || 0} reviews`);
                    
                    setHoveredFriend({
                      ...friend,
                      recentReviews: reviews || [],
                    });
                  } catch (error) {
                    console.error('Error loading friend activity:', error);
                    setHoveredFriend({...friend});
                  }
                }}
                onMouseLeave={() => setHoveredFriend(null)}
              >
                <div className="relative w-full h-full">
                  {/* Liquid glass container with gradient border */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(155, 135, 245, 0.6), rgba(99, 102, 241, 0.6))',
                      padding: '2px',
                    }}
                  >
                    <div 
                      className="w-full h-full rounded-full overflow-hidden relative"
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <NextImage
                        src={friend.avatar_url || '/default-avatar.png'}
                        alt={friend.display_name || friend.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Small name label on hover */}
                  {hoveredFriend?.id === friend.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 rounded-xl whitespace-nowrap pointer-events-none"
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        border: '0.5px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 8px 24px rgba(0, 0, 0, 0.12)',
                      }}
                    >
                      <div className="text-xs font-semibold text-gray-900">
                        {friend.display_name || friend.username}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
                  </div>
                </div>
                
      {/* Friend Activity Panel - Appears on right when hovering over a friend */}
      <AnimatePresence>
        {hoveredFriend && !isThinking && !showingResults && (
          <motion.div
            key="friend-panel"
            className="fixed right-8 top-1/4 w-96 pointer-events-none z-50"
            initial={{ opacity: 0, x: 50, y: '-50%' }}
            animate={{ opacity: 1, x: 0, y: '-50%' }}
            exit={{ opacity: 0, x: 50, y: '-50%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div 
              className="glass-layer-1 rounded-3xl p-6 shadow-strong relative overflow-hidden"
              style={{
                backdropFilter: 'blur(40px) saturate(180%)',
                background: 'rgba(255, 255, 255, 0.5)',
                border: '0.5px solid rgba(255, 255, 255, 0.6)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 20px 60px rgba(0, 0, 0, 0.15), 0 30px 80px rgba(155, 135, 245, 0.2)',
                filter: 'drop-shadow(0 20px 40px rgba(99, 102, 241, 0.25)) drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))',
              }}
            >
              {/* Specular highlight */}
              <div 
                className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none rounded-t-3xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%)',
                }}
              />
              
              <div className="relative space-y-4">
                {/* Friend Header */}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-16 h-16 rounded-full overflow-hidden relative"
                    style={{
                      background: 'linear-gradient(135deg, rgba(155, 135, 245, 0.6), rgba(99, 102, 241, 0.6))',
                      padding: '2px',
                    }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-white">
                      <NextImage
                        src={hoveredFriend.avatar_url || '/default-avatar.png'}
                        alt={hoveredFriend.display_name || hoveredFriend.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {hoveredFriend.display_name || hoveredFriend.username}
                    </h3>
                    <p className="text-sm text-gray-600">
                      @{hoveredFriend.username}
                    </p>
                  </div>
                </div>
                
                {/* Recent Reviews */}
                {hoveredFriend.recentReviews && hoveredFriend.recentReviews.length > 0 ? (
                  <div className="pt-2 border-t border-gray-200/50">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Recent Activity
                    </p>
                    <div className="space-y-3">
                      {hoveredFriend.recentReviews.map((review: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">
                              {review.restaurant_name}
                            </p>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium text-gray-700">
                                {review.rating}
                              </span>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              "{review.comment}"
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-200/50">
                    <p className="text-sm text-gray-500 italic">
                      No recent activity yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Panel - Appears on right when hovering over a restaurant */}
      <AnimatePresence>
        {hoveredRestaurant && showingResults && (
          <motion.div
            key="hover-panel"
            className="fixed right-8 top-1/2 w-96 pointer-events-none z-50"
            initial={{ opacity: 0, x: 50, y: '-50%' }}
            animate={{ opacity: 1, x: 0, y: '-50%' }}
            exit={{ opacity: 0, x: 50, y: '-50%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div 
              className="glass-layer-1 rounded-3xl p-6 shadow-strong relative overflow-hidden"
              style={{
                backdropFilter: 'blur(40px) saturate(180%)',
                background: 'rgba(255, 255, 255, 0.5)',
                border: '0.5px solid rgba(255, 255, 255, 0.6)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 20px 60px rgba(0, 0, 0, 0.15)',
              }}
            >
              {/* Specular highlight */}
              <div 
                className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none rounded-t-3xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%)',
                }}
              />
              
              <div className="relative space-y-4">
                {/* Restaurant Name */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {hoveredRestaurant.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {hoveredRestaurant.cuisine} • {hoveredRestaurant.price_level === 1 ? '$' : hoveredRestaurant.price_level === 2 ? '$$' : hoveredRestaurant.price_level === 3 ? '$$$' : '$$$$'}
                  </p>
                </div>
                
                {/* Match Score */}
                {hoveredRestaurant.match_score && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${hoveredRestaurant.match_score * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round(hoveredRestaurant.match_score * 100)}%
                    </span>
                  </div>
                )}
                
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-semibold text-gray-900">
                    {hoveredRestaurant.rating}
                  </span>
                </div>
                
                {/* Reasoning */}
                {hoveredRestaurant.reasoning && (
                  <div className="pt-2 border-t border-gray-200/50">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Why we recommend this:
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {hoveredRestaurant.reasoning}
                    </p>
                  </div>
                )}
                
                {/* Address */}
                {hoveredRestaurant.address && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      {hoveredRestaurant.address}
                    </p>
                  </div>
                )}
                
                {/* Distance & Travel Time */}
                {userCoords && hoveredRestaurant.latitude && hoveredRestaurant.longitude && (
                  <div className="pt-2 border-t border-gray-200/50 mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Distance & Travel:
                    </p>
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const distanceKm = calculateDistance(
                          userCoords.lat, userCoords.lng,
                          hoveredRestaurant.latitude!, hoveredRestaurant.longitude!
                        );
                        const { walk, drive } = calculateTravelTimes(distanceKm);
                        return (
                          <>
                            <p>{distanceKm.toFixed(1)} km away</p>
                            <p>Walk: {walk} • Drive: {drive}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
                
      {/* Compact Search Bar - Minimal */}
      <div className="w-full max-w-3xl mb-6 z-10">
        <motion.div
          className="glass-layer-1 rounded-full h-14 px-4 shadow-strong relative flex items-center gap-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
          }}
          transition={{ 
            delay: 0.15,
            duration: 0.8,
            ease: "easeOut"
          }}
        >
          {/* Animated specular highlight */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-full overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3 relative z-10">
            <div className="flex-1 relative">
              <MentionInput
                value={prompt}
                onChange={setPrompt}
                onMentionsChange={(newMentions) => setMentions(newMentions)}
                placeholder={isThinking ? "AI is thinking..." : isRecording ? "Listening..." : "Where should we eat? (Type @ to mention friends)"}
                disabled={isThinking}
                className="bg-transparent border-0 shadow-none text-sm px-0 py-0 h-auto focus:ring-0"
              />
              {/* Streaming transcription indicator */}
              {isRecording && prompt && (
                <motion.div
                  className="absolute -right-2 top-1/2 -translate-y-1/2 flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-1 h-1 rounded-full bg-purple-500"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-1 h-1 rounded-full bg-purple-500"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-1 h-1 rounded-full bg-purple-500"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </motion.div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                disabled={isThinking}
                className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.6))',
                  backdropFilter: 'blur(12px)',
                  border: '0.5px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.05)',
                }}
                whileHover={!isThinking ? { 
                  scale: 1.1,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 12px rgba(0, 0, 0, 0.08)',
                } : {}}
                whileTap={!isThinking ? { scale: 0.95 } : {}}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                <MessageSquare className="w-4 h-4 text-[hsl(var(--foreground))]" />
              </motion.button>
              
              <motion.button
                type="button"
                onClick={toggleRecording}
                disabled={isThinking || isTranscribing}
                className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isRecording 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.7), rgba(220, 38, 38, 0.6))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.6))',
                  backdropFilter: 'blur(12px)',
                  border: '0.5px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.05)',
                }}
                whileHover={!isThinking ? { scale: 1.1 } : {}}
                whileTap={!isThinking ? { scale: 0.95 } : {}}
                animate={isRecording ? {
                  boxShadow: [
                    'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(239, 68, 68, 0.3)',
                    'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 16px rgba(239, 68, 68, 0.6)',
                  ]
                } : {}}
                transition={isRecording ? { duration: 1.5, repeat: Infinity } : {}}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                {isRecording ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <Mic className="w-4 h-4 text-white" />
                  </motion.div>
                ) : (
                  <Mic className="w-4 h-4 text-[hsl(var(--foreground))]" />
                )}
              </motion.button>
              
              <motion.button
                type="submit"
                disabled={isThinking}
                className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
                whileHover={!isThinking ? { 
                  scale: 1.1,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 8px 20px rgba(0, 0, 0, 0.2)',
                } : {}}
                whileTap={!isThinking ? { scale: 0.95 } : {}}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                <Send className="w-4 h-4 text-white" />
              </motion.button>
              
              {/* View on Map Button - shown when results are available */}
              <AnimatePresence>
                {showingResults && searchResults.length > 0 && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      // Navigate to spatial page with restaurant data
                      const restaurantData = searchResults.map(r => ({
                        place_id: r.place_id,
                        name: r.name,
                        address: r.address,
                        latitude: r.latitude,
                        longitude: r.longitude,
                        rating: r.rating,
                        match_score: r.match_score
                      }));
                      
                      // Store data in sessionStorage with route flag
                      sessionStorage.setItem('selectedRestaurants', JSON.stringify(restaurantData));
                      sessionStorage.setItem('showAsRoute', 'true'); // Flag to show as route
                      if (userCoords) {
                        sessionStorage.setItem('userLocation', JSON.stringify(userCoords));
                      }
                      
                      // Navigate to spatial page
                      window.location.href = '/spatial?view=route';
                    }}
                    initial={{ opacity: 0, scale: 0.8, width: 36 }}
                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                    exit={{ opacity: 0, scale: 0.8, width: 36 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="h-9 rounded-xl bg-purple-600 flex items-center justify-center gap-2 px-4 relative overflow-hidden ml-2"
                    style={{
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 8px 20px rgba(0, 0, 0, 0.2)',
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                    <MapPin className="w-4 h-4 text-white" />
                    <span className="text-sm font-semibold text-white">Plan Route</span>
                  </motion.button>
                )}
              </AnimatePresence>
              </div>
          </form>
        </motion.div>
      </div>


      {/* Error Message */}
      <AnimatePresence>
        {searchError && (
          <motion.div
            className="w-full max-w-4xl mb-8 z-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="glass-layer-1 rounded-2xl p-4 border-2 border-red-300 bg-red-50/50">
              <p className="text-red-700 font-medium">{searchError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Restaurant Details Modal - Minimalist */}
      <AnimatePresence>
        {selectedRestaurant && (
          <motion.div
            className="absolute inset-0 bg-black/10 backdrop-blur-md flex items-center justify-center z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRestaurant(null)}
          >
            <motion.div
              className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-strong"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="relative">
                  <img
                  src={selectedRestaurant.photo_url || getFallbackImage(selectedRestaurant.cuisine, selectedRestaurant.name)}
                    alt={selectedRestaurant.name}
                    className="w-full h-56 object-cover rounded-2xl mb-5 shadow-lg"
                  />
                <h2 className="text-2xl font-bold mb-3 text-gray-900">
                  {selectedRestaurant.name}
                </h2>
                <div className="flex items-center gap-3 mb-5">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
                    {selectedRestaurant.cuisine}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{selectedRestaurant.rating}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {'$'.repeat(selectedRestaurant.price_level)}
                  </span>
                </div>
                
                {/* Reasoning */}
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  {selectedRestaurant.reasoning}
                </p>
                
                {/* Address */}
                <div className="flex items-start gap-2 mb-3 text-sm text-[hsl(var(--muted-foreground))]">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{selectedRestaurant.address}</span>
                </div>
                
                {/* Distance & Travel Time */}
                {userCoords && selectedRestaurant.latitude && selectedRestaurant.longitude && (
                  <div className="mb-5 p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Distance & Travel</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {(() => {
                        const distanceKm = calculateDistance(
                          userCoords.lat, userCoords.lng,
                          selectedRestaurant.latitude!, selectedRestaurant.longitude!
                        );
                        const { walk, drive } = calculateTravelTimes(distanceKm);
                        return (
                          <>
                            <div>
                              <div className="text-gray-500">Distance</div>
                              <div className="font-semibold text-gray-900">{distanceKm.toFixed(1)} km</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Walk</div>
                              <div className="font-semibold text-gray-900">{walk}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Drive</div>
                              <div className="font-semibold text-gray-900">{drive}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Match Score */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold">Match Score</span>
                    <span className="text-purple-600 font-bold">{Math.round(selectedRestaurant.match_score * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedRestaurant.match_score * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button 
                    className="flex-1 bg-purple-600 text-white rounded-2xl h-12 text-base font-semibold shadow-lg flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Navigate to reservations page with restaurant details and auto-open modal
                      const params = new URLSearchParams({
                        restaurant_name: selectedRestaurant.name,
                        restaurant_address: selectedRestaurant.address || '',
                        place_id: selectedRestaurant.place_id || '',
                        autoOpen: 'true'  // Signal to auto-open the reservation modal
                      });
                      window.location.href = `/reservations?${params.toString()}`;
                    }}
                  >
                    <Users className="w-4 h-4" />
                    Reserve Table
                  </motion.button>
                  
                  <motion.button 
                    className="flex-1 bg-gray-100 text-gray-900 rounded-2xl h-12 text-base font-semibold shadow-md flex items-center justify-center gap-2 border border-gray-200"
                    whileHover={{ scale: 1.02, backgroundColor: '#f3f4f6' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Navigate to discover page with maps tab (assuming tabs exist)
                      // Or use Google Maps as fallback
                      if (selectedRestaurant.latitude && selectedRestaurant.longitude) {
                        // Open in Google Maps
                        window.open(`https://www.google.com/maps/search/?api=1&query=${selectedRestaurant.latitude},${selectedRestaurant.longitude}`, '_blank');
                      } else {
                        // Fallback to address search
                        const query = encodeURIComponent(selectedRestaurant.name + ' ' + selectedRestaurant.address);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                      }
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                    View in Maps
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
