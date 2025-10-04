'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  UserPlus, 
  UserMinus, 
  Users, 
  MapPin,
  Star,
  Calendar,
  Utensils,
  Heart,
  Share2,
  Settings,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  friends: string[];
  preferences: string;
  created_at: string;
  updated_at: string;
};

type Visit = {
  id: string;
  restaurant_name: string;
  visit_date: string;
  rating: number;
  restaurant_image?: string;
};

type Photo = {
  id: string;
  url: string;
  restaurant_id?: string;
  created_at: string;
};

export default function UserProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const supabase = createClient();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      console.log('🔍 Loading user profile for:', userId);
      
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error loading profile:', profileError);
        return;
      }

      console.log('✅ Profile loaded:', profileData);
      setProfile(profileData);

      // Check if current user is following this user
      if (currentUser) {
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('friends')
          .eq('id', currentUser.id)
          .single();
        
        setIsFollowing(currentUserProfile?.friends?.includes(userId) || false);
      }

      // Load visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', userId)
        .order('visit_date', { ascending: false })
        .limit(4);

      if (visitsError) {
        console.warn('⚠️ Error loading visits:', visitsError);
      } else {
        setVisits(visitsData || []);
      }

      // Load photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8);

      if (photosError) {
        console.warn('⚠️ Error loading photos:', photosError);
      } else {
        setPhotos(photosData || []);
      }

    } catch (error) {
      console.error('💥 Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!currentUser || !profile) return;

    try {
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('friends')
        .eq('id', currentUser.id)
        .single();

      if (!currentUserProfile) return;

      const currentFriends = currentUserProfile.friends || [];
      let updatedFriends;

      if (isFollowing) {
        // Unfollow
        updatedFriends = currentFriends.filter(id => id !== userId);
      } else {
        // Follow
        updatedFriends = [...currentFriends, userId];
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          friends: updatedFriends, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', currentUser.id);

      if (!error) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
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
            This user profile doesn't exist or has been removed.
          </p>
          <Button 
            onClick={() => router.back()}
            className="glass-btn-inline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const preferences = parsePreferences(profile.preferences || '{}');

  return (
    <div className="h-full liquid-glass overflow-hidden relative">
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => router.back()}
          className="glass-btn-sm"
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Action Buttons - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <div className="glass-panel p-2 flex gap-2">
          <button className="glass-btn-sm" title="Share Profile">
            <Share2 className="w-4 h-4 text-slate-600" />
          </button>
          {currentUser && currentUser.id !== userId && (
            <button
              onClick={toggleFollow}
              className={`glass-btn-sm ${
                isFollowing 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-slate-600'
              }`}
              title={isFollowing ? 'Unfollow' : 'Follow'}
            >
              {isFollowing ? (
                <UserMinus className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Profile Header */}
          <div className="glass-panel p-8 text-center">
            <div className="glass-highlight" />
            <div className="flex flex-col items-center mb-6">
              <img
                src={profile.avatar_url || '/default-avatar.png'}
                alt={profile.display_name || profile.username}
                className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-slate-100"
              />
              <h1 className="text-3xl font-bold mb-2">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-lg text-[hsl(var(--muted-foreground))] mb-4">
                @{profile.username}
              </p>
              {profile.bio && (
                <p className="text-lg text-[hsl(var(--muted-foreground))] leading-relaxed max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Follow Button */}
            {currentUser && currentUser.id !== userId && (
              <button
                onClick={toggleFollow}
                className={`glass-btn-inline px-8 py-3 rounded-2xl font-semibold ${
                  isFollowing
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-5 h-5 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Visits', value: visits.length, icon: MapPin },
              { label: 'Restaurants', value: new Set(visits.map(v => v.restaurant_name)).size, icon: Utensils },
              { label: 'Following', value: profile.friends?.length || 0, icon: Users },
              { label: 'Photos', value: photos.length, icon: Heart },
            ].map((stat) => (
              <div key={stat.label} className="glass-panel p-6 text-center">
                <div className="glass-highlight" />
                <stat.icon className="w-6 h-6 mx-auto mb-3 text-[hsl(var(--primary))]" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Recent Visits */}
            <div className="glass-panel p-6">
              <div className="glass-highlight" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Recent Visits</h2>
                <button className="glass-btn-inline text-xs">
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
            <div className="glass-panel p-6">
              <div className="glass-highlight" />
              <h2 className="text-lg font-bold mb-4">Preferences</h2>
              
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

          {/* Photos */}
          <div className="glass-panel p-6">
            <div className="glass-highlight" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Photos</h2>
              <button className="glass-btn-inline text-xs">
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
    </div>
  );
}
