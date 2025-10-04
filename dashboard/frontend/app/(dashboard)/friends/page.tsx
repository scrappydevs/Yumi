'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  UserPlus, 
  UserMinus, 
  Users, 
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  friends: string[];
  created_at: string;
};

type FollowingStats = {
  followers_count: number;
  following_count: number;
};

export default function FriendsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'followers' | 'discover'>('friends');
  const supabase = createClient();
  const { user } = useAuth();
  const router = useRouter();

  // Load current user and their friends
  useEffect(() => {
    if (user) {
      loadCurrentUser();
      loadAllUsers();
    }
  }, [user]);

  const loadCurrentUser = async () => {
    try {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentUser(profile);
        await Promise.all([
          loadFriends(profile.friends || []),
          loadFollowers(user.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async (friendIds: string[]) => {
    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      setFriends(data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFollowers = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .contains('friends', [userId]);

      setFollowers(data || []);
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  };

  const loadAllUsers = async () => {
    if (!user) return;
    
    setUsersLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('created_at', { ascending: false });

      setAllUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error loading all users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const filterUsers = (query: string) => {
    if (!query.trim()) {
      setFilteredUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(query.toLowerCase()))
    );
    
    setFilteredUsers(filtered);
  };

  const addFriend = async (friendId: string) => {
    if (!currentUser) return;

    try {
      const updatedFriends = [...(currentUser.friends || []), friendId];
      
      const { error } = await supabase
        .from('profiles')
        .update({ friends: updatedFriends, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      if (!error) {
        setCurrentUser({ ...currentUser, friends: updatedFriends });
        await loadFriends(updatedFriends);
        // Refresh filtered users to update follow status
        filterUsers(searchQuery);
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUser) return;

    try {
      const updatedFriends = (currentUser.friends || []).filter(id => id !== friendId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ friends: updatedFriends, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      if (!error) {
        setCurrentUser({ ...currentUser, friends: updatedFriends });
        await loadFriends(updatedFriends);
        // Refresh filtered users to update follow status
        filterUsers(searchQuery);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const isFriend = (userId: string) => {
    return currentUser?.friends?.includes(userId) || false;
  };

  const navigateToProfile = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterUsers(searchQuery);
    }, 100); // Debounced search with 100ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery, allUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <motion.div 
          className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40">
      <div className="max-w-5xl mx-auto h-full flex flex-col px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-[hsl(var(--foreground))] mb-1 tracking-tight">
            Friends
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">Connect and discover</p>
        </div>

        {/* Tab Switcher - Liquid Glass Style */}
        <div className="mb-6">
          <div className="inline-flex p-1.5 glass-layer-1 rounded-2xl shadow-soft relative overflow-hidden">
            {/* Specular highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-2xl" />
            
            <motion.button
              onClick={() => setActiveTab('friends')}
              className={`relative px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'friends'
                  ? 'bg-white text-[hsl(var(--foreground))] shadow-md'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Following {friends.length > 0 && `(${friends.length})`}
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('followers')}
              className={`relative px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'followers'
                  ? 'bg-white text-[hsl(var(--foreground))] shadow-md'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Followers {followers.length > 0 && `(${followers.length})`}
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('discover')}
              className={`relative px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'discover'
                  ? 'bg-white text-[hsl(var(--foreground))] shadow-md'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Discover
            </motion.button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'friends' ? (
              <motion.div
                key="friends"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-auto"
              >
                {friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Users className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium mb-1">No following yet</p>
                    <p className="text-xs text-slate-400">Start by discovering people</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                    {friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group glass-layer-1 rounded-3xl p-6 shadow-soft hover:shadow-medium transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => navigateToProfile(friend.id)}
                        whileHover={{ scale: 1.02, boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Specular highlight */}
                        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-3xl" />
                        {/* Avatar */}
                        <div className="flex flex-col items-center mb-4">
                          {friend.avatar_url ? (
                            <img
                              src={friend.avatar_url}
                              alt={friend.username}
                              className="w-20 h-20 rounded-full object-cover mb-3 ring-4 ring-slate-100"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-3 ring-4 ring-slate-100">
                              <span className="text-2xl font-semibold text-slate-600">
                                {friend.username[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <h3 className="font-semibold text-slate-800 text-center text-base">
                            {friend.display_name || friend.username}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">@{friend.username}</p>
                        </div>

                        {/* Bio */}
                        {friend.bio && (
                          <p className="text-xs text-slate-600 text-center line-clamp-2 mb-4 px-2">
                            {friend.bio}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToProfile(friend.id);
                            }}
                            className="flex-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 rounded-xl"
                          >
                            <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                            View Profile
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFriend(friend.id);
                            }}
                            className="text-xs text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl px-3"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'followers' ? (
              <motion.div
                key="followers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-auto"
              >
                {followers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Users className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium mb-1">No followers yet</p>
                    <p className="text-xs text-slate-400">Share your profile to get followers</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                    {followers.map((follower) => (
                      <motion.div
                        key={follower.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group glass-layer-1 rounded-3xl p-6 shadow-soft hover:shadow-medium transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => navigateToProfile(follower.id)}
                        whileHover={{ scale: 1.02, boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Specular highlight */}
                        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-3xl" />
                        {/* Avatar */}
                        <div className="flex flex-col items-center mb-4">
                          {follower.avatar_url ? (
                            <img
                              src={follower.avatar_url}
                              alt={follower.username}
                              className="w-20 h-20 rounded-full object-cover mb-3 ring-4 ring-slate-100"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-3 ring-4 ring-slate-100">
                              <span className="text-2xl font-semibold text-slate-600">
                                {follower.username[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <h3 className="font-semibold text-slate-800 text-center text-base">
                            {follower.display_name || follower.username}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">@{follower.username}</p>
                        </div>

                        {/* Bio */}
                        {follower.bio && (
                          <p className="text-xs text-slate-600 text-center line-clamp-2 mb-4 px-2">
                            {follower.bio}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToProfile(follower.id);
                            }}
                            className="flex-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 rounded-xl"
                          >
                            <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                            View Profile
                          </Button>
                          {!isFriend(follower.id) && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                addFriend(follower.id);
                              }}
                              size="sm"
                              className="text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-3"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'discover' ? (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative glass-layer-1 rounded-2xl shadow-soft overflow-hidden">
                    {/* Specular highlight */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-2xl" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10" />
                    <Input
                      type="text"
                      placeholder="Search by username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 h-12 rounded-2xl bg-transparent border-0 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none relative z-10"
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-auto pb-6">
                  {usersLoading ? (
                    <div className="flex justify-center py-12">
                      <motion.div 
                        className="text-sm text-slate-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Loading users...
                      </motion.div>
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    <div className="space-y-3">
                      {filteredUsers.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-layer-1 rounded-2xl p-4 shadow-soft hover:shadow-medium transition-all relative overflow-hidden"
                          whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {/* Specular highlight */}
                          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-2xl" />
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div
                              className="cursor-pointer flex-shrink-0"
                              onClick={() => navigateToProfile(user.id)}
                            >
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.username}
                                  className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center ring-2 ring-slate-100">
                                  <span className="text-lg font-semibold text-slate-600">
                                    {user.username[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => navigateToProfile(user.id)}
                            >
                              <h3 className="font-semibold text-slate-800 text-sm truncate">
                                {user.display_name || user.username}
                              </h3>
                              <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateToProfile(user.id)}
                                className="rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50/50 px-3"
                              >
                                <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                                View
                              </Button>
                              {isFriend(user.id) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFriend(user.id)}
                                  className="rounded-xl text-xs text-red-600 hover:text-red-700 hover:bg-red-50/50 px-3"
                                >
                                  <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => addFriend(user.id)}
                                  size="sm"
                                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs px-3"
                                >
                                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Search className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Users className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">No users available</p>
                      <p className="text-xs text-slate-400 mt-1">Check back later for new users</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
