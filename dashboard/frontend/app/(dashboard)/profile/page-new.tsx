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
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Create profile if it doesn't exist
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || '',
            bio: '',
            friends: [],
            preferences: '{}',
          }])
          .select()
          .single();

        if (newProfile) {
          setProfile(newProfile);
        }
      } else if (profileData) {
        setProfile(profileData);
      }

      // Load visits and photos (mock data for now)
      setVisits([]);
      setPhotos([]);
      
      // Load reviews with images
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          images:image_id (
            image_url
          )
        `)
        .eq('uid', user.id)
        .order('created_at', { ascending: false });
      
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Unable to load profile</p>
      </div>
    );
  }

  const preferencesResult = parsePreferences(profile.preferences || '{}');
  const preferences = preferencesResult.parsed ? preferencesResult.data : {};

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto p-12 space-y-12">
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

