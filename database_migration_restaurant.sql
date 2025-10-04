-- Migration: Add restaurant matching columns to images table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS restaurant_name TEXT,
ADD COLUMN IF NOT EXISTS restaurant_confidence TEXT,
ADD COLUMN IF NOT EXISTS restaurant_reasoning TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.images.restaurant_name IS 'AI-matched restaurant name from Google Places API';
COMMENT ON COLUMN public.images.restaurant_confidence IS 'Confidence level: high, medium, or low';
COMMENT ON COLUMN public.images.restaurant_reasoning IS 'AI reasoning for restaurant match';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'images' 
AND table_schema = 'public'
ORDER BY ordinal_position;

