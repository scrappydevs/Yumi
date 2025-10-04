"""
Quick diagnostic script to check restaurants table data.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from supabase_client import get_supabase

def check_data():
    print("\n" + "="*80)
    print("🔍 CHECKING RESTAURANTS TABLE DATA")
    print("="*80)
    
    supabase = get_supabase()
    
    # Check total count
    print("\n1. Checking total restaurant count...")
    response = supabase.table('restaurants').select('id', count='exact').limit(1).execute()
    total_count = response.count if hasattr(response, 'count') else 'unknown'
    print(f"   Total restaurants in database: {total_count}")
    
    # Get sample restaurants
    print("\n2. Getting sample restaurants...")
    response = supabase.table('restaurants').select('*').limit(5).execute()
    
    if not response.data:
        print("   ❌ No restaurants found in table!")
        print("\n   The restaurants table appears to be empty.")
        print("   You need to populate it with restaurant data first.")
        return
    
    print(f"   ✅ Found restaurants! Showing first 5:\n")
    
    for i, r in enumerate(response.data, 1):
        print(f"   {i}. {r.get('name', 'Unknown')}")
        print(f"      Address: {r.get('formatted_address', 'N/A')}")
        print(f"      Cuisine: {r.get('cuisine', 'N/A')}")
        print(f"      Rating: {r.get('rating_avg', 'N/A')} ({r.get('user_ratings_total', 0)} reviews)")
        print(f"      Location data exists: {'✓' if r.get('location') else '✗'}")
        print()
    
    # Check if any restaurants have location data
    print("3. Checking location data...")
    response = supabase.table('restaurants').select('name, formatted_address, location').limit(10).execute()
    
    with_location = sum(1 for r in response.data if r.get('location'))
    print(f"   Restaurants with location data: {with_location}/{len(response.data)}")
    
    if with_location == 0:
        print("   ❌ No restaurants have location data!")
        print("   The 'location' geography column needs to be populated.")
    
    # Try to find any restaurants mentioning Boston/Cambridge/MA
    print("\n4. Searching for Boston-area restaurants...")
    response = supabase.table('restaurants').select('name, formatted_address').ilike('formatted_address', '%MA%').limit(10).execute()
    
    if response.data:
        print(f"   Found {len(response.data)} restaurants with MA addresses:")
        for r in response.data[:5]:
            print(f"   - {r['name']}: {r['formatted_address']}")
    else:
        print("   ❌ No restaurants found with MA in address")
        print("\n   Your database may have restaurants from a different area.")
        print("   Try checking what addresses exist:")
        response = supabase.table('restaurants').select('formatted_address').limit(20).execute()
        if response.data:
            print("\n   Sample addresses in database:")
            for r in response.data[:10]:
                print(f"   - {r['formatted_address']}")

if __name__ == '__main__':
    check_data()

