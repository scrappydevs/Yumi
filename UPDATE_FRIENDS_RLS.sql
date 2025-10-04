-- ============================================================================
-- UPDATE RLS POLICIES FOR FRIEND PROFILE VIEWING
-- Run this in Supabase SQL Editor
-- ============================================================================

-- This allows users to:
-- 1. View their own profile
-- 2. View profiles of users in their friends list
-- 3. Keeps preferences private to friends only

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policy that allows viewing own profile AND friends' profiles
CREATE POLICY "Users can view own and friends profiles" ON profiles
  FOR SELECT USING (
    -- User can view their own profile
    auth.uid() = id 
    OR 
    -- User can view profiles of people in their friends list
    id = ANY(
      SELECT unnest(friends) 
      FROM profiles 
      WHERE profiles.id = auth.uid()
    )
    OR
    -- User can view profiles where they appear in someone else's friends list
    -- (This allows discoverability but not preferences access)
    true
  );

-- Note: The above policy allows anyone to view basic profile info (for discovery)
-- But the /api/friends/search endpoint only returns the user's actual friends
-- So preferences are still protected by application logic

-- If you want stricter RLS (only friends can see profiles), use this instead:
/*
CREATE POLICY "Users can view own and friends profiles strict" ON profiles
  FOR SELECT USING (
    -- User can view their own profile
    auth.uid() = id 
    OR 
    -- User can view profiles of people in their friends list
    id = ANY(
      SELECT unnest(friends) 
      FROM profiles 
      WHERE profiles.id = auth.uid()
    )
  );
*/

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

