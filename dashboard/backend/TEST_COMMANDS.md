# Restaurant Search - Testing Commands

## Stage 1: Test Tool Functions

### Option A: Run Python Test Script
```bash
cd dashboard/backend
python test_restaurant_search.py
```

**Before running, update in test_restaurant_search.py:**
- Line 32: Replace `"test-user-id-here"` with a real user UUID from your `profiles` table

---

### Option B: Test via API Endpoint

1. **Start the backend server:**
```bash
cd dashboard/backend
python main.py
```

2. **Get a JWT token** (sign in via frontend first, then grab token from browser dev tools)

3. **Test the endpoint:**
```bash
curl -X POST http://localhost:8000/api/restaurants/search \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d "query=Italian restaurant with outdoor seating" \
  -d "latitude=40.7580" \
  -d "longitude=-73.9855"
```

---

### Option C: Test via FastAPI Docs (Easiest!)

1. Start backend: `python main.py`
2. Open browser: http://localhost:8000/docs
3. Find `/api/restaurants/search` endpoint
4. Click "Try it out"
5. Fill in:
   - **query**: "Italian restaurant with outdoor seating"
   - **latitude**: 40.7580
   - **longitude**: -73.9855
6. Click "Execute"

**Note:** You'll need to authorize first (click the lock icon and paste your JWT token)

---

## Expected Stage 1 Response

```json
{
  "status": "success",
  "stage": "1 - Tool testing (no LLM yet)",
  "query": "Italian restaurant with outdoor seating",
  "user_preferences": {
    "cuisines": ["Italian", "French"],
    "priceRange": "$$",
    "atmosphere": ["Casual", "Cozy"],
    "flavorNotes": ["savory", "spicy"]
  },
  "nearby_restaurants": [
    {
      "place_id": "ChIJ...",
      "name": "Restaurant Name",
      "cuisine": "Italian",
      "rating": 4.5,
      "address": "123 Main St",
      "photo_url": "https://..."
    },
    // ... 9 more restaurants
  ],
  "location": {
    "latitude": 40.7580,
    "longitude": -73.9855
  }
}
```

---

## Quick Checklist for Stage 1

- [ ] Backend starts without errors
- [ ] Can access http://localhost:8000/docs
- [ ] `/api/restaurants/search` endpoint appears in docs
- [ ] Test returns `user_preferences` (may be empty if user has no profile)
- [ ] Test returns `nearby_restaurants` (10 results)
- [ ] No errors in terminal logs

---

## Common Issues

### "User not found" or empty preferences
- Normal if user hasn't submitted any reviews yet
- Preferences will be empty: `{"cuisines": [], "priceRange": "", ...}`

### "No restaurants found"
- Check that `PLACES_API_KEY` is set in `.env`
- Try a different location (some areas have fewer restaurants)
- Check Google Places API quota

### "Authentication failed"
- Make sure you're passing a valid JWT token
- Token format: `Bearer eyJhbGc...`
- Get token by signing in via frontend, then check browser localStorage

---

## Next Stages

After Stage 1 passes:

**Stage 4:** Add Gemini function calling
- LLM will automatically call the tool functions
- LLM will analyze restaurants and return top 3
- Update `search_restaurants()` method in service

**Stage 5:** Frontend integration
- Update overview/page.tsx `handleSubmit`
- Display results in UI
- Show top 3 restaurants

**Stage 6:** End-to-end testing
- Test full flow from frontend to backend
- Verify results match user query and preferences

