# Quick Start: Image Metadata Update

Update 575 images with missing dish/cuisine metadata using AI! 🚀

## Prerequisites

**Infisical CLI** (for secret management)

Install if needed:
```bash
brew install infisical/get-cli/infisical
```

Make sure your Infisical secrets include:
- `GEMINI_API_KEY` - Get from: https://aistudio.google.com/app/apikey
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

## Setup (30 seconds)

```bash
# 1. Navigate to backend directory
cd dashboard/backend

# 2. Run verification (automatically syncs from Infisical)
python3 verify_image_update_setup.py
```

The script will:
- 🔄 Sync secrets from Infisical to `.env`
- ✅ Verify all required environment variables
- ✅ Check database connection
- ✅ Test Gemini API access
- ✅ Count images needing updates

## Run the Script

```bash
python3 update_image_metadata.py
```

That's it! The script will:
- Process 575 images automatically
- Download each image
- Analyze with Gemini Flash AI
- Update database with dish/cuisine
- Show real-time progress
- Log everything to `image_metadata_update.log`

## Expected Output

```
==================================================
Starting Image Metadata Update Script
==================================================
Found 575 images missing metadata

Processing 575 images...

[1/575] Processing image...
============================================================
Processing image 47
URL: https://storage.supabase.co/...
Current: dish='None', cuisine='None'
Downloading image...
Downloaded 245678 bytes
Analyzing with Gemini Flash...
Analysis: dish='Margherita Pizza', cuisine='Italian'
✅ Updated image 47: dish='Margherita Pizza', cuisine='Italian'
✅ Successfully processed image 47

[continues for all images...]
```

## Estimated Time

With default settings (1 image/second):
- **575 images** ≈ **10 minutes**

Want it faster? Edit the script:
```python
updater.run(delay_seconds=0.5)  # 2 images/second = 5 minutes
```

## Cost

Gemini Flash is essentially free:
- Free tier: 15 requests/minute, 1M tokens/minute  
- 575 images: Well within free quota ✅
- Paid tier: ~$0.006 total

## Progress Tracking

Watch real-time progress:
```bash
# In another terminal
tail -f image_metadata_update.log
```

## Interrupt & Resume

Safe to interrupt anytime (Ctrl+C):
- Already-processed images are saved
- Re-run to continue where you left off
- Script only processes images with missing data

## Troubleshooting

### "Could not sync from Infisical"
Make sure Infisical CLI is installed and you're logged in:
```bash
brew install infisical/get-cli/infisical
infisical login
```

### "GEMINI_API_KEY not set"
Add it to your Infisical secrets in the `dev` environment:
- Go to your Infisical project
- Add `GEMINI_API_KEY` secret
- Re-run the script (it will sync automatically)

### Check what's happening
```bash
# View log file
tail -n 50 image_metadata_update.log

# Or watch live
tail -f image_metadata_update.log
```

### Verify it worked
After running, check in your Supabase dashboard or:
```sql
SELECT COUNT(*) FROM images WHERE dish IS NOT NULL AND cuisine IS NOT NULL;
-- Should show increased count
```

## What Gets Updated

Before:
```
dish: NULL
cuisine: NULL
```

After:
```
dish: "Spaghetti Carbonara"
cuisine: "Italian"
```

## Safety

- ✅ Only updates NULL fields (won't overwrite existing data)
- ✅ No deletions or destructive operations
- ✅ Validates all data before updating
- ✅ Can safely run multiple times

## Full Documentation

For detailed info, see: `IMAGE_METADATA_UPDATE.md`

---

**Ready? Let's go!**

```bash
export GEMINI_API_KEY="your-key"
python3 update_image_metadata.py
```

