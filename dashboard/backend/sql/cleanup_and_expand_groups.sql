-- Clean up duplicate groups and add city planning categories
-- Run this in Supabase SQL Editor

-- Step 1: Delete duplicate groups (keep the one with lowest ID)
DELETE FROM public.groups a
USING public.groups b
WHERE a.id > b.id 
  AND a.name = b.name;

-- Step 2: Verify no duplicates remain
SELECT name, COUNT(*) as count 
FROM public.groups 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Step 3: Add city planning and infrastructure tracking categories (only if they don't exist)
DO $$
BEGIN
  -- City Planning
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Zoning Violation') THEN
    INSERT INTO public.groups (name, description) VALUES ('Zoning Violation', 'Property or construction not complying with zoning regulations or land use restrictions');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Building Code Violation') THEN
    INSERT INTO public.groups (name, description) VALUES ('Building Code Violation', 'Structures or construction work violating building codes or safety standards');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Noise Complaint') THEN
    INSERT INTO public.groups (name, description) VALUES ('Noise Complaint', 'Excessive noise from construction, businesses, or residential areas affecting quality of life');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Parking Violation') THEN
    INSERT INTO public.groups (name, description) VALUES ('Parking Violation', 'Illegal parking, blocked access, or parking enforcement issues');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Abandoned Vehicle') THEN
    INSERT INTO public.groups (name, description) VALUES ('Abandoned Vehicle', 'Vehicles left unattended for extended periods or appearing abandoned on public property');
  END IF;

  -- Environmental
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Air Quality Issue') THEN
    INSERT INTO public.groups (name, description) VALUES ('Air Quality Issue', 'Smoke, fumes, dust, or other air pollutants affecting public health');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Water Quality Issue') THEN
    INSERT INTO public.groups (name, description) VALUES ('Water Quality Issue', 'Contaminated water, discolored water, or concerns about drinking water safety');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Waste Management') THEN
    INSERT INTO public.groups (name, description) VALUES ('Waste Management', 'Missed trash pickup, overflowing bins, or improper waste disposal');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Recycling Issue') THEN
    INSERT INTO public.groups (name, description) VALUES ('Recycling Issue', 'Problems with recycling collection or contaminated recycling bins');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Hazardous Materials') THEN
    INSERT INTO public.groups (name, description) VALUES ('Hazardous Materials', 'Chemical spills, toxic materials, or hazardous waste requiring cleanup');
  END IF;

  -- Public Spaces
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Park Maintenance') THEN
    INSERT INTO public.groups (name, description) VALUES ('Park Maintenance', 'Damaged playground equipment, overgrown vegetation, or facility maintenance needs');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Public Restroom Issue') THEN
    INSERT INTO public.groups (name, description) VALUES ('Public Restroom Issue', 'Non-functional or unsanitary public restroom facilities');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Bench or Furniture Damage') THEN
    INSERT INTO public.groups (name, description) VALUES ('Bench or Furniture Damage', 'Broken, vandalized, or missing public seating and street furniture');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Playground Safety') THEN
    INSERT INTO public.groups (name, description) VALUES ('Playground Safety', 'Unsafe playground equipment or conditions posing risk to children');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Trail Maintenance') THEN
    INSERT INTO public.groups (name, description) VALUES ('Trail Maintenance', 'Damaged or obstructed walking/biking trails requiring repair');
  END IF;

  -- Infrastructure Monitoring
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Bridge Maintenance') THEN
    INSERT INTO public.groups (name, description) VALUES ('Bridge Maintenance', 'Structural concerns, damage, or maintenance needs for bridges and overpasses');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Tunnel Maintenance') THEN
    INSERT INTO public.groups (name, description) VALUES ('Tunnel Maintenance', 'Lighting, ventilation, or structural issues in pedestrian or vehicle tunnels');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Manhole Cover Issue') THEN
    INSERT INTO public.groups (name, description) VALUES ('Manhole Cover Issue', 'Missing, broken, or improperly secured manhole covers');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Crosswalk Fading') THEN
    INSERT INTO public.groups (name, description) VALUES ('Crosswalk Fading', 'Worn or faded pedestrian crosswalk markings needing repainting');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Bike Lane Issue') THEN
    INSERT INTO public.groups (name, description) VALUES ('Bike Lane Issue', 'Damaged, obstructed, or poorly marked bicycle lanes');
  END IF;

  -- Public Safety
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Street Flooding') THEN
    INSERT INTO public.groups (name, description) VALUES ('Street Flooding', 'Excessive water accumulation on streets during or after rainfall');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Ice or Snow Hazard') THEN
    INSERT INTO public.groups (name, description) VALUES ('Ice or Snow Hazard', 'Uncleared snow, ice patches, or winter weather hazards on public ways');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Streetlight Outage') THEN
    INSERT INTO public.groups (name, description) VALUES ('Streetlight Outage', 'Multiple streetlights out in an area affecting safety');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'Pedestrian Safety') THEN
    INSERT INTO public.groups (name, description) VALUES ('Pedestrian Safety', 'Unsafe pedestrian crossings, missing crosswalks, or visibility issues');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'School Zone Safety') THEN
    INSERT INTO public.groups (name, description) VALUES ('School Zone Safety', 'Safety concerns near schools including signage, crossings, or traffic control');
  END IF;

END $$;

-- Step 4: Final count and verification
SELECT 
  COUNT(*) as total_groups,
  COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as with_description,
  COUNT(CASE WHEN description IS NULL THEN 1 END) as missing_description
FROM public.groups;

-- Step 5: Display all groups sorted alphabetically
SELECT id, name, 
       LEFT(description, 60) as description_preview,
       LENGTH(description) as length
FROM public.groups 
ORDER BY name;


