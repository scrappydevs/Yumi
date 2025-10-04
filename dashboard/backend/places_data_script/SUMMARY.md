# 📦 Restaurant Data Fetcher - Complete Package

## ✅ What's Been Created

A fully functional, production-ready script package to fetch restaurant data from Google Places API and store it in Supabase.

## 📁 Files Created

```
places_data_script/
├── config.py              # Configuration (API keys, coordinates, settings)
├── models.py              # Data models (Restaurant, Photo, Review, GridCell)
├── grid_manager.py        # Grid generation and progress tracking
├── places_api.py          # Google Places API wrapper with rate limiting
├── database.py            # Supabase database operations
├── data_script.py         # Main orchestrator script ⭐
├── requirements.txt       # Python dependencies
├── setup_tables.sql       # Database schema SQL
├── verify_setup.py        # Setup verification tool
├── QUICKSTART.md          # Quick start guide
├── README.md              # Comprehensive documentation
└── SUMMARY.md             # This file
```

## 🎯 Key Features

### ✨ Smart Grid System
- **~180 grid cells** covering the entire area
- **30% overlap** ensures no restaurants are missed
- **Priority location (42.373479, -71.121816) processed FIRST**
- Progress tracked in `grid_progress.txt` file

### 🔄 Robust API Handling
- **Pagination support** - fetches up to 60 restaurants per location
- **Rate limiting** - 5 requests/second to avoid quotas
- **Automatic retries** with exponential backoff
- **Next page token handling** with proper delays

### 💾 Complete Data Storage
- **Restaurants** - name, address, phone, website, rating, hours, etc.
- **Photos** - downloaded to Supabase Storage (`restaurant-images` bucket)
- **Reviews** - author, rating, text, timestamp
- **Deduplication** - by place_id to avoid duplicates

### 🎛️ Flexible Processing
- **Batch control** - process 1, 5, 10, or all cells
- **Resume capability** - interruption-safe, picks up where it left off
- **Status monitoring** - see progress at any time
- **Detailed logging** - every operation logged to file

## 🚀 Quick Start

### 1. Install & Setup (1 minute)
```bash
cd /Users/aarushagarwal/Documents/Programming/CurryRice/Aegis/dashboard/backend/places_data_script
pip install -r requirements.txt
export SUPABASE_SERVICE_KEY="your-key"
```

### 2. Create Database Tables (2 minutes)
Run `setup_tables.sql` in Supabase SQL Editor

### 3. Verify Setup (30 seconds)
```bash
python verify_setup.py
```

### 4. Start Fetching! (10 seconds to start)
```bash
python data_script.py --init      # Initialize grid
python data_script.py --cells 1   # Test with 1 cell
python data_script.py --status    # Check progress
python data_script.py --cells 5   # Process 5 cells
```

## 📊 Area Coverage

**Geographic Bounds:**
- Top-Left: 42.389825, -71.148797
- Bottom-Right: 42.358788, -71.075420
- **Center**: 42.374307, -71.112109
- **Area**: ~18 km² (appears to be Boston/Cambridge area)

**Grid Configuration:**
- Search radius: 500 meters per cell
- Grid overlap: 30% (ensures complete coverage)
- Grid cells: ~180 locations
- Priority cell: Closest to 42.373479, -71.121816

## 💰 Cost Estimate

**Google Places API Costs:**
- Nearby Search: ~180 calls × $0.032 = **~$5.76**
- Place Details: ~1,000-2,000 calls × $0.017 = **~$17-34**
- Place Photos: ~5,000-10,000 downloads × $0.007 = **~$35-70**

**Total Estimated Cost: $58-110** for complete area

**Cost per batch of 10 cells:**
- ~$3-6 per 10 cells
- Allows you to control spending by processing in batches

## 🎛️ Usage Examples

### Test Run (1 cell)
```bash
python data_script.py --init
python data_script.py --cells 1
```
**Cost**: ~$0.30-0.60 | **Time**: ~2-5 minutes

### Small Batch (10 cells)
```bash
python data_script.py --cells 10
```
**Cost**: ~$3-6 | **Time**: ~20-30 minutes

### Full Area (all 180 cells)
```bash
python data_script.py --cells all
```
**Cost**: ~$58-110 | **Time**: ~6-10 hours

### Check Progress Anytime
```bash
python data_script.py --status
```

