-- Profile Auto-Creation Trigger
-- Run this in your Supabase SQL Editor to automatically create profiles when users sign up

-- Function to create a profile when a new user signs up
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
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    generated_username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NULL,
    '{}'::uuid[],
    NULL,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call function when new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

