'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  UserPlus, 
  UserMinus, 
  Users, 
  X,
  MessageCircle,
  MapPin,
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
  const supabase = createClient();

  // Load current user and their friends
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user's profile
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
        // Remove from search results
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
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Friends
          </h1>
          <p className="text-gray-600">Connect with friends and discover new people</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="friends" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              My Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Discover
            </TabsTrigger>
          </TabsList>

          {/* My Friends Tab */}
          <TabsContent value="friends" className="flex-1 overflow-auto">
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Users className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">No friends yet</p>
                <p className="text-sm">Search for users to add friends</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedProfile(friend)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        {friend.avatar_url ? (
                          <img
                            src={friend.avatar_url}
                            alt={friend.username}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">
                            {friend.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {friend.display_name || friend.username}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">@{friend.username}</p>
                        {friend.bio && (
                          <p className="text-sm text-gray-600 line-clamp-2">{friend.bio}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFriend(friend.id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="flex-1 overflow-auto">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border-gray-200 focus:border-purple-400"
              />
            </div>

            {/* Search Results */}
            {searchLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">Searching...</div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div
                        className="cursor-pointer"
                        onClick={() => setSelectedProfile(user)}
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg font-bold">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedProfile(user)}
                      >
                        <h3 className="font-semibold text-base">
                          {user.display_name || user.username}
                        </h3>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>

                      {/* Add Friend Button */}
                      {isFriend(user.id) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFriend(user.id)}
                          className="rounded-full"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </Button>
                      ) : (
                        <Button
                          onClick={() => addFriend(user.id)}
                          size="sm"
                          className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Search for friends</p>
                <p className="text-sm">Enter a username to find people</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Profile Modal */}
        <AnimatePresence>
          {selectedProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedProfile(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with gradient */}
                <div className="h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-white hover:bg-white/20"
                    onClick={() => setSelectedProfile(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Profile Content */}
                <div className="px-6 pb-6">
                  {/* Avatar */}
                  <div className="relative -mt-16 mb-4">
                    {selectedProfile.avatar_url ? (
                      <img
                        src={selectedProfile.avatar_url}
                        alt={selectedProfile.username}
                        className="w-28 h-28 rounded-full border-4 border-white object-cover mx-auto"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold mx-auto">
                        {selectedProfile.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1">
                      {selectedProfile.display_name || selectedProfile.username}
                    </h2>
                    <p className="text-gray-500 mb-3">@{selectedProfile.username}</p>
                    
                    {selectedProfile.bio && (
                      <p className="text-gray-700 mb-4">{selectedProfile.bio}</p>
                    )}

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                      <Users className="w-4 h-4" />
                      <span>{selectedProfile.friends?.length || 0} friends</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center">
                      {isFriend(selectedProfile.id) ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            removeFriend(selectedProfile.id);
                            setSelectedProfile(null);
                          }}
                          className="rounded-full flex-1 max-w-[200px]"
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
                          className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-1 max-w-[200px]"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </Button>
                      )}
                    </div>
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

