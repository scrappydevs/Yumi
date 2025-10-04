# Friends Feature Setup Guide

## Overview
The friends feature allows users to search for other users, follow/unfollow them, view their profiles, and manage their friend connections. The UI is inspired by Instagram and Beli's clean, modern design.

## Database Setup

### 1. Run Profile Auto-Creation Trigger
Run this SQL in your **Supabase SQL Editor**:

```sql
-- Located in: dashboard/backend/supabase_profile_setup.sql

-- This creates a trigger that automatically creates a profile
-- when a new user signs up with Google OAuth
```

The trigger will:
- Automatically create a profile when a user signs up
- Generate a username from their email
- Handle username uniqueness
- Pull display name and avatar from Google OAuth data
- Initialize empty friends array

### 2. Verify Profiles Table
Make sure your `profiles` table matches this schema:

```sql
create table public.profiles (
  id uuid not null,
  username text not null,
  display_name text null,
  avatar_url text null,
  bio text null,
  friends uuid[] null default '{}'::uuid[],
  preferences text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
);
```

## Features

### 🔍 Discover Tab
- **Search Users**: Real-time search by username
- **Follow Users**: One-click follow button
- **Profile Preview**: Click on any user to see their full profile

### 👥 My Friends Tab
- **View All Friends**: Grid layout showing all your friends
- **Unfollow**: Quick unfollow from the card
- **Profile View**: Click any friend card to see their profile

### 👤 Profile Modal
- **Full Profile View**: Avatar, display name, username, bio
- **Friend Count**: See how many friends they have
- **Quick Actions**: Follow/unfollow directly from profile

## How It Works

### Friend Relationship Storage
- Friends are stored as a UUID array in `profiles.friends`
- **One-directional**: User A can follow User B without B following back (like Instagram)
- Updates are done via direct Supabase queries from the frontend

### Profile Creation Flow
1. User signs in with Google OAuth
2. OAuth redirects to `/auth/callback`
3. Callback exchanges code for session
4. **Trigger fires**: `on_auth_user_created` automatically creates profile
5. User is redirected to `/overview`

### Friends Flow
1. User goes to Friends tab (`/friends`)
2. Searches for other users by username
3. Clicks "Follow" button
4. Friend's UUID is added to current user's `friends` array
5. Friend appears in "My Friends" tab

## UI/UX Features

### Design Elements
- **Gradient backgrounds**: Purple/pink/blue gradients throughout
- **Smooth animations**: Framer Motion for transitions
- **Glassmorphism**: Backdrop blur effects on cards
- **Responsive**: Works on mobile and desktop

### Interaction Patterns
- **Instant feedback**: Loading states on search
- **Optimistic updates**: UI updates immediately
- **Debounced search**: 300ms delay to prevent excessive queries
- **Modal profiles**: Click anywhere to view full profile

## Testing

### Test the Feature
1. Sign in with Google
2. Go to Friends tab (sidebar)
3. Search for users in Discover tab
4. Follow a user
5. Check "My Friends" tab to see them
6. Click on a friend card to view profile
7. Unfollow from profile modal or friend card

### Create Test Users
To test with multiple users:
1. Sign in with different Google accounts
2. Each will get a profile automatically
3. Search for each other by username
4. Test follow/unfollow functionality

## API Calls

The friends page makes these Supabase queries:

```typescript
// Get current user's profile
supabase.from('profiles').select('*').eq('id', user.id).single()

// Search users
supabase.from('profiles').select('*').ilike('username', `%${query}%`)

// Get friends list
supabase.from('profiles').select('*').in('id', friendIds)

// Add friend
supabase.from('profiles').update({ friends: [...friends, newFriendId] })

// Remove friend
supabase.from('profiles').update({ friends: friends.filter(id => id !== friendId) })
```

## Next Steps

### Potential Enhancements
- [ ] Add "following/followers" distinction (two-way relationships)
- [ ] Friend requests/approval system
- [ ] Friend activity feed
- [ ] Mutual friends display
- [ ] Friend suggestions based on mutual friends
- [ ] Block/report users
- [ ] Private profiles
- [ ] Friend groups/lists

### Performance Optimizations
- [ ] Paginate search results
- [ ] Cache friend list
- [ ] Real-time updates with Supabase subscriptions
- [ ] Infinite scroll for large friend lists

## Troubleshooting

### Profile not created after signup?
1. Check if trigger is installed: Run `supabase_profile_setup.sql`
2. Check Supabase logs for trigger errors
3. Verify `auth.users` permissions

### Can't search users?
1. Verify profiles table has data
2. Check RLS policies on profiles table
3. Ensure username column exists

### Friends not updating?
1. Check browser console for errors
2. Verify Supabase permissions
3. Check if `friends` column is UUID array type

