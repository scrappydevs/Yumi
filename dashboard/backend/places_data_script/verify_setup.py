#!/usr/bin/env python3
"""
Quick verification script to test setup before running the main script.
"""
import sys
import math

print("🔍 Verifying Restaurant Data Fetcher Setup...")
print("=" * 60)

# Test 1: Import all modules
print("\n1️⃣  Testing imports...")
try:
    import config
    import models
    import grid_manager
    import places_api
    import database
    print("   ✅ All modules imported successfully")
except ImportError as e:
    print(f"   ❌ Import error: {e}")
    print("   → Run: pip install -r requirements.txt")
    sys.exit(1)

# Test 2: Check API key
print("\n2️⃣  Checking Google API key...")
if config.GOOGLE_PLACES_API_KEY:
    print(f"   ✅ API key configured: {config.GOOGLE_PLACES_API_KEY[:20]}...")
else:
    print("   ❌ API key not configured")
    sys.exit(1)

# Test 3: Check Supabase configuration
print("\n3️⃣  Checking Supabase configuration...")
print(f"   URL: {config.SUPABASE_URL}")
if config.SUPABASE_SERVICE_KEY:
    print(
        f"   ✅ Service key configured: {config.SUPABASE_SERVICE_KEY[:20]}...")
else:
    print("   ⚠️  SUPABASE_SERVICE_KEY not set in environment")
    print("   → Run: export SUPABASE_SERVICE_KEY='your-key'")
    print("   → Or add to backend/.env file")

# Test 4: Verify bounding box
print("\n4️⃣  Verifying bounding box...")
print(f"   Top-Left: {config.TOP_LEFT}")
print(f"   Bottom-Right: {config.BOTTOM_RIGHT}")
print(f"   Priority Location: {config.PRIORITY_LOCATION}")
print("   ✅ Coordinates configured")

# Test 5: Calculate grid info
print("\n5️⃣  Grid calculation preview...")
lat_min = config.BOTTOM_RIGHT[0]
lat_max = config.TOP_LEFT[0]
lng_min = config.TOP_LEFT[1]
lng_max = config.BOTTOM_RIGHT[1]

center_lat = (lat_min + lat_max) / 2
center_lng = (lng_min + lng_max) / 2

radius_km = config.SEARCH_RADIUS_METERS / 1000
step_distance_km = radius_km * (1 - config.OVERLAP_FACTOR)
lat_step = step_distance_km / 111.0
lng_step = step_distance_km / (111.0 * math.cos(math.radians(center_lat)))

lat_count = int((lat_max - lat_min) / lat_step) + 1
lng_count = int((lng_max - lng_min) / lng_step) + 1
estimated_cells = lat_count * lng_count

print(f"   Center: {center_lat:.6f}, {center_lng:.6f}")
print(f"   Search radius: {config.SEARCH_RADIUS_METERS}m")
print(f"   Grid step: ~{step_distance_km:.2f}km")
print(f"   Estimated cells: ~{estimated_cells}")
print("   ✅ Grid parameters valid")

# Test 6: Calculate priority cell
print("\n6️⃣  Priority location analysis...")
priority_lat, priority_lng = config.PRIORITY_LOCATION

# Calculate which grid cell is closest
cells_checked = []
min_distance = float('inf')
closest_cell = None

lat = lat_min
while lat <= lat_max:
    lng = lng_min
    while lng <= lng_max:
        distance = math.sqrt(
            (lat - priority_lat)**2 +
            (lng - priority_lng)**2
        )
        if distance < min_distance:
            min_distance = distance
            closest_cell = (lat, lng)
        cells_checked.append((lat, lng, distance))
        lng += lng_step
    lat += lat_step

print(f"   Priority location: {priority_lat:.6f}, {priority_lng:.6f}")
print(f"   Closest grid cell: {closest_cell[0]:.6f}, {closest_cell[1]:.6f}")
print(f"   Distance: {min_distance:.6f} degrees (~{min_distance * 111:.1f}km)")
print("   ✅ Priority location will be processed FIRST")

# Test 7: Check dependencies
print("\n7️⃣  Checking Python dependencies...")
try:
    import requests
    print("   ✅ requests")
except ImportError:
    print("   ❌ requests - Run: pip install requests")

try:
    from supabase import create_client
    print("   ✅ supabase")
except ImportError:
    print("   ❌ supabase - Run: pip install supabase")

# Summary
print("\n" + "=" * 60)
print("📋 SETUP VERIFICATION COMPLETE")
print("=" * 60)

if config.SUPABASE_SERVICE_KEY:
    print("\n✅ All checks passed! Ready to run:")
    print("\n   python data_script.py --init")
    print("   python data_script.py --cells 1")
else:
    print("\n⚠️  Almost ready! Just set SUPABASE_SERVICE_KEY:")
    print("\n   export SUPABASE_SERVICE_KEY='your-key'")
    print("   python data_script.py --init")

print("\n📚 Read QUICKSTART.md for detailed instructions")
print("=" * 60 + "\n")
