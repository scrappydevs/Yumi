# Image Metadata Update Script

This script analyzes images in the database and automatically populates missing `dish` and `cuisine` fields using Google Gemini Flash AI.

## What It Does

1. **Fetches** all images from the `images` table that are missing `dish` or `cuisine` metadata
2. **Downloads** each image from its stored URL
3. **Analyzes** the image using Gemini Flash to identify:
   - Dish name (e.g., "Spaghetti Carbonara", "California Roll")
   - Cuisine type (from a predefined list of 54 cuisines)
4. **Updates** the database with the extracted metadata

## Prerequisites

### Infisical CLI (Secret Management)

This script uses Infisical to manage secrets (following the same pattern as `main.py`).

Install Infisical CLI:
```bash
brew install infisical/get-cli/infisical
infisical login
```

### Required Secrets in Infisical

Make sure your Infisical project (dev environment) includes:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key
- `GEMINI_API_KEY` - Google Gemini API key (get from https://aistudio.google.com/app/apikey)

The script automatically syncs these to a `.env` file on startup.

### Python Dependencies

Install required packages:

```bash
cd dashboard/backend
pip install -r requirements.txt
```

Required packages:
- `supabase` - Database client
- `google-generativeai` - Gemini API
- `requests` - Image downloading
- `Pillow` - Image processing

## Usage

### Basic Usage

```bash
cd dashboard/backend
python update_image_metadata.py
```

### What Happens

The script will:
- Log all activity to `image_metadata_update.log`
- Print progress to the console
- Show detailed info for each image:
  - Current metadata status
  - Download confirmation
  - Gemini analysis results
  - Update success/failure

### Example Output

```
==================================================
Starting Image Metadata Update Script
==================================================
Found 150 images missing metadata

Processing 150 images...

[1/150] Processing image...
============================================================
Processing image 42
URL: https://storage.supabase.co/images/abc123.jpg
Current: dish='None', cuisine='None'
Downloading image...
Downloaded 245678 bytes
Analyzing with Gemini Flash...
Analysis: dish='Margherita Pizza', cuisine='Italian'
✅ Updated image 42: dish='Margherita Pizza', cuisine='Italian'
✅ Successfully processed image 42

[10/150] Progress checkpoint...
============================================================
PROGRESS: 10/150 images processed
Success: 9, Failed: 1
============================================================

... (continues for all images)

============================================================
FINAL SUMMARY
============================================================
Total images processed: 150
✅ Successful updates: 145
❌ Failed updates: 5
Success rate: 96.7%
============================================================
```

## Configuration

You can customize the script behavior by modifying the `run()` parameters in `main()`:

```python
updater.run(
    batch_size=10,        # Progress log frequency
    delay_seconds=1.0     # Delay between API calls (rate limiting)
)
```

### Parameters

- **`batch_size`**: Number of images to process before logging progress (default: 10)
- **`delay_seconds`**: Seconds to wait between Gemini API calls to avoid rate limits (default: 1.0)

## Allowed Cuisines

The script validates cuisine types against this list:

American, Italian, French, Chinese, Japanese, Mexican, Indian, Thai, Greek, Spanish, Korean, Vietnamese, Lebanese, Turkish, Moroccan, Ethiopian, Brazilian, Peruvian, Jamaican, Cuban, German, Polish, Russian, Swedish, Portuguese, Filipino, Malaysian, Indonesian, Singaporean, Egyptian, Iranian, Afghan, Nepalese, Burmese, Cambodian, Georgian, Armenian, Argentinian, Colombian, Venezuelan, Chilean, Ecuadorian, Bolivian, Uruguayan, Paraguayan, Hungarian, Austrian, Swiss, Belgian, Dutch, Danish, Norwegian, Finnish, Icelandic

## Behavior Details

### Smart Updates

- Only updates fields that are currently `NULL`
- Skips images that already have both `dish` and `cuisine` set
- Won't overwrite existing metadata

### Error Handling

- Gracefully handles download failures
- Continues processing if one image fails
- Logs all errors to file and console
- Provides detailed error messages

### Rate Limiting

- Built-in delay between API calls (default 1 second)
- Prevents hitting Gemini API rate limits
- Adjustable via `delay_seconds` parameter

## Troubleshooting

### "Could not sync from Infisical"

Make sure Infisical CLI is installed and you're logged in:
```bash
brew install infisical/get-cli/infisical
infisical login
```

Verify you have access to the correct project and environment.

### "GEMINI_API_KEY environment variable not set"

Add the secret to your Infisical project (dev environment):
1. Go to your Infisical dashboard
2. Navigate to your project
3. Select `dev` environment
4. Add `GEMINI_API_KEY` with your API key value
5. Re-run the script (it will sync automatically)

### "Failed to download image"

- Image URL might be expired or invalid
- Check network connectivity
- Verify Supabase storage permissions

### "Gemini returned invalid cuisine"

- The AI may have returned a cuisine not in the allowed list
- Script will log a warning and set cuisine to `None`
- This is expected for ambiguous/unclear images

### High Failure Rate

If many images are failing:
1. Check Gemini API quota/billing
2. Verify image URLs are accessible
3. Review `image_metadata_update.log` for specific errors
4. Consider increasing `delay_seconds` to avoid rate limits

## Database Schema

The script updates the `images` table:

```sql
TABLE images (
  id bigint PRIMARY KEY,
  uuid uuid,
  image_url text,
  description text,
  dish text,          -- ← Updated by script
  cuisine text,       -- ← Updated by script
  restaurant_id uuid,
  user_id uuid,
  timestamp timestamptz,
  created_at timestamptz
)
```

## Performance

- Processes ~3600 images/hour (1 image/second with default delay)
- Gemini Flash is fast and cost-effective
- Can adjust `delay_seconds` to speed up (but watch rate limits)

## Cost Estimation

Gemini Flash pricing (as of 2024):
- Free tier: 15 requests/minute, 1M tokens/minute
- Paid: ~$0.00001 per image analysis

For 1000 images: ~$0.01 (essentially free with generous quotas)

## Safety Features

- ✅ Read-only operations (except updates to `images` table)
- ✅ No deletions or destructive operations
- ✅ Validates all data before updating
- ✅ Comprehensive error handling
- ✅ Can be safely interrupted (Ctrl+C)

## Re-running the Script

Safe to run multiple times:
- Only processes images with missing metadata
- Won't duplicate updates
- Picks up where it left off if interrupted

## Support

For issues or questions:
1. Check `image_metadata_update.log` for detailed error logs
2. Verify all environment variables are set
3. Ensure Gemini API key is valid and has quota remaining

