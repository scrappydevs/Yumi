# Restaurant Data Fetcher

Automated script to fetch restaurant data from Google Places API and store it in Supabase.

## 🎯 Overview

This script:
- Divides a geographic area into overlapping grid cells
- Fetches restaurants from Google Places API for each cell
- Retrieves detailed information, photos, and reviews
- Stores everything in Supabase database
- Downloads photos to Supabase Storage
- Tracks progress to allow resuming

## 📋 Setup

### 1. Install Dependencies

```bash
cd dashboard/backend/places_data_script
pip install -r requirements.txt
```

### 2. Set Environment Variable

```bash
export SUPABASE_SERVICE_KEY="your-service-key-here"
```

Or add to your `.env` file in `dashboard/backend/`:
```env
SUPABASE_SERVICE_KEY=your-service-key-here
```

### 3. Create Database Tables

Run the SQL in `setup_tables.sql` in your Supabase SQL Editor:
- Creates `restaurants` table
- Creates `restaurant_photos` table
- Creates `restaurant_reviews` table
- Creates indices and RLS policies
- Creates storage bucket `restaurant-images`

### 4. Configure (Optional)

Edit `config.py` if you want to change:
- Search radius (default: 500m)
- Bounding box coordinates
- API rate limits
- Photo settings

## 🚀 Usage

### Initialize Grid

First, generate the grid of locations to process:

```bash
python data_script.py --init
```

This creates `grid_progress.txt` with ~28 grid cells.
**The grid cell closest to 42.373479, -71.121816 will be first!**

### Check Status

View current progress:

```bash
python data_script.py --status
```

Output:
```
============================================================
📊 RESTAURANT DATA FETCHING STATUS
============================================================
Total Grid Cells:     28
  ✅ Completed:       0
  ⏳ Pending:         28
  ⚠️  Failed:          0
  🔄 Processing:      0

🍽️  Total Places Found: 0
💾 Restaurants in DB:  0
============================================================
```

### Process Grid Cells

Process a specific number of cells:

```bash
python data_script.py --cells 5
```

Process all remaining cells:

```bash
python data_script.py --cells all
```

### Resume Processing

The script automatically tracks progress. If interrupted, simply run again:

```bash
python data_script.py --cells 5
```

It will continue where it left off!

## 📊 What Gets Stored

### Restaurants Table
- Place ID (Google's unique identifier)
- Name, address, coordinates
- Phone, website
- Rating, review count, price level
- Business type, opening hours, status

### Restaurant Photos Table
- Photo URLs (stored in Supabase Storage)
- Photo dimensions
- Attribution information
- Linked to restaurant

### Restaurant Reviews Table
- Author name and profile
- Rating (1-5)
- Review text
- Timestamp
- Linked to restaurant

## 🔍 Grid Configuration

**Bounding Box:**
- Top-Left: 42.389825, -71.148797
- Bottom-Right: 42.358788, -71.075420
- Center: 42.3743065, -71.1121085
- Area: ~18 km²

**Grid Settings:**
- Search radius: 500 meters per cell
- Overlap: 70% (ensures no gaps)
- Total cells: ~28
- Priority cell: Closest to 42.373479, -71.121816

## 📝 Files Created

- `grid_progress.txt` - Tracks which cells are processed
- `places_fetch.log` - Detailed execution log

## 💰 Cost Estimation

**Google Places API:**
- ~28 Nearby Search calls: ~$0.90
- ~500-800 Place Details calls: ~$17-27
- ~2000-5000 Photo downloads: ~$14-35
- **Total: ~$32-63** for complete area

## 🛠️ Troubleshooting

### "Grid file not found"
Run `python data_script.py --init` first.

### "SUPABASE_SERVICE_KEY must be set"
Export the environment variable or add to `.env` file.

### "restaurants table may not exist"
Run the SQL in `setup_tables.sql` in Supabase.

### API Rate Limiting
The script has built-in rate limiting (5 req/sec) and retry logic.
If you hit quota limits, wait or reduce batch size.

### Failed Cells
Check the log file `places_fetch.log` for errors.
Failed cells can be retried by running the script again.

## 📈 Example Workflow

```bash
# 1. Initialize
python data_script.py --init

# 2. Check what we're about to do
python data_script.py --status

# 3. Process first 5 cells (test run)
python data_script.py --cells 5

# 4. Check progress
python data_script.py --status

# 5. Process remaining cells
python data_script.py --cells all

# 6. Final status check
python data_script.py --status
```

## 🔧 Advanced

### Changing Priority Location

Edit `PRIORITY_LOCATION` in `config.py`:
```python
PRIORITY_LOCATION = (42.373479, -71.121816)
```

Then re-initialize:
```bash
python data_script.py --init
```

### Changing Search Radius

Edit `SEARCH_RADIUS_METERS` in `config.py`:
```python
SEARCH_RADIUS_METERS = 750  # Larger radius = fewer cells
```

### Custom Bounding Box

Edit `TOP_LEFT` and `BOTTOM_RIGHT` in `config.py`:
```python
TOP_LEFT = (42.389825, -71.148797)
BOTTOM_RIGHT = (42.358788, -71.075420)
```

## 📚 Code Structure

```
places_data_script/
├── config.py           # Configuration and constants
├── models.py           # Data models (Restaurant, Photo, etc.)
├── grid_manager.py     # Grid generation and tracking
├── places_api.py       # Google Places API wrapper
├── database.py         # Supabase database operations
├── data_script.py      # Main orchestrator (run this)
├── requirements.txt    # Python dependencies
├── setup_tables.sql    # Database schema
└── README.md          # This file
```

## ✅ Success Indicators

- Grid cells marked as "completed" in `grid_progress.txt`
- Photos appearing in Supabase Storage bucket `restaurant-images`
- Restaurants appearing in `restaurants` table
- Reviews and photos linked to restaurants
- Log file showing successful operations

## 🎉 After Completion

Once all cells are processed, you'll have:
- Comprehensive restaurant database for the area
- Photos for each restaurant (stored in Supabase)
- Google reviews for each restaurant
- Data ready for your application to query and display

