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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
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

  const parsePreferences = (preferencesString: string) => {
    try {
      return JSON.parse(preferencesString);
    } catch {
      return {};
    }
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

  const preferences = parsePreferences(profile.preferences || '{}');

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
          <div className="flex gap-2">
            <button className="glass-btn-sm" title="Share Profile">
              <Share2 className="w-4 h-4 text-slate-600" />
            </button>
            <button className="glass-btn-sm" title="Settings">
              <Settings className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-x-16 gap-y-6 pb-12 border-b border-slate-200/60">
          <div>
            <div className="text-sm font-medium text-slate-500 mb-4">Activity</div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Visits', value: visits.length, icon: MapPin },
                { label: 'Restaurants', value: new Set(visits.map(v => v.restaurant_name)).size, icon: Utensils },
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
          <div>
            <div className="text-sm font-medium text-slate-500 mb-4">Social</div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Following', value: profile.friends?.length || 0, icon: Users },
                { label: 'Photos', value: photos.length, icon: Heart },
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
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 gap-x-16 gap-y-12">
          {/* Recent Visits */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-slate-500">Recent Visits</h2>
              <button className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
                View all →
              </button>
            </div>
            <div className="space-y-3">
                {visits.length > 0 ? (
                  visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center gap-3 py-2 hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      <img
                        src={visit.restaurant_image || '/default-restaurant.png'}
                        alt={visit.restaurant_name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{visit.restaurant_name}</div>
                        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                          <Clock className="w-3 h-3" />
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold">{visit.rating}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No visits yet</p>
                  </div>
                )}
              </div>
            </div>

          {/* Preferences */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-slate-500">Preferences</h2>
            </div>
            
            <div className="space-y-4">
                {preferences.cuisines && preferences.cuisines.length > 0 && (
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                      Favorite Cuisines
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.cuisines.map((cuisine: string) => (
                        <span
                          key={cuisine}
                          className="glass-btn-inline text-xs px-3 py-1"
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
                    <div className="text-sm font-semibold">{preferences.priceRange}</div>
                  </div>
                )}

                {preferences.atmosphere && preferences.atmosphere.length > 0 && (
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                      Atmosphere
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.atmosphere.map((vibe: string) => (
                        <span
                          key={vibe}
                          className="glass-btn-inline text-xs px-3 py-1"
                        >
                          {vibe}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {(!preferences.cuisines && !preferences.priceRange && !preferences.atmosphere) && (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                  <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No preferences set</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Photos */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-slate-500">Photos</h2>
            <button className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
              View all →
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {photos.length > 0 ? (
              photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative rounded-lg overflow-hidden aspect-square cursor-pointer group"
                >
                  <img
                    src={photo.url}
                    alt={`Photo ${photo.id}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-8 text-[hsl(var(--muted-foreground))]">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No photos yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
