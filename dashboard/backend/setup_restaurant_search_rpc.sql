-- Setup RPC function for restaurant search with PostGIS
-- This ONLY queries the existing restaurants table, does NOT modify it
-- Run this in Supabase SQL Editor before using the restaurant_db_service

-- Function to search nearby restaurants (READ-ONLY)
CREATE OR REPLACE FUNCTION search_nearby_restaurants(
    search_lat FLOAT,
    search_lng FLOAT,
    radius_m INT DEFAULT 5000,
    result_limit INT DEFAULT 50,
    min_rating FLOAT DEFAULT 0.0,
    min_reviews INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    place_id TEXT,
    name TEXT,
    formatted_address TEXT,
    phone_number TEXT,
    website TEXT,
    google_maps_url TEXT,
    latitude FLOAT,
    longitude FLOAT,
    price_level SMALLINT,
    rating_avg NUMERIC,
    user_ratings_total INT,
    cuisine TEXT,
    atmosphere TEXT,
    description TEXT,
    distance_meters FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.place_id,
        r.name,
        r.formatted_address,
        r.phone_number,
        r.website,
        r.google_maps_url,
        ST_Y(r.location::geometry)::FLOAT as latitude,
        ST_X(r.location::geometry)::FLOAT as longitude,
        r.price_level,
        r.rating_avg,
        r.user_ratings_total,
        r.cuisine,
        r.atmosphere,
        r.description,
        ST_Distance(
            r.location, 
            ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
        )::FLOAT as distance_meters
    FROM public.restaurants r
    WHERE 
        ST_DWithin(
            r.location, 
            ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography, 
            radius_m
        )
        AND (r.rating_avg >= min_rating OR r.rating_avg IS NULL)
        AND r.user_ratings_total >= min_reviews
    ORDER BY distance_meters ASC
    LIMIT result_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_nearby_restaurants TO authenticated;
GRANT EXECUTE ON FUNCTION search_nearby_restaurants TO anon;

-- Test the function (should return restaurants near Boston)
-- SELECT * FROM search_nearby_restaurants(42.3601, -71.0589, 2000, 10);

-- NOTE: This function does NOT modify the restaurants table in any way.
-- It only queries the existing data.

