# Quick Start: Restaurant Description Generation

Generate AI-powered descriptions for restaurants using their images and reviews! 🍽️

## Prerequisites

**Infisical CLI** (already set up if you ran the image script)

```bash
brew install infisical/get-cli/infisical
infisical login
```

## Setup (1 minute)

### Step 1: Add Description Column

Run this in your **Supabase SQL Editor**:

```sql
-- Add description column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS description TEXT;
```

### Step 2: Verify Setup

```bash
cd dashboard/backend
python3 generate_restaurant_descriptions.py
```

The script auto-syncs from Infisical! 🚀

## What To Expect

```
🔄 Syncing secrets from Infisical to .env...
✅ Secrets synced to .env successfully!

==================================================
Starting Restaurant Description Generation
==================================================
Found 234 restaurants missing descriptions

Processing 234 restaurants...

[1/234] Processing restaurant...
============================================================
Processing: Giulia
Gathering images and reviews...
Found 8 images, 12 reviews
Generating description with Gemini...
Generated: "Upscale Italian spot perfect for date night..."
✅ Successfully processed Giulia

[continues for all restaurants...]
```

## Example Output

**For a restaurant with:**
- 8 images (pasta dishes, pizza, desserts)
- 12 reviews ("romantic", "great pasta", "noisy")
- Rating: 4.5⭐, Price: $$$

**Generated description:**
> "Upscale Italian restaurant specializing in house-made pasta and wood-fired pizzas. The intimate candlelit atmosphere and excellent wine selection create a romantic vibe, though it can get noisy on weekends."

## Time & Cost

- **Speed:** ~3-5 seconds per restaurant
- **234 restaurants:** ~15-20 minutes
- **Cost:** ~$0.02 total (essentially free)

## Monitoring Progress

Watch live:
```bash
tail -f restaurant_description_generation.log
```

## What Gets Updated

### Before
```sql
SELECT name, description FROM restaurants WHERE id = '...';

name: "Giulia"
description: NULL
```

### After
```sql
name: "Giulia"
description: "Upscale Italian spot perfect for date night, known for their house-made pasta..."
```

## Troubleshooting

### "Found 0 restaurants missing descriptions"
All done! All restaurants already have descriptions ✅

### Check if column exists:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'restaurants' AND column_name = 'description';
```

If empty, run Step 1 again.

### "No images or reviews available - skipping"
Some restaurants don't have enough data. They'll be skipped safely.

## Re-running

Safe to run multiple times:
- Only updates empty descriptions
- Won't overwrite existing ones
- Picks up where it left off

## Full Documentation

For detailed info: `RESTAURANT_DESCRIPTIONS.md`

---

**Ready? Let's generate descriptions!**

```bash
cd dashboard/backend
python3 generate_restaurant_descriptions.py
```

