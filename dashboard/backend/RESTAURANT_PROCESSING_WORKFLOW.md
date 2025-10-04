# Restaurant Processing Workflow

## Overview

Complete workflow for processing restaurants in the database, including filtering non-food establishments.

## Scripts

### 1. `mark_processed_restaurants.py` - One-time Setup
**Purpose:** Mark existing restaurants with descriptions as processed.

**Usage:**
```bash
cd dashboard/backend
python3 mark_processed_restaurants.py
```

**What it does:**
- Finds all restaurants that already have a description
- Sets `processed = true` for those restaurants
- Prevents re-processing already completed restaurants

**Run this ONCE before using the profile generator.**

---

### 2. `generate_restaurant_descriptions.py` - Main Script
**Purpose:** Generate profiles for unprocessed restaurants with smart filtering.

**Usage:**
```bash
cd dashboard/backend
python3 generate_restaurant_descriptions.py
```

**Enhanced Flow:**

```
For each unprocessed restaurant:
  ↓
1. Check if it's a FOOD establishment (Gemini Flash call)
  ↓
  → NO: Add to removal list + mark as processed → SKIP
  ↓
  → YES: Continue processing
  ↓
2. Gather food images, location images, reviews
  ↓
  → No data: Mark as processed → SKIP
  ↓
3. Generate profile (cuisine, atmosphere, description)
  ↓
4. Update database with profile
  ↓
5. Mark as processed → DONE
```

**Output Files:**
- `restaurant_description_generation.log` - Detailed processing log
- `restaurants_to_remove.txt` - List of non-food places to remove

---

## Database Changes Required

Run this SQL migration first:
```sql
-- Add required columns
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS cuisine TEXT,
ADD COLUMN IF NOT EXISTS atmosphere TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;
```

Or use the provided migration file:
```bash
# In Supabase SQL Editor:
cat add_restaurant_profile_columns.sql
```

---

## Smart Filtering

### What Gets Filtered Out

The script uses Gemini to identify and filter:
- ❌ Grocery stores & supermarkets
- ❌ Food suppliers & distributors  
- ❌ Convenience stores
- ❌ Non-food businesses
- ❌ Hotels (unless specifically their restaurant)
- ❌ Any place that doesn't serve prepared food/drinks

### What Stays

- ✅ Restaurants
- ✅ Cafes & coffee shops
- ✅ Bars & pubs
- ✅ Food trucks
- ✅ Bakeries
- ✅ Fast food
- ✅ Any establishment serving prepared food/drinks

---

## Removal List Format

`restaurants_to_remove.txt`:
```
restaurant_id|restaurant_name|address
550e8400-e29b-41d4-a716-446655440000|7-Eleven|123 Main St
...
```

### Cleaning Up Non-Food Places

After running the script, review and delete:
```sql
-- Review first
SELECT * FROM restaurants WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440000',
  -- ... (IDs from removal list)
);

-- Then delete
DELETE FROM restaurants WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440000',
  -- ... (IDs from removal list)
);
```

---

## Complete Workflow

### Initial Setup

1. **Add columns to database:**
   ```sql
   -- Run in Supabase SQL Editor
   cat add_restaurant_profile_columns.sql
   ```

2. **Mark existing processed restaurants:**
   ```bash
   python3 mark_processed_restaurants.py
   ```

### Regular Processing

3. **Run profile generator:**
   ```bash
   python3 generate_restaurant_descriptions.py
   ```

4. **Review removal list:**
   ```bash
   cat restaurants_to_remove.txt
   ```

5. **Clean up database** (optional):
   ```sql
   -- Delete non-food places
   DELETE FROM restaurants WHERE id IN (...);
   ```

---

## Expected Output

```
🔄 Syncing secrets from Infisical to .env...
✅ Secrets synced to .env successfully!
🤖 Using Gemini model: gemini-2.5-flash

==================================================
Starting Restaurant Profile Generation
Generating: Cuisine, Atmosphere, Description
==================================================

Fetching unprocessed restaurants...
Found 234 unprocessed restaurants

Processing 234 restaurants...

[1/234] Processing restaurant...
============================================================
Processing: Dunkin'
ID: 550e8400-e29b-41d4-a716-446655440000
Checking if this is a food establishment...
Food check for 'Dunkin'': YES -> True
✅ Confirmed food establishment - proceeding...
Gathering food images, location images, and reviews...
Found 5 food images, 2 location images, 8 reviews
Generating restaurant profile with Gemini...
Generated: American | Quick casual dining
Description: "Popular coffee and donut chain perfect for..."
Marking as processed...
✅ Successfully processed Dunkin'

[2/234] Processing restaurant...
============================================================
Processing: Stop & Shop
ID: 660e8400-e29b-41d4-a716-446655440001
Checking if this is a food establishment...
Food check for 'Stop & Shop': NO -> False
❌ NOT a food establishment - adding to removal list
Added to removal list: Stop & Shop

[5/234] Progress checkpoint...
============================================================
PROGRESS: 5/234 restaurants processed
✅ Generated: 4, ⏭️  Skipped: 0, 🚫 Not Food: 1, ❌ Failed: 0
============================================================

... (continues for all restaurants)

============================================================
                    FINAL SUMMARY                         
============================================================
Total restaurants processed: 234
✅ Successful profiles: 210
⏭️  Skipped (no data): 15
🚫 Not food establishments: 8
❌ Failed: 1
Success rate: 90.1%
============================================================
Generated fields: cuisine, atmosphere, description

⚠️  8 non-food places added to 'restaurants_to_remove.txt' for removal
```

---

## Status Tracking

The `processed` boolean field tracks:
- `NULL` or `false` - Not yet processed
- `true` - Processed (either successfully or determined not to be food)

This prevents:
- ✅ Re-checking the same restaurant multiple times
- ✅ Wasting API calls on already-processed places
- ✅ Continuously querying non-food establishments

---

## Statistics

### Per Restaurant
- **1-2 Gemini API calls** (food check + profile generation if applicable)
- **~3-5 seconds** processing time
- **Cost:** ~$0.0001 per restaurant

### For 234 Restaurants
- **Time:** ~15-20 minutes
- **Cost:** ~$0.02 total
- **Expected filtering:** ~5-10% non-food places

---

## Troubleshooting

### "No unprocessed restaurants found"
All restaurants have been processed! ✅

### "GEMINI_API_KEY not set"
Add to Infisical (dev environment).

### Too Many False Positives in Removal List
Adjust the food establishment check prompt in `is_food_establishment()` method.

### Script Interrupted
Safe to re-run - already-processed restaurants are skipped.

---

## Safety Features

- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Resumable** - Tracks progress via `processed` field
- ✅ **Non-destructive** - Only adds to removal list, doesn't delete
- ✅ **Conservative** - Defaults to keeping restaurants if uncertain
- ✅ **Auditable** - All decisions logged

---

**Ready to process restaurants with smart filtering!** 🍽️

