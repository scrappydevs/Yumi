-- Migration: Add cuisine, atmosphere, and description columns to restaurants table
-- Run this in your Supabase SQL Editor before running the restaurant profile generation script

-- Add columns if they don't exist
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS cuisine TEXT,
ADD COLUMN IF NOT EXISTS atmosphere TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.restaurants.cuisine IS 'AI-generated primary cuisine type (one word, e.g., Italian, Mexican, American)';
COMMENT ON COLUMN public.restaurants.atmosphere IS 'AI-generated atmosphere description (2-4 words, e.g., "Casual family dining", "Upscale romantic")';
COMMENT ON COLUMN public.restaurants.description IS 'AI-generated restaurant description (2-3 sentences)';

-- Create indexes for filtering/searching
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine 
ON public.restaurants (cuisine);

CREATE INDEX IF NOT EXISTS idx_restaurants_atmosphere 
ON public.restaurants (atmosphere);

-- Create text search index for description
CREATE INDEX IF NOT EXISTS idx_restaurants_description 
ON public.restaurants USING gin(to_tsvector('english', description));

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
AND table_schema = 'public'
AND column_name IN ('cuisine', 'atmosphere', 'description')
ORDER BY ordinal_position;

