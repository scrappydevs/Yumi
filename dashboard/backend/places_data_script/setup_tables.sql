-- SQL Setup for Restaurant Data Tables
-- Run this in your Supabase SQL Editor before running the data script

-- Restaurants table (main restaurant data)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT UNIQUE NOT NULL,  -- Google Places unique identifier
  name TEXT NOT NULL,
  address TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  phone TEXT,
  website TEXT,
  rating NUMERIC(3,2),
  user_ratings_total INTEGER,
  price_level INTEGER,
  types TEXT[],
  opening_hours JSONB,
  business_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant photos table
CREATE TABLE IF NOT EXISTS public.restaurant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  photo_reference TEXT NOT NULL,
  photo_url TEXT,
  width INTEGER,
  height INTEGER,
  html_attributions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant reviews table (Google reviews)
CREATE TABLE IF NOT EXISTS public.restaurant_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  author_name TEXT,
  author_url TEXT,
  rating INTEGER,
  text TEXT,
  time INTEGER,  -- Unix timestamp
  relative_time_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_restaurants_place_id ON restaurants(place_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating DESC);
CREATE INDEX IF NOT EXISTS idx_restaurant_photos_restaurant_id ON restaurant_photos(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_reviews_restaurant_id ON restaurant_reviews(restaurant_id);

-- Enable Row Level Security (optional, adjust policies as needed)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies to allow reading (adjust as needed)
CREATE POLICY "Allow public read access on restaurants"
  ON restaurants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on restaurant_photos"
  ON restaurant_photos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on restaurant_reviews"
  ON restaurant_reviews FOR SELECT
  TO public
  USING (true);

-- Create policies for service role (for insert/update)
CREATE POLICY "Allow service role full access on restaurants"
  ON restaurants
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on restaurant_photos"
  ON restaurant_photos
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on restaurant_reviews"
  ON restaurant_reviews
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for restaurant images (run separately or via Supabase dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public read
CREATE POLICY "Public read access on restaurant images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'restaurant-images');

-- Create storage policy for service role write
CREATE POLICY "Service role write access on restaurant images"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'restaurant-images');

COMMENT ON TABLE restaurants IS 'Restaurant data from Google Places API';
COMMENT ON TABLE restaurant_photos IS 'Photos from Google Places for each restaurant';
COMMENT ON TABLE restaurant_reviews IS 'Reviews from Google Places for each restaurant';

