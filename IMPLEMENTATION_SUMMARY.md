# Implicit Signals Implementation Summary

## ✅ What Was Built

### 1. Database Layer
**File**: `add_user_interactions_table.sql`
- New `user_interactions` table to track all user behavior
- Indexed for fast lookups by user, type, and date
- RLS policies for security

### 2. Backend Services

#### ImplicitSignalsService (`services/implicit_signals_service.py`)
- Tracks all user interactions with appropriate weights
- `track_search()` - searches (weight: 1.0)
- `track_restaurant_interaction()` - views, clicks, maps, reservations
- `get_interaction_summary()` - aggregates patterns

#### TasteProfileService (updated)
- **NEW**: `update_profile_from_implicit_signals()` - generates natural language preferences from behavior
- **NEW**: `get_current_preferences_text()` - retrieves narrative preferences
- **NEW**: `migrate_json_to_narrative()` - one-time migration helper
- Updated `save_preferences()` to handle both JSON and text formats

### 3. API Endpoints (`main.py`)

```python
# Auto-tracking (already integrated)
POST /api/restaurants/search          # Tracks search queries
POST /api/restaurants/search-group    # Tracks group searches

# Manual tracking
POST /api/interactions/track          # Track clicks, views, maps, reservations

# Preference management
POST /api/preferences/update-from-signals  # Generate narrative from signals
```

### 4. Frontend Integration

#### Tracking Utility (`lib/track-interaction.ts`)
```typescript
trackView(restaurant)        // Hover on card (weight: 2.0)
trackClick(restaurant)       // Click card (weight: 3.0)
trackMapsView(restaurant)    // View in maps (weight: 5.0)
trackReservation(restaurant) // Make reservation (weight: 10.0)
```

#### Overview Page (updated)
- Tracks hover events on restaurant cards
- Tracks clicks on restaurant cards
- Tracks "View in Maps" button clicks
- Tracks "Reserve Table" button clicks

## 🎯 How It Works

### Signal Weighting
```
search (1.0) < view (2.0) < click (3.0) < maps_view (5.0) < reservation (10.0)
```

Reservations are the strongest signal because they show actual commitment.

### Preference Generation

**Input**: Last 30 days of interactions
**Process**: LLM analyzes patterns and generates narrative
**Output**: Natural language like:

> "Aarush has a deep love for Indian cuisine, particularly dishes that balance spicy heat with sweet undertones. He's a social diner who frequently explores new restaurants with friends, especially trendy bars and late-night spots. His favorite experience was the seafood at The Pier in NY..."

### Database Storage

**Old format** (still supported):
```json
{
  "cuisines": ["Italian", "Japanese"],
  "priceRange": "$$",
  "atmosphere": ["Casual"]
}
```

**New format** (preferred):
```
"Aarush loves Indian food that is spicy and sweet, often goes out with friends at night to nice bars. Favorite restaurant ever was the seafood at the pier in NY..."
```

## 🚀 Quick Start

### 1. Run Migration
```bash
cd /Users/aarushagarwal/Documents/Programming/CurryRice/Yummy
psql -d your_database -f add_user_interactions_table.sql
```

### 2. Test Tracking (Backend Running)
```bash
# Make a search (auto-tracked)
curl -X POST http://localhost:8000/api/restaurants/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "query=spicy Thai food" \
  -F "latitude=42.3601" \
  -F "longitude=-71.0589"

# Click a restaurant (manual track)
curl -X POST http://localhost:8000/api/interactions/track \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "interaction_type=click" \
  -F "restaurant_name=Thai Basil" \
  -F "cuisine=Thai" \
  -F "place_id=ChIJ..."
```

### 3. Generate Preferences
```bash
curl -X POST http://localhost:8000/api/preferences/update-from-signals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "days=30"
```

### 4. View Preferences
```sql
SELECT preferences FROM profiles WHERE id = 'your-user-id';
```

## 📊 What Gets Tracked

### Automatically (Backend)
- ✅ Search queries (query text, location, group members if applicable)

### From Frontend (when user interacts)
- ✅ Hover on restaurant cards
- ✅ Click restaurant cards  
- ✅ "View in Maps" clicks
- ✅ "Reserve Table" clicks

