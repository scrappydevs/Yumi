-- Migration: Fix typo in reviews table column name
-- Changes restaraunt_name -> restaurant_name
-- Run this in your Supabase SQL Editor

-- Rename the column to fix the typo
ALTER TABLE public.reviews 
RENAME COLUMN restaraunt_name TO restaurant_name;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND table_schema = 'public'
AND column_name = 'restaurant_name';

