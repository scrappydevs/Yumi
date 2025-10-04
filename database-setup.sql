-- Database setup for iFix Dashboard
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  friends uuid[] DEFAULT '{}',
  preferences text DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_name text NOT NULL,
  visit_date timestamp with time zone DEFAULT now(),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  restaurant_image text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  restaurant_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for visits
CREATE POLICY "Users can view own visits" ON visits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits" ON visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visits" ON visits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visits" ON visits
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for photos
CREATE POLICY "Users can view own photos" ON photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON photos
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
