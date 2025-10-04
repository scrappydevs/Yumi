'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
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
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { SendReservationCard } from '@/components/send-reservation-card';

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
  const [showMessageCard, setShowMessageCard] = useState(false);
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
        updatedFriends = currentFriends.filter((id: string) => id !== userId);
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
      <div className="h-full bg-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="glass-layer-1 rounded-3xl p-8 text-center max-w-md shadow-strong">
          <h2 className="text-xl font-bold mb-2">Profile not found</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            This user profile doesn't exist or has been removed.
          </p>
          <motion.button 
            onClick={() => router.back()}
            className="glass-layer-1 px-6 py-3 rounded-2xl font-semibold shadow-soft hover:shadow-medium transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Go Back
          </motion.button>
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
            alt={profile.display_name || profile.username}
            className="w-24 h-24 rounded-2xl object-cover ring-1 ring-slate-200/60"
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.display_name || profile.username}
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
            <motion.button 
              onClick={() => router.back()}
              className="glass-layer-1 w-9 h-9 rounded-xl flex items-center justify-center shadow-soft relative overflow-hidden"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Go Back"
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
              <ArrowLeft className="w-4 h-4 text-[hsl(var(--foreground))]" />
            </motion.button>
            {currentUser && currentUser.id !== userId && (
              <motion.button
                onClick={() => setShowMessageCard(true)}
                className="glass-layer-1 w-9 h-9 rounded-xl flex items-center justify-center shadow-soft relative overflow-hidden"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Send Reservation"
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                <MessageCircle className="w-4 h-4 text-[hsl(var(--foreground))]" />
              </motion.button>
            )}
            <motion.button
              className="glass-layer-1 w-9 h-9 rounded-xl flex items-center justify-center shadow-soft relative overflow-hidden"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Share Profile"
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
              <Share2 className="w-4 h-4 text-[hsl(var(--foreground))]" />
            </motion.button>
            {currentUser && currentUser.id !== userId && (
              <motion.button
                onClick={toggleFollow}
                className={`glass-layer-1 w-9 h-9 rounded-xl flex items-center justify-center shadow-soft relative overflow-hidden ${
                  isFollowing ? 'text-red-600' : 'text-[hsl(var(--foreground))]'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={isFollowing ? 'Unfollow' : 'Follow'}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                {isFollowing ? (
                  <UserMinus className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </motion.button>
            )}
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
                        className="glass-layer-1 text-xs px-3 py-1 rounded-xl shadow-soft"
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
                        className="glass-layer-1 text-xs px-3 py-1 rounded-xl shadow-soft"
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

          {/* Photos */}
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

      {/* Message Modal */}
      <AnimatePresence>
        {showMessageCard && profile && currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowMessageCard(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <SendReservationCard
                friendId={profile.id}
                friendName={profile.display_name || profile.username}
                friendPhone="+17149410453"
              />
              
              {/* Close button */}
              <motion.button
                onClick={() => setShowMessageCard(false)}
                className="mt-4 w-full glass-layer-1 rounded-2xl h-12 text-sm font-semibold shadow-soft relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
                <span className="relative z-10">Close</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
