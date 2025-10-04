# Restaurant Description Generation

## Overview

Automatically generate compelling restaurant descriptions using AI analysis of associated images, dishes, and customer reviews.

## What It Does

1. **Fetches** all restaurants with empty `description` fields
2. **Gathers** associated data:
   - Images with dish/cuisine annotations
   - Text reviews from customers
   - Restaurant metadata (rating, price level, location)
3. **Analyzes** using Gemini AI to synthesize a compelling profile
4. **Generates** 2-3 sentence descriptions capturing:
   - Cuisine type and signature dishes
   - Atmosphere and vibe
   - Best occasions/experiences
5. **Updates** the database with generated descriptions

## Prerequisites

### Database Setup

Run the migration SQL first:
```bash
# In Supabase SQL Editor, run:
cat add_restaurant_description_column.sql
```

This adds the `description TEXT` column to the `restaurants` table.

### Infisical CLI (Secret Management)

```bash
brew install infisical/get-cli/infisical
infisical login
```

Ensure these secrets are in Infisical (dev environment):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (or `NEXT_PUBLIC_SUPABASE_SERVICE_KEY`)
- `GEMINI_API_KEY`

### Python Dependencies

Already in `requirements.txt`:
- `supabase` - Database client
- `google-generativeai` - Gemini API
- `python-dotenv` - Environment management

## Usage

### Basic Usage

```bash
cd dashboard/backend
python3 generate_restaurant_descriptions.py
```

The script:
- 🔄 Syncs secrets from Infisical automatically
- 📊 Fetches restaurants needing descriptions
- 🤖 Generates AI-powered descriptions
- 💾 Updates database
- 📝 Logs everything to `restaurant_description_generation.log`

### Expected Output

```
🔄 Syncing secrets from Infisical to .env...
✅ Secrets synced to .env successfully!
✅ Initialized RestaurantDescriptionGenerator

==================================================
Starting Restaurant Description Generation
==================================================
Fetching restaurants with missing descriptions...
Found 234 restaurants missing descriptions

Processing 234 restaurants...

[1/234] Processing restaurant...
============================================================
Processing: Giulia
ID: 550e8400-e29b-41d4-a716-446655440000
Gathering images and reviews...
Found 8 images, 12 reviews
Generating description with Gemini...
Generated: "Upscale Italian restaurant specializing in house-made pasta and wood-fired pizzas. The elegant yet cozy atmosphere..."
✅ Updated restaurant 550e8400-e29b-41d4-a716-446655440000
✅ Successfully processed Giulia

[2/234] Processing restaurant...
============================================================
Processing: Taqueria El Amigo
ID: 660e8400-e29b-41d4-a716-446655440001
Gathering images and reviews...
Found 3 images, 0 reviews
⏭️  No images or reviews available - skipping

[5/234] Progress checkpoint...
============================================================
PROGRESS: 5/234 restaurants processed
✅ Generated: 4, ⏭️  Skipped: 1, ❌ Failed: 0
============================================================
```

## Generated Description Examples

### Example 1: Italian Restaurant
**Input Data:**
- Dishes: Carbonara, Margherita Pizza, Tiramisu
- Reviews: "Amazing pasta!", "Romantic atmosphere", "Great for dates"
- Rating: 4.5⭐, Price: $$$

**Generated:**
> "Upscale Italian spot perfect for date night, known for their house-made pasta and wood-fired pizzas. The intimate candlelit atmosphere and excellent wine selection create a romantic vibe, though it can get noisy on weekends."

### Example 2: Taco Place
**Input Data:**
- Dishes: Fish Tacos, Street Corn, Margaritas
- Reviews: "Best tacos in town", "Fun bar scene", "Great for groups"
- Rating: 4.2⭐, Price: $$

**Generated:**
> "Casual taco joint with a lively bar scene and creative Mexican fusion. Great for groups looking for a fun night out with margaritas and shareable apps. The fish tacos and street corn are must-tries."

### Example 3: Breakfast Diner
**Input Data:**
- Dishes: Pancakes, French Toast, Eggs Benedict
- Reviews: "Huge portions", "Classic diner", "Best breakfast"
- Rating: 4.0⭐, Price: $

**Generated:**
> "Classic American diner serving hearty breakfast all day in a retro setting. Locals love the fluffy pancakes and generous portions. Perfect for a comfort food fix or weekend brunch with family."

## How It Works

### Data Gathering Process

```python
# For each restaurant:
1. Fetch associated images with dish/cuisine data
2. Fetch customer reviews (up to 20, sorted by rating)
3. Compile context:
   - "Dish: Carbonara (Italian cuisine)"
   - "Review (5⭐): Amazing pasta and great service"
```

### AI Prompt Strategy

The script sends Gemini a structured prompt with:
- Restaurant metadata (name, location, rating, price)
- Dish/menu information from images
- Customer review excerpts
- Style guidelines for output

**Prompt Template:**
```
You are writing a compelling restaurant description...

RESTAURANT: {name}
RATING: {rating}⭐ PRICE: {price_level}

DISHES/MENU:
- Dish: Carbonara (Italian cuisine)
- Dish: Margherita Pizza (Italian cuisine)

CUSTOMER REVIEWS:
- Review (5⭐): Best pasta in Boston!
- Review (4⭐): Romantic atmosphere, great for dates

TASK: Write 2-3 sentences capturing the vibe...
```

### Output Format

