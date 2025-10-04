'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  UserPlus, 
  UserMinus, 
  Users, 
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  friends: string[];
  created_at: string;
};

export default function FriendsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'discover'>('friends');
  const supabase = createClient();

  // Load current user and their friends
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentUser(profile);
        await loadFriends(profile.friends || []);
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

  const searchUsers = async (query: string) => {
    if (!query.trim() || !currentUser) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .neq('id', currentUser.id)
        .limit(20);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
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
        setSearchResults(prev => prev.filter(p => p.id !== friendId));
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
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const isFriend = (userId: string) => {
    return currentUser?.friends?.includes(userId) || false;
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div 
          className="text-sm text-slate-400 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto h-full flex flex-col px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-slate-800 mb-1 tracking-tight">
            Friends
          </h1>
          <p className="text-slate-500 text-sm">Connect and discover</p>
        </div>

        {/* Tab Switcher - Apple Style */}
        <div className="mb-6">
          <div className="inline-flex p-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'friends'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Friends {friends.length > 0 && `(${friends.length})`}
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'discover'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Discover
            </button>
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
                    <p className="text-sm font-medium mb-1">No friends yet</p>
                    <p className="text-xs text-slate-400">Start by discovering people</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                    {friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all cursor-pointer"
                        onClick={() => setSelectedProfile(friend)}
                      >
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

                        {/* Action */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFriend(friend.id);
                          }}
                          className="w-full text-xs text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl"
                        >
                          <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                          Unfollow
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
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
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 h-12 rounded-2xl bg-white/60 backdrop-blur-xl border-slate-200/60 text-slate-900 placeholder:text-slate-400 focus:border-slate-200/60 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-slate-200/60 shadow-sm focus:shadow-sm transition-none"
                    />
                  </div>
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-auto pb-6">
                  {searchLoading ? (
                    <div className="flex justify-center py-12">
                      <motion.div 
                        className="text-sm text-slate-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Searching...
                      </motion.div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3">
                      {searchResults.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div
                              className="cursor-pointer flex-shrink-0"
                              onClick={() => setSelectedProfile(user)}
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
                              onClick={() => setSelectedProfile(user)}
                            >
                              <h3 className="font-semibold text-slate-800 text-sm truncate">
                                {user.display_name || user.username}
                              </h3>
                              <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                            </div>

                            {/* Add Friend Button */}
                            {isFriend(user.id) ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFriend(user.id)}
                                className="rounded-xl text-xs text-slate-600 hover:text-red-600 hover:bg-red-50/50 flex-shrink-0"
                              >
                                <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                                Unfollow
                              </Button>
                            ) : (
                              <Button
                                onClick={() => addFriend(user.id)}
                                size="sm"
                                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs flex-shrink-0"
                              >
                                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                Follow
                              </Button>
                            )}
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
                      <p className="text-xs text-slate-400 mt-1">Try a different search</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Search className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">Search for friends</p>
                      <p className="text-xs text-slate-400 mt-1">Enter a username to start</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Modal */}
        <AnimatePresence>
          {selectedProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedProfile(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white/80 backdrop-blur-2xl rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/60 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="w-8 h-8 rounded-full bg-slate-100/80 backdrop-blur-sm hover:bg-slate-200/80 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </div>

                {/* Profile Content */}
                <div className="p-8">
                  {/* Avatar */}
                  <div className="flex flex-col items-center mb-6">
                    {selectedProfile.avatar_url ? (
                      <img
                        src={selectedProfile.avatar_url}
                        alt={selectedProfile.username}
                        className="w-28 h-28 rounded-full object-cover mb-4 ring-8 ring-slate-100"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-4 ring-8 ring-slate-100">
                        <span className="text-4xl font-semibold text-slate-600">
                          {selectedProfile.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}

                    <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                      {selectedProfile.display_name || selectedProfile.username}
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">@{selectedProfile.username}</p>
                    
                    {selectedProfile.bio && (
                      <p className="text-sm text-slate-600 text-center mb-6 px-4">
                        {selectedProfile.bio}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 px-4 py-2 bg-slate-100/60 rounded-xl">
                      <Users className="w-3.5 h-3.5" />
                      <span>{selectedProfile.friends?.length || 0} friends</span>
                    </div>

                    {/* Action Button */}
                    {isFriend(selectedProfile.id) ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          removeFriend(selectedProfile.id);
                          setSelectedProfile(null);
                        }}
                        className="w-full rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50/50"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          addFriend(selectedProfile.id);
                          setSelectedProfile(null);
                        }}
                        className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
