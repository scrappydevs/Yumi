-- Migration: Add description column to restaurants table
-- Run this in your Supabase SQL Editor before running the description generation script

-- Add description column
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.restaurants.description IS 'AI-generated restaurant description based on images and reviews';

-- Create index for text search (optional, for future search features)
CREATE INDEX IF NOT EXISTS idx_restaurants_description 
ON public.restaurants USING gin(to_tsvector('english', description));

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
AND table_schema = 'public'
AND column_name = 'description';

