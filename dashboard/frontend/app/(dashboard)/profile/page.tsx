'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin,
  Star,
  Calendar,
  Utensils,
  Heart,
  Users,
  Share2,
  Settings,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';

// Types for the database
interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  friends: string[];
  preferences: string;
  created_at: string;
  updated_at: string;
}

interface Visit {
  id: string;
  restaurant_name: string;
  visit_date: string;
  rating: number;
  restaurant_image?: string;
}

interface Photo {
  id: string;
  url: string;
  restaurant_id?: string;
  created_at: string;
}

interface Review {
  id: string;
  image_id?: number;
  description: string;
  uid: string;
  overall_rating: number;
  restaurant_name: string;
  restaurant_id: string;
  rating: number;
  created_at: string;
  images?: {
    image_url: string;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      loadProfileData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadProfileData = async () => {
    try {
      console.log('🔍 Starting profile data load...');
      
      if (!user) {
        console.error('❌ No user found - not authenticated');
        return;
      }
      
      console.log('✅ Current user found:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
      console.log('📋 User metadata:', user.user_metadata);
      console.log('🔑 User app metadata:', user.app_metadata);

      // Get profile data
      console.log('🔍 Fetching profile from database...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error loading profile:', profileError);
        console.error('📊 Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        // If profile doesn't exist, create one with Google Auth data
        if (profileError.code === 'PGRST116') {
          console.log('🆕 Profile not found, creating new profile...');
          await createProfileFromAuth(user);
          return;
        }
        return;
      }

      console.log('✅ Profile loaded successfully:', profileData);
      console.log('📊 Profile preferences field:', profileData.preferences);
      console.log('📊 Profile preferences type:', typeof profileData.preferences);
      setProfile(profileData);

      // Load visits (you'll need to create this table)
      console.log('🔍 Loading visits...');
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', user.id)
        .order('visit_date', { ascending: false })
        .limit(4);

      if (visitsError) {
        console.warn('⚠️ Error loading visits:', visitsError);
      } else {
        console.log('✅ Visits loaded:', visitsData);
        setVisits(visitsData || []);
      }

      // Load photos (you'll need to create this table)
      console.log('🔍 Loading photos...');
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (photosError) {
        console.warn('⚠️ Error loading photos:', photosError);
      } else {
        console.log('✅ Photos loaded:', photosData);
        setPhotos(photosData || []);
      }

      // Load reviews with images
      console.log('🔍 Loading reviews...');
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          images:image_id (
            image_url
          )
        `)
        .eq('uid', user.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.warn('⚠️ Error loading reviews:', reviewsError);
      } else {
        console.log('✅ Reviews loaded:', reviewsData);
        setReviews(reviewsData || []);
      }

    } catch (error) {
      console.error('💥 Error loading profile data:', error);
    } finally {
      console.log('🏁 Profile data loading completed');
      setLoading(false);
    }
  };

  const createProfileFromAuth = async (user: any) => {
    try {
      // Extract display name and avatar from Google Auth metadata
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
      const username = user.user_metadata?.preferred_username || user.email?.split('@')[0] || 'user';

      console.log('Creating profile with data:', {
        id: user.id,
        username,
        display_name: displayName,
        avatar_url: avatarUrl
      });

      // Create profile with Google Auth data
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username,
          display_name: displayName,
          avatar_url: avatarUrl,
          bio: '',
          friends: [],
          preferences: JSON.stringify({
            cuisines: [],
            priceRange: '',
            atmosphere: []
          })
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        console.error('Full error details:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        });
        return;
      }

      console.log('Profile created successfully:', newProfile);
      setProfile(newProfile);

    } catch (error) {
      console.error('Error in createProfileFromAuth:', error);
    }
  };

  const parsePreferences = (preferencesData: any) => {
    // If it's already an object, return it
    if (typeof preferencesData === 'object' && preferencesData !== null) {
      console.log('✅ Preferences is already an object:', preferencesData);
      return { parsed: true, data: preferencesData };
    }
    
    // If it's a string, try to parse it
    if (typeof preferencesData === 'string' && preferencesData) {
      try {
        // Check if it looks like JSON (starts with { or [)
        const trimmed = preferencesData.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const parsed = JSON.parse(trimmed);
          console.log('✅ Parsed preferences from JSON string:', parsed);
          return { parsed: true, data: parsed };
        } else {
          console.log('📝 Preferences is raw text, displaying as-is');
          return { parsed: false, rawText: trimmed };
        }
      } catch (error) {
        console.error('❌ Error parsing preferences JSON:', error);
        return { parsed: false, rawText: preferencesData };
      }
    }
    
    console.warn('⚠️ Preferences is empty');
    return { parsed: true, data: {} };
  };

  if (loading) {
    return (
      <div className="h-full liquid-glass flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full liquid-glass flex items-center justify-center">
        <div className="glass-panel p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Profile not found</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            Unable to load profile data. This might be your first time using the app.
          </p>
          <button 
            onClick={loadProfileData}
            className="glass-btn-inline"
          >
            Try Again
          </button>
          <div className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
            <p>If this persists, please check:</p>
            <ul className="list-disc list-inside text-left mt-2 space-y-1">
              <li>You're logged in with Google</li>
              <li>The profiles table exists</li>
              <li>You have the correct permissions</li>
            </ul>
            <div className="mt-4 p-3 bg-slate-100 rounded text-left">
              <p className="font-semibold">Debug Info:</p>
              <p>Check browser console for detailed error messages</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const preferencesResult = parsePreferences(profile.preferences || '{}');
  console.log('🎯 Final parsed preferences:', preferencesResult);
  const preferences = preferencesResult.parsed ? preferencesResult.data : {};

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto p-8 space-y-12">
        {/* Profile Header */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-8 items-start pb-12 border-b border-slate-200/60">
          <img
            src={profile.avatar_url || '/default-avatar.png'}
            alt={profile.display_name}
            className="w-24 h-24 rounded-2xl object-cover ring-1 ring-slate-200/60"
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.display_name}
            </h1>
            <p className="text-base text-slate-500">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="text-sm text-slate-600 leading-relaxed pt-2 max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="pb-12 border-b border-slate-200/60">
          <div className="text-sm font-medium text-slate-500 mb-4">Social</div>
          <div className="grid grid-cols-2 gap-6 max-w-md">
            {[
              { label: 'Followers', value: 0, icon: Users },
              { label: 'Following', value: profile.friends?.length || 0, icon: Users },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <stat.icon className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="text-3xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences Section - Full Width */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-slate-500">Taste Preferences</h2>
          </div>
          
          <div className="space-y-6">
            {/* Raw Text Display */}
            {!preferencesResult.parsed && preferencesResult.rawText && (
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {preferencesResult.rawText}
                </p>
              </div>
            )}

            {/* Structured Preferences Display */}
            {preferencesResult.parsed && (
              <>
                {preferences.cuisines && preferences.cuisines.length > 0 && (
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                      Favorite Cuisines
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.cuisines.map((cuisine: string) => (
                        <span
                          key={cuisine}
                          className="glass-layer-1 text-sm px-4 py-2 rounded-xl shadow-soft font-medium"
                        >
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.priceRange && (
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                      Price Range
                    </div>
                    <div className="text-lg font-semibold">{preferences.priceRange}</div>
                  </div>
                )}

                {preferences.atmosphere && preferences.atmosphere.length > 0 && (
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                      Preferred Atmosphere
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.atmosphere.map((vibe: string) => (
                        <span
                          key={vibe}
                          className="glass-layer-1 text-sm px-4 py-2 rounded-xl shadow-soft font-medium"
                        >
                          {vibe}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(!preferences.cuisines && !preferences.priceRange && !preferences.atmosphere) && (
                  <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                    <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No preferences set yet</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                      Preferences are learned from your dining history
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Your Reviews Section */}
        <div className="border-t border-slate-200/60 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-slate-500">Your Reviews</h2>
            <span className="text-xs text-slate-400">{reviews.length} reviews</span>
          </div>
          
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="glass-layer-1 rounded-2xl p-6 shadow-soft hover:shadow-md transition-all"
                >
                  <div className="flex gap-6">
                    {/* Image */}
                    {review.images?.image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={review.images.image_url}
                          alt={review.restaurant_name}
                          className="w-32 h-32 rounded-xl object-cover"
                        />
                      </div>
                    )}

                    {/* Restaurant Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 mb-1">
                            {review.restaurant_name}
                          </h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.overall_rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-slate-300 text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">
                              {review.overall_rating}/5
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Review Description */}
                      {review.description && (
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {review.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No reviews yet</p>
              <p className="text-xs mt-2">Share your dining experiences to help others discover great restaurants</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