### Future (Not yet implemented)
- ⏳ Actual reservation confirmations (via reservation flow)
- ⏳ Time-based patterns (breakfast vs. dinner preferences)
- ⏳ Social patterns (solo vs. group dining)

## 🔧 Configuration

### Signal Weights
Edit in `services/implicit_signals_service.py`:
```python
SIGNAL_WEIGHTS = {
    'search': 1.0,
    'view': 2.0,
    'click': 3.0,
    'maps_view': 5.0,
    'reservation': 10.0,
}
```

### Preference Update Frequency
Currently manual. To automate:
```python
# Add to cron or background task
@scheduler.scheduled_job('cron', day='*/7')  # Weekly
async def update_all_preferences():
    for user in active_users:
        await taste_profile_service.update_profile_from_implicit_signals(user.id)
```

### LLM Prompt
Customize in `services/taste_profile_service.py`:
- Method: `_build_implicit_signals_prompt()`
- Adjust word count, style, context

## 🐛 Debugging

### Enable debug logs
```bash
# Backend logs show all tracking
tail -f backend_logs.txt | grep "\[IMPLICIT SIGNALS\]"
tail -f backend_logs.txt | grep "\[TASTE PROFILE\]"
```

### Check interactions
```sql
SELECT 
  interaction_type,
  restaurant_name,
  search_query,
  signal_weight,
  created_at
FROM user_interactions
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 20;
```

### Verify tracking from frontend
- Open browser console
- Look for `[Track]` messages
- Should see "Track click on Restaurant Name" etc.

## 📈 Analytics Queries

### Most searched cuisines
```sql
SELECT 
  restaurant_cuisine,
  SUM(signal_weight) as total_weight,
  COUNT(*) as interaction_count
FROM user_interactions
WHERE user_id = 'user-id' AND restaurant_cuisine IS NOT NULL
GROUP BY restaurant_cuisine
ORDER BY total_weight DESC;
```

### Reservation patterns
```sql
SELECT 
  restaurant_name,
  COUNT(*) as reservation_count,
  MAX(created_at) as last_reservation
FROM user_interactions
WHERE user_id = 'user-id' AND interaction_type = 'reservation'
GROUP BY restaurant_name
ORDER BY reservation_count DESC;
```

### Search query analysis
```sql
SELECT 
  search_query,
  COUNT(*) as search_count,
  MAX(created_at) as last_searched
FROM user_interactions
WHERE user_id = 'user-id' AND interaction_type = 'search'
GROUP BY search_query
ORDER BY search_count DESC
LIMIT 10;
```

## ✨ Next Steps

### Immediate
1. Run database migration
2. Test tracking in development
3. Generate sample preferences
4. Verify narrative quality

### Short-term
1. Add tracking to other pages (spatial view, reservations)
2. Set up periodic preference updates (weekly cron)
3. Add analytics dashboard to view interaction patterns

### Long-term
1. Collaborative filtering (learn from similar users)
2. Time-based patterns ("prefers brunch on weekends")
3. Seasonal adjustments ("likes outdoor seating in summer")
4. Group dining insights ("often dines with friends who love Thai")

## 📝 Files Changed/Created

### New Files
- `add_user_interactions_table.sql` - Database migration
- `dashboard/backend/services/implicit_signals_service.py` - Tracking service
- `dashboard/frontend/lib/track-interaction.ts` - Frontend utilities
- `IMPLICIT_SIGNALS_GUIDE.md` - Comprehensive documentation
- `IMPLEMENTATION_SUMMARY.md` - This file

### Modified Files
- `dashboard/backend/main.py` - Added endpoints and search tracking
- `dashboard/backend/services/taste_profile_service.py` - Natural language generation
- `dashboard/frontend/app/(dashboard)/overview/page.tsx` - Integrated tracking

## 🎉 Success Metrics

After implementation, you should see:
1. **Interactions being tracked** in `user_interactions` table
2. **Search logs** showing tracking confirmations
3. **Natural language preferences** in `profiles.preferences`
4. **No user-facing latency** (all tracking is async)

---

**Ready to deploy!** 🚀

Run the migration, test locally, then deploy to production. The system is designed to fail gracefully - if tracking fails, the user experience is unaffected.

