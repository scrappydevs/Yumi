-- Update group descriptions with detailed information
-- Run this in Supabase SQL Editor

UPDATE public.groups SET description = 'Water pipe leaks, burst pipes, or water main breaks causing flooding or water damage' WHERE name = 'Broken Water Pipe';

UPDATE public.groups SET description = 'Fallen or damaged trees blocking roads, sidewalks, or posing safety hazards' WHERE name = 'Fallen Tree';

UPDATE public.groups SET description = 'Road surface defects, holes, or depressions that can damage vehicles or cause safety issues' WHERE name = 'Pothole';

UPDATE public.groups SET description = 'Electrical power interruptions, downed power lines, or utility outages affecting infrastructure' WHERE name = 'Power Outage';

UPDATE public.groups SET description = 'Conditions that pose immediate fire risk including exposed wiring, gas leaks, or flammable materials' WHERE name = 'Fire Hazard';

UPDATE public.groups SET description = 'Non-functional or damaged street lighting affecting visibility and public safety' WHERE name = 'Broken Streetlight';

UPDATE public.groups SET description = 'Cracked, uneven, or broken sidewalk surfaces creating tripping hazards for pedestrians' WHERE name = 'Damaged Sidewalk';

UPDATE public.groups SET description = 'Traffic lights not working properly, stuck signals, or timing issues causing traffic problems' WHERE name = 'Traffic Signal Malfunction';

UPDATE public.groups SET description = 'Vandalism, spray paint, or defacement on public property, buildings, or infrastructure' WHERE name = 'Graffiti';

UPDATE public.groups SET description = 'Clogged or obstructed storm drains causing flooding or water pooling on streets' WHERE name = 'Blocked Storm Drain';

UPDATE public.groups SET description = 'Unauthorized disposal of trash, furniture, construction debris, or hazardous materials' WHERE name = 'Illegal Dumping';

UPDATE public.groups SET description = 'Damaged or deteriorated curbing along streets affecting drainage and vehicle access' WHERE name = 'Broken Curb';

UPDATE public.groups SET description = 'Absent, damaged, or illegible traffic signs, street signs, or regulatory signage' WHERE name = 'Missing Sign';

UPDATE public.groups SET description = 'Objects or materials obstructing roadways including fallen branches, trash, or construction materials' WHERE name = 'Road Debris';

UPDATE public.groups SET description = 'Ground collapse or depression in road surfaces posing serious safety hazards' WHERE name = 'Sinkhole';

UPDATE public.groups SET description = 'General road hazards including oil spills, debris, or conditions affecting safe vehicle operation' WHERE name = 'Road Hazard';

-- Verify the updates
SELECT id, name, 
       CASE 
         WHEN description IS NULL THEN 'Missing'
         WHEN LENGTH(description) < 20 THEN 'Too Short'
         ELSE 'Updated ✓'
       END as status,
       LENGTH(description) as desc_length
FROM public.groups 
ORDER BY id;

