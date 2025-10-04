# Implicit Signals & Natural Language Preferences

## Overview

This system tracks user interactions with restaurants and automatically generates rich, natural language preference profiles. Instead of structured JSON preferences, users get wholesome, descriptive narratives like:

> "Aarush has a deep love for Indian cuisine, particularly dishes that balance spicy heat with sweet undertones. He's a social diner who frequently explores new restaurants with friends, especially trendy bars and late-night spots in the city. His all-time favorite dining experience was the fresh seafood at The Pier in New York..."

## Architecture

### 1. Data Collection (`user_interactions` table)

Every user action is tracked with appropriate signal weights:

| Interaction Type | Weight | Description |
|-----------------|--------|-------------|
| `search` | 1.0 | User searches for restaurants |
| `view` | 2.0 | User hovers/views restaurant details |
| `click` | 3.0 | User explicitly selects a restaurant |
| `maps_view` | 5.0 | User views in maps (strong intent) |
| `reservation` | 10.0 | User makes a reservation (HIGHEST - actual commitment) |

### 2. Tracking Points

#### Backend (Automatic)
- **Search queries** - tracked in `/api/restaurants/search` and `/api/restaurants/search-group`
- Includes query text, location, and metadata (e.g., group search with friend IDs)

#### Frontend (Manual via `trackInteraction()`)
- **Hover on restaurant card** → `trackView()`
- **Click restaurant card** → `trackClick()`
- **"View in Maps" button** → `trackMapsView()`
- **"Reserve Table" button** → `trackReservation()`

### 3. Preference Generation