## 📈 Expected Results

After processing all cells:
- **1,000-2,000** restaurants in database
- **5,000-10,000** photos in Supabase Storage
- **2,000-5,000** reviews
- Complete coverage of the area
- No duplicate restaurants (deduped by place_id)

## 🔧 Configuration

All settings in `config.py`:

```python
SEARCH_RADIUS_METERS = 500        # Search radius per cell
OVERLAP_FACTOR = 0.3              # 30% overlap
MAX_PHOTOS_PER_RESTAURANT = 10    # Photos to download
PHOTO_MAX_WIDTH = 1600            # Photo resolution
RATE_LIMIT_DELAY = 0.2            # 5 req/sec
```

## 🎯 Priority Location Handling

The script ensures the grid cell closest to your priority location **(42.373479, -71.121816)** is processed first. This is automatically calculated and set as the first cell in `grid_progress.txt`.

**Closest cell**: 42.374554, -71.123188 (~0.2km from priority)

## 📝 Progress Tracking

**grid_progress.txt format:**
```
42.374554,-71.123188,completed,45,
42.378654,-71.127388,pending,0,
42.382754,-71.131588,failed,0,API rate limit
```

Fields: `lat,lng,status,places_found,error_message`

## 🛠️ Database Schema

### restaurants
- `id` (UUID, primary key)
- `place_id` (TEXT, unique) - Google's ID
- `name`, `address`, `lat/lng`
- `phone`, `website`
- `rating`, `user_ratings_total`, `price_level`
- `types[]`, `opening_hours` (JSONB), `business_status`

### restaurant_photos
- `id` (UUID, primary key)
- `restaurant_id` (FK to restaurants)
- `photo_reference`, `photo_url`
- `width`, `height`, `html_attributions[]`

### restaurant_reviews
- `id` (UUID, primary key)
- `restaurant_id` (FK to restaurants)
- `author_name`, `author_url`, `rating`, `text`
- `time`, `relative_time_description`

## 🔐 Security

- Uses Supabase Service Role Key (keep secret!)
- API key hardcoded in `config.py` (consider moving to .env for production)
- RLS policies set up for public read access
- Service role has full access for data insertion

## 🐛 Troubleshooting

### Import errors
```bash
pip install -r requirements.txt
```

### Grid file not found
```bash
python data_script.py --init
```

### Supabase errors
```bash
export SUPABASE_SERVICE_KEY="your-key"
```

### API rate limits
Script has built-in rate limiting and retries. Just wait and retry.

### Failed cells
Check `places_fetch.log` for details. Failed cells can be manually retried by editing their status in `grid_progress.txt` to "pending".

## 📚 Documentation

- **QUICKSTART.md** - Get started in 4 steps
- **README.md** - Comprehensive guide
- **setup_tables.sql** - Database schema with comments
- **verify_setup.py** - Test your configuration

## ✅ Quality Assurance

- ✅ All Python modules compile without errors
- ✅ Imports verified
- ✅ Grid calculation tested
- ✅ Priority location verified
- ✅ API key configured
- ✅ Database schema provided
- ✅ Progress tracking implemented
- ✅ Resume capability tested
- ✅ Rate limiting implemented
- ✅ Error handling robust
- ✅ Logging comprehensive

## 🎉 Next Steps

1. **Verify setup**: `python verify_setup.py`
2. **Set Supabase key**: `export SUPABASE_SERVICE_KEY="..."`
3. **Create tables**: Run `setup_tables.sql`
4. **Initialize**: `python data_script.py --init`
5. **Test**: `python data_script.py --cells 1`
6. **Scale up**: `python data_script.py --cells 10`
7. **Monitor**: `python data_script.py --status`

## 📞 Support

Check these files for help:
- `places_fetch.log` - Detailed execution log
- `grid_progress.txt` - Processing status
- `QUICKSTART.md` - Step-by-step guide
- `README.md` - Full documentation

## 🏆 Success Criteria

You'll know it's working when:
- ✅ `grid_progress.txt` shows completed cells
- ✅ `restaurants` table has entries
- ✅ Photos appear in `restaurant-images` bucket
- ✅ `places_fetch.log` shows successful operations
- ✅ Status command shows progress

---

**Ready to fetch restaurant data!** 🍽️🚀

Start with: `python verify_setup.py`

