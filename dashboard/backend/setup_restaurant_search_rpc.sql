-- Setup RPC function for restaurant search with PostGIS
-- This ONLY queries the existing restaurants table, does NOT modify it
-- Run this in Supabase SQL Editor before using the restaurant_db_service

-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS search_nearby_restaurants(FLOAT, FLOAT, INT, INT, FLOAT, INT);
DROP FUNCTION IF EXISTS search_nearby_restaurants_with_food_images(FLOAT, FLOAT, INT, INT, FLOAT, INT);

-- Function 1: Search nearby restaurants with VENUE images (dish IS NULL OR dish = 'NOT_FOOD')
-- Used for initial map view showing restaurant exteriors/venues
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
    photo_url TEXT,
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
        (
            SELECT i.image_url 
            FROM public.images i 
            WHERE i.restaurant_id = r.id 
            AND (i.dish IS NULL OR i.dish = 'NOT_FOOD') -- Venue images: dish is NULL or 'NOT_FOOD'
            ORDER BY i.created_at DESC -- Get the most recent venue image
            LIMIT 1
        ) as photo_url,
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

-- Function 2: Search nearby restaurants with FOOD images (dish IS NOT NULL AND dish != 'NOT_FOOD')
-- Used for browsing food/dish photos from restaurants
CREATE OR REPLACE FUNCTION search_nearby_restaurants_with_food_images(
    search_lat FLOAT,
    search_lng FLOAT,
    radius_m INT DEFAULT 5000,
    result_limit INT DEFAULT 30,
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
    food_image_url TEXT,
    dish_name TEXT,
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
        (
            SELECT i.image_url 
            FROM public.images i 
            WHERE i.restaurant_id = r.id 
            AND i.dish IS NOT NULL 
            AND i.dish != 'NOT_FOOD' -- ONLY fetch food/dish images, exclude venue photos
            ORDER BY i.created_at DESC -- Get the most recent food image
            LIMIT 1
        ) as food_image_url,
        (
            SELECT i.dish 
            FROM public.images i 
            WHERE i.restaurant_id = r.id 
            AND i.dish IS NOT NULL 
            AND i.dish != 'NOT_FOOD'
            ORDER BY i.created_at DESC
            LIMIT 1
        ) as dish_name,
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
        AND EXISTS (
            SELECT 1 FROM public.images i 
            WHERE i.restaurant_id = r.id 
            AND i.dish IS NOT NULL 
            AND i.dish != 'NOT_FOOD'
        ) -- Only return restaurants that HAVE food images
    ORDER BY distance_meters ASC
    LIMIT result_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_nearby_restaurants_with_food_images TO authenticated;
GRANT EXECUTE ON FUNCTION search_nearby_restaurants_with_food_images TO anon;

-- Test the venue images function (should return restaurants near Harvard Square)
-- SELECT * FROM search_nearby_restaurants(42.3725, -71.1218, 2000, 10);

-- Test with photo URLs visible:
-- SELECT name, cuisine, rating_avg, photo_url FROM search_nearby_restaurants(42.3725, -71.1218, 2000, 10);

-- Test the food images function:
-- SELECT name, cuisine, dish_name, food_image_url FROM search_nearby_restaurants_with_food_images(42.3725, -71.1218, 2000, 30);

-- NOTE: These functions do NOT modify the restaurants table in any way.
-- They only query the existing data and join with the images table for photos.

