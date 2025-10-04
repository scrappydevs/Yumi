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
  const [dropdownPosition, setDropdownPosition] = useState({ bottom: 0, left: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { filteredFriends, filterFriends, loading } = useFriendMentions();

  // Calculate dropdown position (Slack-style: above input)
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;
    
    const input = inputRef.current;
    const inputRect = input.getBoundingClientRect();
    
    // Dropdown dimensions
    const dropdownMaxHeight = 256; // max-h-64 = 16rem = 256px
    const margin = 8; // Gap between input and dropdown
    
    // Position dropdown ABOVE the input (Slack style)
    const bottom = window.innerHeight - inputRect.top + margin;
    
    // Align left edge with input
    const left = inputRect.left;
    
    setDropdownPosition({
      left: left,
      bottom: bottom,
    });
  };

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
        // Calculate position on next tick to ensure state is updated
        setTimeout(() => calculateDropdownPosition(), 0);
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

  // Scroll selected item into view when navigating with keyboard
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, showDropdown]);

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

      {/* Mention Dropdown - Slack Style */}
      <AnimatePresence>
        {showDropdown && filteredFriends.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto"
            style={{ 
              minWidth: '360px',
              maxWidth: '400px',
              bottom: `${dropdownPosition.bottom}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">Loading friends...</div>
            ) : (
              <>
                {filteredFriends.map((friend, index) => (
                  <button
                    key={friend.id}
                    data-index={index}
                    onClick={() => selectFriend(friend)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors border-0 ${
                      index === selectedIndex 
                        ? 'bg-[#1164A3] text-white' 
                        : 'bg-white'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded flex items-center justify-center text-white font-medium text-sm flex-shrink-0 bg-gradient-to-br from-purple-400 to-pink-400">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.username}
                          className="w-full h-full rounded object-cover"
                        />
                      ) : (
                        <span>{friend.username[0].toUpperCase()}</span>
                      )}
                    </div>

                    {/* Friend Info */}
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className={`font-semibold text-sm truncate w-full text-left ${
                        index === selectedIndex ? 'text-white' : 'text-gray-900'
                      }`}>
                        {friend.display_name || friend.username}
                      </span>
                      <span className={`text-xs truncate w-full text-left ${
                        index === selectedIndex ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        @{friend.username}
                      </span>
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
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 px-4 py-3"
          style={{ 
            minWidth: '360px',
            maxWidth: '400px',
            bottom: `${dropdownPosition.bottom}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <p className="text-sm text-gray-500">
            No friends found matching "{mentionQuery}"
          </p>
        </div>
      )}
    </div>
  );
}

