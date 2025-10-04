-- ============================================================================
-- ADD PHONE NUMBER TO PROFILES TABLE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add phone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Add phone_verified column (optional - for SMS verification)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- 3. Add onboarded column to track if user completed setup
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;

-- 4. Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 5. Update the auto-profile creation trigger to mark as not onboarded
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Generate username from email (before @ symbol)
  generated_username := SPLIT_PART(NEW.email, '@', 1);
  
  -- Make username unique by appending random numbers if it already exists
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) LOOP
    generated_username := SPLIT_PART(NEW.email, '@', 1) || '_' || FLOOR(RANDOM() * 10000)::TEXT;
  END LOOP;
  
  -- Insert profile with user data
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    bio,
    friends,
    preferences,
    phone,
    phone_verified,
    onboarded,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    generated_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', generated_username),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL,
    '{}'::uuid[],
    NULL,
    NEW.raw_user_meta_data->>'phone',  -- Try to get phone from Google (usually NULL)
    false,
    false,  -- Mark as not onboarded - will need to complete setup
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update RLS policy to allow users to view others' phones (for invitations)
-- This is safe because phone numbers will be needed for sending reservations
CREATE POLICY IF NOT EXISTS "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

-- Keep the existing policies for update/insert
-- (Users can only update/insert their own profile)

COMMENT ON COLUMN public.profiles.phone IS 'E.164 format phone number (+1234567890)';
COMMENT ON COLUMN public.profiles.phone_verified IS 'Whether phone has been verified via SMS';
COMMENT ON COLUMN public.profiles.onboarded IS 'Whether user has completed onboarding (added phone, etc)';
