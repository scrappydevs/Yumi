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
import { ReservationModal } from '@/components/reservation-modal';

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
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
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
      console.log('📊 Profile preferences field:', profileData.preferences);
      console.log('📊 Profile preferences type:', typeof profileData.preferences);
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
      const { data: photosData, error: photosError} = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false})
        .limit(8);

      if (photosError) {
        console.warn('⚠️ Error loading photos:', photosError);
      } else {
        setPhotos(photosData || []);
      }

      // Load followers count (how many people follow THIS user)
      const { data: followersData, error: followersError } = await supabase
        .from('profiles')
        .select('id')
        .contains('friends', [userId]);

      if (!followersError) {
        setFollowersCount(followersData?.length || 0);
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
        
        // Update followers count
        if (isFollowing) {
          setFollowersCount(prev => Math.max(0, prev - 1));
        } else {
          setFollowersCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
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
                onClick={() => setShowReservationModal(true)}
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
            <div className="text-sm font-medium text-slate-500 mb-4">Social</div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Followers', value: followersCount, icon: Users },
                { label: 'Following', value: profile.friends?.length || 0, icon: UserPlus },
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
            <div className="text-sm font-medium text-slate-500 mb-4">Photos</div>
            <div className="grid grid-cols-2 gap-6">
              {[
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
      </div>

      {/* Reservation Modal */}
      {profile && (
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          mode="create"
          showIntro={true}
          prefillInvitee={{
            id: profile.id,
            name: profile.display_name || profile.username,
            phone: "+17149410453" // TODO: Get from profile.phone when available
          }}
        />
      )}
    </div>
  );
}
