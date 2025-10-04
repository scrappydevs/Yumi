# Friends Preference Blend Feature ✨

## Overview
A new feature that blends dining preferences from you and your friends to create a unified group taste profile. Perfect for deciding where to eat as a group!

## How It Works

### User Experience
1. Open the **Friends** tab in the iOS app
2. Tap the **✨ Blend** button in the top-left
3. The app analyzes preferences from you and all your friends
4. View a beautiful card showing:
   - Natural language summary of group preferences
   - Top cuisines the group enjoys
   - Atmosphere preferences (casual, upscale, etc.)
   - Price range comfort level
   - Group member names

### Technical Flow
```
iOS App → Backend API → LLM (Gemini) → Blended Preferences → iOS UI
```

## What Was Implemented

### Backend (`dashboard/backend/`)

#### 1. New Router: `routers/preferences.py`
- **Endpoint:** `POST /api/preferences/blend`
- **Input:** Array of friend IDs (optional, defaults to all friends)
- **Output:** Blended preferences with structured data
- **Key Feature:** Reuses existing `taste_profile_service.merge_multiple_user_preferences()` method

**Response Example:**
```json
{
  "blended_text": "This group loves Italian and Japanese cuisine with a preference for casual, cozy spots...",
  "user_count": 3,
  "user_names": ["Alex", "Jordan", "Sam"],
  "top_cuisines": ["Italian", "Japanese", "Mexican"],
  "atmosphere_preferences": ["casual", "cozy"],
  "price_range": "Moderate"
}
```

#### 2. Added to `main.py`
- Registered new preferences router
- Endpoint available at `/api/preferences/blend`

### iOS App (`aegis/aegis/`)

#### 1. Model: `Models/User.swift`
- Added `BlendedPreferences` struct
- Matches backend response structure

#### 2. Network Service: `Services/NetworkService.swift`
- Added `blendPreferences()` method
- Handles API call and JSON decoding

#### 3. View Model: `ViewModels/FriendsViewModel.swift`
- Added `@Published var blendedPreferences: BlendedPreferences?`
- Added `@Published var isBlending: Bool`
- Added `blendPreferences(with:)` method

#### 4. UI View: `Views/BlendPreferencesView.swift`
- Beautiful full-screen sheet modal
- Shows loading state while blending
- Displays blended preferences in organized cards:
  - Group vibe description
  - Top cuisines (with blue tags)
  - Atmosphere (with purple tags)
  - Price range (with green icon)
  - Group members

#### 5. Updated: `Views/FriendsView.swift`
- Added **✨ Blend** button to toolbar (left side)
- Button disabled when no friends
- Opens BlendPreferencesView sheet when tapped

## Design Highlights

### Visual Design
- **Clean card-based layout** with subtle shadows
- **Color-coded sections:**
  - 🍴 Blue for cuisines
  - ✨ Purple for atmosphere
  - 💰 Green for price
- **Flow layout** for tags (wraps nicely)
- **Loading state** with spinner and friendly message
- **Empty state** with helpful guidance

### User Experience
- **Automatic blending** when sheet opens
- **Pull to refresh** capability
- **Error handling** with user-friendly messages
- **Disabled button** when no friends (prevents confusion)
- **Natural language** summaries (not technical jargon)

## How to Test

### 1. Start Backend
```bash
cd dashboard/backend
python main.py
```

### 2. Test API Endpoint (Optional)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"friend_ids": []}' \
  http://localhost:8000/api/preferences/blend
```

### 3. Test in iOS App
1. Build and run the iOS app
2. Sign in and navigate to Friends tab
3. Add some friends (if you haven't)
4. Tap **✨ Blend** button
5. View your group's blended preferences!

## Key Features

✅ **Reuses existing infrastructure** - Leverages taste profile service and LLM integration  
✅ **Smart merging** - Finds common ground between diverse preferences  
✅ **Beautiful UI** - Modern, card-based design with smooth animations  
✅ **Fast** - Uses existing optimized LLM prompts  
✅ **Scalable** - Works with any number of friends  
✅ **Error resilient** - Graceful fallbacks if something fails  

## Future Enhancements (Optional)

- **Select specific friends** to blend (vs all friends)
- **"Use for Search" button** to find restaurants matching group preferences
- **Save blends** for recurring groups (e.g., "Friday Lunch Crew")
- **Compare preferences** side-by-side before blending
- **Dietary restrictions** highlighting
- **Share blend** via text/email

## Files Changed

### Backend
- ✨ `dashboard/backend/routers/preferences.py` (new)
- 📝 `dashboard/backend/main.py` (added router)

### iOS
- ✨ `aegis/aegis/Views/BlendPreferencesView.swift` (new)
- 📝 `aegis/aegis/Models/User.swift` (added model)
- 📝 `aegis/aegis/Services/NetworkService.swift` (added method)
- 📝 `aegis/aegis/ViewModels/FriendsViewModel.swift` (added state & methods)
- 📝 `aegis/aegis/Views/FriendsView.swift` (added button & sheet)

## API Documentation

See `dashboard/backend/IOS_FRIENDS_API.md` for complete API reference.

---

**Total Implementation Time:** ~45 minutes  
**Lines of Code:** ~350 (backend + iOS)  
**Dependencies:** None (uses existing services)  
**Status:** ✅ Ready to use!
