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
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const parsePreferences = (prefString: string) => {
    try {
      return JSON.parse(prefString);
    } catch {
      return {};
    }
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

  const preferences = parsePreferences(profile.preferences || '{}');

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
            <div className="space-y-0">
              {visits.length > 0 ? (
                visits.slice(0, 5).map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ring-1 ring-slate-100">
                        <Utensils className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{visit.restaurant_name}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{visit.rating}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No visits yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <div className="text-sm font-medium text-slate-500 mb-6">Preferences</div>
            <div className="space-y-6">
              {preferences.cuisines && preferences.cuisines.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                    Favorite Cuisines
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preferences.cuisines.map((cuisine: string) => (
                      <span
                        key={cuisine}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-700 rounded-lg ring-1 ring-slate-100"
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {preferences.priceRange && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                    Price Range
                  </div>
                  <div className="text-sm font-medium">{preferences.priceRange}</div>
                </div>
              )}

              {preferences.atmosphere && preferences.atmosphere.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                    Atmosphere
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preferences.atmosphere.map((vibe: string) => (
                      <span
                        key={vibe}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-700 rounded-lg ring-1 ring-slate-100"
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!preferences.cuisines && !preferences.priceRange && !preferences.atmosphere) && (
                <div className="text-center py-12 text-slate-400">
                  <Settings className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No preferences set</p>
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-slate-500">Photos</h2>
              <button className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
                View all →
              </button>
            </div>
            {photos.length > 0 ? (
              <div className="grid grid-cols-6 gap-3">
                {photos.slice(0, 12).map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-xl overflow-hidden ring-1 ring-slate-100 hover:ring-slate-200 transition-all cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt="Food photo"
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No photos yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