Generated descriptions are:
- **2-3 sentences** (50-100 words)
- **Conversational** tone (like recommending to a friend)
- **Specific details** from actual data
- **Experience-focused** (not just facts)
- **Occasion-appropriate** (date night, family, etc.)

## Configuration

Edit `generate_restaurant_descriptions.py`:

```python
generator.run(
    batch_size=5,        # Progress log frequency
    delay_seconds=2.0    # Delay between API calls
)
```

### Parameters

- **`batch_size`**: Restaurants to process before progress log (default: 5)
- **`delay_seconds`**: Seconds between Gemini calls (default: 2.0)

## Performance

### Speed
- **Time per restaurant:** ~3-5 seconds
- **234 restaurants:** ~15-20 minutes
- Longer delay than image script (more complex generation)

### Cost
- **Gemini Flash:** ~$0.0001 per description
- **234 restaurants:** ~$0.02 total
- Well within free tier limits

### API Calls
- 1 Gemini call per restaurant (no pre-check needed)
- Database queries: 3 per restaurant (fetch images, reviews, update)

## Tracking & Reporting

### Status Categories

1. **✅ Success** - Description generated and saved
2. **⏭️  Skipped** - No images or reviews available
3. **❌ Failed** - Error during generation/update

### Final Summary

```
============================================================
                    FINAL SUMMARY                         
============================================================
Total restaurants processed: 234
✅ Successful descriptions: 210
⏭️  Skipped (no data): 20
❌ Failed: 4
Success rate: 91.3%
============================================================
```

## Log Files

Everything logged to `restaurant_description_generation.log`:

```bash
# View recent logs
tail -50 restaurant_description_generation.log

# Watch live
tail -f restaurant_description_generation.log

# Check for skipped restaurants
grep "⏭️" restaurant_description_generation.log

# Find generated descriptions
grep "Generated:" restaurant_description_generation.log
```

## Data Requirements

### Minimum Data Needed

For best results, a restaurant should have:
- **At least 1 image** with dish/description, OR
- **At least 1 text review**

**No data?** → Restaurant is skipped (not updated)

### Data Quality Impact

| Data Available | Description Quality |
|---------------|-------------------|
| 10+ images, 10+ reviews | ⭐⭐⭐⭐⭐ Excellent |
| 5+ images, 5+ reviews | ⭐⭐⭐⭐ Great |
| 3+ images OR reviews | ⭐⭐⭐ Good |
| 1-2 images/reviews | ⭐⭐ Basic |
| 0 data | ⏭️ Skipped |

## Troubleshooting

### "Could not sync from Infisical"
```bash
brew install infisical/get-cli/infisical
infisical login
```

### "GEMINI_API_KEY not set"
Add to Infisical project (dev environment), then re-run.

### "Found 0 restaurants missing descriptions"
All restaurants already have descriptions! ✅

Or check if description column exists:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'restaurants' AND column_name = 'description';
```

### Low Success Rate
- Check `restaurant_description_generation.log` for errors
- Verify Gemini API quota
- Ensure images and reviews exist for restaurants

## Safety Features

- ✅ Only updates NULL/empty descriptions (won't overwrite)
- ✅ Validates data before generating
- ✅ Skips restaurants without sufficient data
- ✅ Can be interrupted safely (Ctrl+C)
- ✅ Re-runnable (picks up where it left off)
- ✅ No deletions or destructive operations

## Database Schema Changes

### Before

```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY,
  name TEXT,
  formatted_address TEXT,
  rating_avg NUMERIC,
  price_level INTEGER,
  -- ... other fields
);
```

### After

```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY,
  name TEXT,
  formatted_address TEXT,
  rating_avg NUMERIC,
  price_level INTEGER,
  description TEXT,  -- ← NEW: AI-generated description
  -- ... other fields
);
```

## Integration with Other Scripts

### Workflow

1. **Run places_data_script** → Fetch restaurants from Google
2. **Run update_image_metadata.py** → Annotate food images  
3. **Run generate_restaurant_descriptions.py** → Create descriptions ← YOU ARE HERE
4. **Use in app** → Display rich restaurant profiles

### Data Dependencies

```
restaurants (from Google Places)
    ↓
images (restaurant_id FK)
    ↓ (annotated by update_image_metadata.py)
images with dish/cuisine
    ↓
reviews (restaurant_id FK)
    ↓
restaurant.description ← GENERATED HERE
```

## Future Enhancements

Potential improvements:
- [ ] Include price range in description
- [ ] Mention specific ambiance details (outdoor seating, etc.)
- [ ] Add opening hours context (brunch, late night, etc.)
- [ ] Multi-language support
- [ ] Regenerate descriptions periodically as new reviews come in
- [ ] A/B test description variations

## Example Query to View Results

```sql
-- See generated descriptions
SELECT 
  name,
  rating_avg,
  price_level,
  LEFT(description, 100) as description_preview
FROM restaurants
WHERE description IS NOT NULL
ORDER BY rating_avg DESC
LIMIT 10;
```

## Infisical Integration

Follows the same pattern as `main.py` and `update_image_metadata.py`:

```python
# Auto-sync secrets on startup
sync_secrets()
load_dotenv()

# Secrets loaded from Infisical:
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
# - GEMINI_API_KEY
```

---

**Status:** ✅ **READY TO RUN**

**Impact:** Rich, engaging restaurant profiles for better UX  
**Safety:** Zero risk - only updates empty descriptions  
**Performance:** ~15-20 minutes for 234 restaurants

