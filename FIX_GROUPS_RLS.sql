-- Fix RLS policy for groups table
-- Run this in Supabase SQL Editor

-- Check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('groups', 'issues');

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('groups', 'issues');

-- Create RLS policy for groups if it doesn't exist
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Service role has full access to groups" ON public.groups;
  
  -- Create new policy
  CREATE POLICY "Service role has full access to groups" ON public.groups
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
    
  RAISE NOTICE 'Groups RLS policy created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Also create a public read policy for groups (they're just categories, not sensitive)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can read groups" ON public.groups;
  
  CREATE POLICY "Public can read groups" ON public.groups
    FOR SELECT
    TO anon, authenticated
    USING (true);
    
  RAISE NOTICE 'Public read policy for groups created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating public policy: %', SQLERRM;
END $$;

-- Verify policies were created
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'groups';

-- Test query
SELECT COUNT(*) as total_groups FROM public.groups;
SELECT * FROM public.groups ORDER BY name LIMIT 5;

