# Google Maps API Setup Guide

## 🗺️ Setting Up Google Maps for Restaurant Discovery

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Library**
4. Enable these APIs:
   - **Maps JavaScript API** (for the map display)
   - **Places API** (for restaurant search and details)
   - **Geocoding API** (optional, for address lookups)

5. Go to **APIs & Services** → **Credentials**
6. Click **Create Credentials** → **API Key**
7. Copy your API key

### Step 2: Add to Environment

Create or update `/Users/vini/iFix/iFix/dashboard/frontend/.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important:** The key MUST start with `NEXT_PUBLIC_` to be accessible in the browser.

### Step 3: Secure Your API Key (Recommended)

1. In Google Cloud Console, click on your API key
2. Under **Application restrictions**:
   - Select "HTTP referrers (web sites)"
   - Add: `http://localhost:3000/*`
   - Add: `http://localhost:3001/*`
   - Add your production domain when ready

3. Under **API restrictions**:
   - Select "Restrict key"
   - Check: Maps JavaScript API
   - Check: Places API
   - Check: Geocoding API

### Step 4: Test It Works

```bash
cd dashboard/frontend
npm run dev
```

Then visit http://localhost:3000/spatial

You should see:
- ✅ Google Map loads with San Francisco
- ✅ Can switch between Map, Satellite, Hybrid views
- ✅ Search bar at bottom

## 🔍 How It Works

### Features Using Google APIs:

1. **Maps JavaScript API**
   - Interactive map with 3D tilt
   - Satellite and hybrid views
   - Smooth camera animations
   - Custom styling

2. **Places API**
   - Text search for restaurants
   - Place details (photos, reviews, hours)
   - Contact information
   - Price levels and ratings
   - Opening hours (real-time)

### Example Searches:

```
"Italian restaurants"
"sushi near me"
"best pizza"
"coffee shops"
```

## 💰 Pricing (Free Tier)

Google Maps APIs are **free for development** with generous limits:

- **Maps JavaScript API**: First $200/month free
- **Places API**: 
  - Text Search: First $200/month free (~40,000 requests)
  - Place Details: First $200/month free (~100,000 requests)
- **Most small apps stay within free tier**

## 🐛 Troubleshooting

### Map doesn't load
- Check API key is set in `.env.local`
- Verify key starts with `NEXT_PUBLIC_`
- Check browser console for errors
- Ensure Maps JavaScript API is enabled

### Search returns no results
- Check Places API is enabled
- Verify API key has Places API access
- Try broader search terms ("restaurants" instead of specific names)

### "This page can't load Google Maps correctly"
- API key restrictions might be too strict
- Try removing restrictions temporarily
- Check billing is enabled (required for production)

## 🎯 What You Get

With Google Maps + Places API:

✅ **Real restaurant data** (not mock!)  
✅ **Current hours** (open/closed status)  
✅ **Real Google reviews** with ratings  
✅ **Professional photos** from Google  
✅ **Phone numbers** and websites  
✅ **Exact addresses** with map pins  
✅ **Price levels** ($-$$$$)  
✅ **Directions** link to Google Maps  
✅ **Satellite view** for visual context  

## 🚀 Ready!

Once you add the API key, the restaurant map will use **real Google data** with:
- Live search results
- Actual restaurant information
- Real reviews and photos
- Current opening hours
- Verified contact details

Much better than mock data! 🎊

