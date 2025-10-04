# Data Collection & Processing Pipeline

## Overview

The `orchestrate_data_pipeline.py` script automates the complete restaurant data collection and processing workflow by running three sequential processes:

1. **Data Fetching** (`data_script.py`) - Fetches restaurant data from Google Places API
2. **Image Metadata Update** (`update_image_metadata.py`) - Analyzes images and populates dish/cuisine info
3. **Description Generation** (`generate_restaurant_descriptions.py`) - Generates AI-powered restaurant profiles

## Quick Start

### Check Status Only

```bash
python orchestrate_data_pipeline.py --status-only
```

This will:
- Display current grid processing status
- Show how many cells are pending/completed
- Show restaurant counts in the database

### Process Specific Number of Cells

```bash
python orchestrate_data_pipeline.py --cells 5
```

This will:
1. Check status
2. Fetch data for 5 grid cells
3. Update metadata for any new images
4. Generate descriptions for any new restaurants

### Process All Remaining Cells

```bash
python orchestrate_data_pipeline.py --cells all
```

**⚠️ Warning:** This will process ALL pending cells. Use with caution - it may take hours!

## Pipeline Steps

### Step 1: Status Check
- Verifies grid initialization
- Shows processing statistics
- Displays database counts

### Step 2: Data Fetching
- Processes N grid cells from Google Places API
- Fetches restaurant details, photos, and reviews
- Uploads images to Supabase storage
- Saves data to database

### Step 3: Image Metadata Update
- Analyzes images using Gemini AI
- Extracts dish names and cuisine types
- Only processes images missing metadata
- Skips non-food images

### Step 4: Description Generation
- Generates restaurant profiles (cuisine, atmosphere, description)
- Uses food images, location images, and reviews
- Validates that places are actual food establishments
- Creates 2-3 sentence engaging descriptions

## Output & Logging

### Console Output
The script provides colored, formatted output showing:
- Progress through each step
- Real-time status updates
- Summary statistics at completion

### Log Files
Three separate log files are created:
- `data_pipeline.log` - Orchestrator logs
- `places_fetch.log` - Data fetching logs
- `image_metadata_update.log` - Image analysis logs
- `restaurant_description_generation.log` - Description generation logs

## Error Handling

If any step fails, the pipeline stops immediately:
- **Status check fails**: Pipeline stops before fetching data
- **Data fetch fails**: Pipeline stops before image processing
- **Image update fails**: Pipeline stops before description generation
- **Description generation fails**: Pipeline reports failure

## Requirements

All scripts must be in the same directory and executable:
- `data_script.py`
- `update_image_metadata.py`
- `generate_restaurant_descriptions.py`

Environment variables must be set (via Infisical or `.env`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_PLACES_API_KEY`

## Tips

### Development/Testing
```bash
# Process small batches for testing
python orchestrate_data_pipeline.py --cells 1
python orchestrate_data_pipeline.py --cells 2
```

### Production Data Collection
```bash
# Process in moderate batches to monitor progress
python orchestrate_data_pipeline.py --cells 10

# Check status between runs
python orchestrate_data_pipeline.py --status-only
```

### Resuming After Interruption
The pipeline is resumable:
- Data fetching: Tracks processed cells in `grid_progress.txt`
- Image updates: Only processes images missing metadata
- Description generation: Only processes unprocessed restaurants

You can safely re-run the pipeline - it will skip already-processed data.

## Interrupting the Pipeline

Press `Ctrl+C` to interrupt. The pipeline will:
- Stop gracefully
- Log the interruption
- Exit with status code 130

Any completed steps are saved, so you can resume later.

## Exit Codes

- `0` - Success
- `1` - Pipeline failed
- `130` - User interrupted (Ctrl+C)

## Example Session

```bash
$ python orchestrate_data_pipeline.py --cells 5

🚀 DATA COLLECTION & PROCESSING PIPELINE

Pipeline Configuration:
  📍 Working Directory: /path/to/backend
  📊 Cells to Process: 5
  ⏰ Start Time: 2025-10-04 14:30:00

[Step 1/4] Checking Data Fetching Status
──────────────────────────────────────────────────────────────────────

📊 RESTAURANT DATA FETCHING STATUS
===========================================================
Total Grid Cells:     100
  ✅ Completed:       45
  ⏳ Pending:         50
  ⚠️  Failed:          5
  🔄 Processing:      0

🍽️  Total Places Found: 1234
💾 Restaurants in DB:  1234
===========================================================

✅ Status Check completed successfully

[Step 2/4] Fetching Restaurant Data (5 cells)
──────────────────────────────────────────────────────────────────────

📋 Processing 5 grid cell(s)
...
✅ Data Fetching completed successfully

[Step 3/4] Updating Image Metadata
──────────────────────────────────────────────────────────────────────

Processing 23 images...
...
✅ Image Metadata Update completed successfully

[Step 4/4] Generating Restaurant Descriptions
──────────────────────────────────────────────────────────────────────

Processing 12 restaurants...
...
✅ Description Generation completed successfully

✅ PIPELINE COMPLETED SUCCESSFULLY

Pipeline Summary:
  ✅ Data fetched for 5 cells
  ✅ Image metadata updated
  ✅ Restaurant descriptions generated
  ⏱️  Total Duration: 0:15:32
  🏁 Completed: 2025-10-04 14:45:32
```

## Troubleshooting

### "Status check failed"
- Verify grid is initialized: `python data_script.py --init`
- Check database connectivity

### "Required script not found"
- Ensure all scripts are in the same directory
- Verify file names match exactly

### "Rate limit errors"
- The pipeline includes built-in delays
- Consider reducing batch size
- Check API quotas for Google Places and Gemini

### "Environment variables not set"
- Run: `infisical export --env=dev --format=dotenv > .env`
- Or manually set required environment variables

