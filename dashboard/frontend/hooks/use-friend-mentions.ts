/**
 * Hook for managing friend mentions in input fields
 * Handles @ detection, friend search, and mention parsing
 */
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Mention {
  id: string;
  username: string;
  display_name: string | null;
}

export function useFriendMentions() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Load all friends on mount
  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    console.log('[FRIENDS HOOK] Starting to load friends...');
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('[FRIENDS HOOK] No session found');
        throw new Error('Not authenticated');
      }

      console.log('[FRIENDS HOOK] Session found, fetching friends...');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/friends/search`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[FRIENDS HOOK] API request failed:', response.status);
        throw new Error('Failed to load friends');
      }

      const data = await response.json();
      console.log('[FRIENDS HOOK] Loaded friends:', data.friends);
      setFriends(data.friends || []);
      setFilteredFriends(data.friends || []);
    } catch (err) {
      console.error('[FRIENDS HOOK] Error loading friends:', err);
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  // Filter friends based on search query
  const filterFriends = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = friends.filter(
      (friend) =>
        friend.username.toLowerCase().includes(lowerQuery) ||
        (friend.display_name && friend.display_name.toLowerCase().includes(lowerQuery))
    );

    setFilteredFriends(filtered);
  }, [friends]);

  // Extract mentions from text (e.g., "lunch with @julian @sarah" -> [julian, sarah])
  const extractMentions = useCallback((text: string, selectedMentions: Mention[]): Mention[] => {
    // Return the mentions that were explicitly selected by the user
    return selectedMentions;
  }, []);

  // Parse @ mentions from input text to get IDs
  const getMentionIds = useCallback((mentions: Mention[]): string[] => {
    return mentions.map(m => m.id);
  }, []);

  return {
    friends,
    filteredFriends,
    loading,
    error,
    filterFriends,
    extractMentions,
    getMentionIds,
    refreshFriends: loadFriends,
  };
}