Preferences are generated using LLM analysis of:
- Recent search queries (what they're looking for)
- Top cuisines (weighted by interaction strength)
- Favorite restaurants (visited/viewed most)
- Reservation patterns (strongest signal)

The LLM generates a ~150-250 word narrative that:
- Writes in third person (e.g., "Aarush loves...")
- Mentions specific restaurants and cuisines
- Describes dining patterns (time of day, social context)
- Updates existing preferences rather than replacing them

## Implementation Guide

### Step 1: Run Database Migration

```bash
# Create the user_interactions table
psql -d your_database -f add_user_interactions_table.sql
```

### Step 2: Backend Setup

The backend services are already integrated:

1. **`ImplicitSignalsService`** - tracks interactions
2. **`TasteProfileService`** - generates natural language preferences
3. **Endpoints**:
   - `POST /api/interactions/track` - manual tracking from frontend
   - `POST /api/preferences/update-from-signals` - trigger preference update

### Step 3: Frontend Integration

Use the tracking utilities in `lib/track-interaction.ts`:

```typescript
import { trackView, trackClick, trackMapsView, trackReservation } from '@/lib/track-interaction';

// When user hovers over restaurant
onMouseEnter={() => {
  trackView({
    place_id: restaurant.place_id,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    address: restaurant.address,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
  });
}}

// When user clicks restaurant
onClick={() => {
  trackClick({ ...restaurant });
}}

// When user opens maps
onClick={() => {
  trackMapsView({ ...restaurant });
  // ... open maps
}}

// When user makes reservation
onClick={() => {
  trackReservation({ ...restaurant });
  // ... navigate to reservations
}}
```

### Step 4: Preference Updates

Preferences auto-update in two ways:

1. **From reviews** (existing) - when user submits a review
2. **From implicit signals** (new) - call manually or set up cron job

Manual trigger:
```bash
curl -X POST http://localhost:8000/api/preferences/update-from-signals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "days=30"
```

## Database Schema

```sql
CREATE TABLE user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL, -- 'search', 'view', 'click', 'reservation', 'maps_view'
  
  -- Restaurant data
  restaurant_place_id text,
  restaurant_name text,
  restaurant_cuisine text,
  restaurant_address text,
  
  -- Search data
  search_query text,
  
  -- Weighting
  signal_weight real NOT NULL DEFAULT 1.0,
  
  -- Context
  latitude real,
  longitude real,
  created_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);
```

## Preference Storage

Preferences are stored in `profiles.preferences` as natural language text:

```
Old format (JSON):
{
  "cuisines": ["Italian", "Japanese"],
  "priceRange": "$$",
  "atmosphere": ["Casual", "Trendy"],
  "flavorNotes": ["spicy", "savory"]
}

New format (Natural language):
"Aarush has a deep love for Indian cuisine, particularly dishes that balance spicy heat with sweet undertones. He's a social diner who frequently explores new restaurants with friends..."
```

## Signal Weighting Logic

The system uses weighted aggregation:

```python
# Example: User interacts with 3 Italian restaurants
interactions = [
  ('Italian Restaurant A', 'view', weight=2.0),      # hover
  ('Italian Restaurant A', 'click', weight=3.0),     # click
  ('Italian Restaurant A', 'reservation', weight=10.0), # reservation
  ('Italian Restaurant B', 'view', weight=2.0),
  ('Italian Restaurant C', 'maps_view', weight=5.0),
]

# Italian cuisine total weight = 2 + 3 + 10 + 2 + 5 = 22.0
# This shows strong preference for Italian cuisine
```

## LLM Prompt Strategy

The preference generation prompt includes:
- Total interaction count (30 days)
- Reservation count (highest priority)
- Maps views (high priority)
- Top cuisines by weight
- Favorite restaurants by frequency
- Recent search queries

The LLM is instructed to:
1. Weight reservations > maps views > clicks > views > searches
2. Update existing preferences (don't replace)
3. Include specific restaurant names and locations
4. Describe social context and dining patterns
5. Keep it warm and personal (~150-250 words)

## Testing

1. **Track some interactions**:
```bash
# Search for Italian food
curl -X POST http://localhost:8000/api/restaurants/search \
  -F "query=Italian restaurant" \
  -F "latitude=42.3601" \
  -F "longitude=-71.0589"

# Track a click
curl -X POST http://localhost:8000/api/interactions/track \
  -F "interaction_type=click" \
  -F "restaurant_name=Joe's Pizza" \
  -F "cuisine=Italian" \
  -F "place_id=ChIJ..."
```

2. **Generate preferences**:
```bash
curl -X POST http://localhost:8000/api/preferences/update-from-signals \
  -F "days=30"
```

3. **Check preferences**:
```sql
SELECT preferences FROM profiles WHERE id = 'user-uuid';
```

## Migration Path

For existing users with JSON preferences:

```python
# One-time migration
await taste_profile_service.migrate_json_to_narrative(user_id)
```

This converts old JSON format to natural language while preserving all information.

## Future Enhancements

1. **Periodic auto-updates** - Cron job to update preferences nightly
2. **Collaborative filtering** - Learn from similar users
3. **Time-based patterns** - "Prefers brunch on weekends"
4. **Seasonal preferences** - "Enjoys outdoor seating in summer"
5. **Group dynamics** - "Often dines with friends who love Thai food"
6. **Dietary restrictions** - Infer from consistent patterns

## Troubleshooting

### Interactions not being tracked
- Check browser console for tracking errors
- Verify auth token is present
- Check backend logs for `[IMPLICIT SIGNALS]` messages

### Preferences not updating
- Check if user has recent interactions (< 30 days)
- Verify LLM service is working (`gemini_service`)
- Check backend logs for `[TASTE PROFILE]` messages

### Empty preferences after update
- User may have no interactions yet
- LLM may have failed (check logs)
- Old JSON preferences need migration

## Best Practices

1. **Track early, track often** - More data = better preferences
2. **Don't block on tracking** - All tracking is fire-and-forget
3. **Respect privacy** - Only track explicit user actions
4. **Periodic updates** - Update preferences weekly/monthly
5. **Combine signals** - Use both reviews AND implicit signals

## Performance

- **Tracking**: <10ms (async, non-blocking)
- **Preference generation**: ~2-5s (LLM call)
- **Database queries**: <50ms (indexed lookups)
- **Impact**: Zero user-facing latency (all background)

---

**Questions?** Check the code:
- Backend: `dashboard/backend/services/implicit_signals_service.py`
- Frontend: `dashboard/frontend/lib/track-interaction.ts`
- Taste Profile: `dashboard/backend/services/taste_profile_service.py`

