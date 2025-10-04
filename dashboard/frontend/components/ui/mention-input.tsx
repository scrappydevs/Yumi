'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriendMentions, Friend, Mention } from '@/hooks/use-friend-mentions';
import { Badge } from '@/components/ui/badge';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange: (mentions: Mention[]) => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  onMentionsChange,
  placeholder = 'Type @ to mention friends...',
  className = '',
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<Mention[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { filteredFriends, filterFriends, loading } = useFriendMentions();

  // Detect @ character and extract query after it
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Find @ before cursor
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    console.log('[MENTION] Input changed:', { newValue, cursorPos, lastAtIndex });
    
    if (lastAtIndex !== -1) {
      // Check if there's a space after the last @
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      
      if (!textAfterAt.includes(' ')) {
        // We're in a mention
        console.log('[MENTION] Showing dropdown, query:', textAfterAt);
        setMentionQuery(textAfterAt);
        filterFriends(textAfterAt);
        setShowDropdown(true);
        setSelectedIndex(0);
      } else {
        console.log('[MENTION] Space detected, hiding dropdown');
        setShowDropdown(false);
      }
    } else {
      console.log('[MENTION] No @ found, hiding dropdown');
      setShowDropdown(false);
    }
  };

  // Handle friend selection
  const selectFriend = (friend: Friend) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Replace @query with @username
      const beforeAt = value.slice(0, lastAtIndex);
      const afterCursor = value.slice(cursorPosition);
      const newValue = `${beforeAt}@${friend.username} ${afterCursor}`;
      
      onChange(newValue);
      
      // Add to selected mentions
      const newMention: Mention = {
        id: friend.id,
        username: friend.username,
        display_name: friend.display_name,
      };
      
      const updatedMentions = [...selectedMentions, newMention];
      setSelectedMentions(updatedMentions);
      onMentionsChange(updatedMentions);
      
      setShowDropdown(false);
      setMentionQuery('');
      
      // Focus back on input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // Remove a mention
  const removeMention = (username: string) => {
    // Remove from mentions list
    const updatedMentions = selectedMentions.filter(m => m.username !== username);
    setSelectedMentions(updatedMentions);
    onMentionsChange(updatedMentions);
    
    // Remove from input text
    const regex = new RegExp(`@${username}\\s?`, 'g');
    const newValue = value.replace(regex, '');
    onChange(newValue);
  };

  // Keyboard navigation in dropdown
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredFriends.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredFriends.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        if (showDropdown) {
          e.preventDefault();
          selectFriend(filteredFriends[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  console.log('[MENTION] Render state:', { showDropdown, friendsCount: filteredFriends.length, loading });

  return (
    <div className="relative w-full flex items-center gap-2">
      {/* Selected Mentions Display - Inline badges */}
      {selectedMentions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedMentions.map((mention) => (
            <Badge
              key={mention.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-0.5 text-xs"
            >
              <User className="w-3 h-3" />
              <span>{mention.display_name || mention.username}</span>
              <button
                onClick={() => removeMention(mention.username)}
                className="ml-1 hover:text-destructive"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`flex-1 w-full ${className}`}
      />

      {/* Mention Dropdown */}
      <AnimatePresence>
        {showDropdown && filteredFriends.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[9999] w-full mt-2 top-full left-0 bg-white rounded-lg shadow-2xl border-2 border-purple-500 max-h-64 overflow-y-auto"
            style={{ minWidth: '300px' }}
          >
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">Loading friends...</div>
            ) : (
              <>
                {filteredFriends.map((friend, index) => (
                  <button
                    key={friend.id}
                    onClick={() => selectFriend(friend)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-purple-50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium text-sm">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{friend.username[0].toUpperCase()}</span>
                      )}
                    </div>

                    {/* Friend Info */}
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-gray-900">
                        {friend.display_name || friend.username}
                      </span>
                      <span className="text-xs text-gray-500">@{friend.username}</span>
                    </div>
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      {showDropdown && filteredFriends.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-500">
            No friends found matching "{mentionQuery}"
          </p>
        </div>
      )}
    </div>
  );
}

