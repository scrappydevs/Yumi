# 🚀 Quick Start Guide

Get restaurant data in 4 simple steps!

## Step 1: Install Dependencies

```bash
cd /Users/aarushagarwal/Documents/Programming/CurryRice/Aegis/dashboard/backend/places_data_script
pip install -r requirements.txt
```

## Step 2: Set Environment Variable

```bash
export SUPABASE_SERVICE_KEY="your-supabase-service-key"
```

Or if you already have it in your backend `.env` file, just:
```bash
source ../.env
```

## Step 3: Create Database Tables

Copy the contents of `setup_tables.sql` and run it in your Supabase SQL Editor.

This creates:
- `restaurants` table
- `restaurant_photos` table  
- `restaurant_reviews` table
- `restaurant-images` storage bucket

## Step 4: Run the Script!

### Initialize the grid
```bash
python data_script.py --init
```

This creates a grid of ~28 locations to search.
**Priority location (42.373479, -71.121816) is processed FIRST!**

### Check status
```bash
python data_script.py --status
```

### Process restaurants (start with 1 to test)
```bash
python data_script.py --cells 1
```

This will:
- Search for restaurants in the priority location
- Fetch details for each restaurant
- Download photos to Supabase Storage
- Save reviews
- Track progress

### Process more cells
```bash
python data_script.py --cells 5      # Process 5 cells
python data_script.py --cells all    # Process ALL remaining cells
```

## 📊 Monitor Progress

```bash
python data_script.py --status
```

Shows:
- Total grid cells
- Completed / Pending / Failed
- Total restaurants found
- Restaurants in database

## 📝 Output Files

- `grid_progress.txt` - Tracks which locations are done
- `places_fetch.log` - Detailed log of all operations

## ✅ What You'll Get

After processing all cells:
- ~500-800 restaurants in your database
- Photos for each restaurant (in Supabase Storage)
- Reviews for each restaurant
- Restaurant details (address, phone, website, hours, etc.)

## 💡 Tips

1. **Start small**: Process 1-2 cells first to test
2. **Check logs**: If something fails, check `places_fetch.log`
3. **Resume anytime**: Script tracks progress, safe to interrupt
4. **Cost**: Full area costs ~$32-63 in Google API calls

## 🆘 Troubleshooting

**"Grid file not found"**
→ Run `python data_script.py --init`

**"SUPABASE_SERVICE_KEY must be set"**
→ Export the environment variable

**"restaurants table may not exist"**
→ Run the SQL in `setup_tables.sql`

## 🎉 Done!

After completion, query your restaurants:
```sql
SELECT * FROM restaurants LIMIT 10;
```

Check photos:
- Supabase Dashboard → Storage → restaurant-images

