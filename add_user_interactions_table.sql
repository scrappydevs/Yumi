-- ============================================================================
-- Add User Interactions Tracking for Implicit Preference Learning
-- ============================================================================
-- Run this in your Supabase SQL Editor to enable implicit signal tracking

-- 1. Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS user_interactions CASCADE;

-- 2. Create user_interactions table
CREATE TABLE user_interactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL, -- 'search', 'view', 'click', 'reservation', 'maps_view'
  
  -- Restaurant data (if applicable - all nullable)
  restaurant_place_id text,
  restaurant_name text,
  restaurant_cuisine text,
  restaurant_atmosphere text, -- e.g., "Casual", "Fine Dining", "Trendy", "Cozy"
  restaurant_address text,
  
  -- Search data (if applicable)
  search_query text,
  
  -- Weighting for preference learning
  signal_weight real NOT NULL DEFAULT 1.0,
  
  -- Context
  latitude real,
  longitude real,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3. Create indexes for fast lookups
CREATE INDEX idx_user_interactions_user_id 
  ON user_interactions(user_id);

CREATE INDEX idx_user_interactions_type 
  ON user_interactions(interaction_type);

CREATE INDEX idx_user_interactions_created_at 
  ON user_interactions(created_at DESC);

CREATE INDEX idx_user_interactions_user_created 
  ON user_interactions(user_id, created_at DESC);

CREATE INDEX idx_user_interactions_place_id 
  ON user_interactions(restaurant_place_id) 
  WHERE restaurant_place_id IS NOT NULL;

-- 4. Add comment
COMMENT ON TABLE user_interactions IS 'Tracks implicit user signals (searches, clicks, reservations) for preference learning';

-- ============================================================================
-- Signal Weight Reference:
-- ============================================================================
-- search: 1.0 (shows interest)
-- view: 2.0 (hover/modal view)
-- click: 3.0 (explicit selection)
-- maps_view: 5.0 (strong intent)
-- reservation: 10.0 (highest - actual commitment)
-- ============================================================================

-- NOTE: Row Level Security is NOT enabled to allow flexible backend access
