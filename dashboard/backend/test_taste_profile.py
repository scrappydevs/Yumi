"""
Test script for taste profile service.
Run this to verify each increment works correctly.

Usage: python test_taste_profile.py
"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from services.taste_profile_service import get_taste_profile_service


async def test_basic_preferences():
    """Test 1: Fetch and update preferences for a user"""
    print("\n" + "="*60)
    print("TEST 1: Basic Preference Operations")
    print("="*60)
    
    # You'll need a real user ID from your database for this test
    # For now, let's use a placeholder - replace with actual UUID
    test_user_id = "0d656513-63c6-4ece-a9d9-b78d2bd7af84"  # Replace with your user ID
    
    print(f"\nTesting with user: {test_user_id}")
    
    try:
        service = get_taste_profile_service()
        
        # Step 1: Fetch current preferences
        print("\n1. Fetching current preferences...")
        current_prefs = service.get_current_preferences(test_user_id)
        print(f"✅ Current preferences: {current_prefs}")
        
        # Step 2: Create test preferences
        print("\n2. Creating test preferences...")
        test_prefs = {
            "cuisines": ["Italian", "Japanese"],
            "priceRange": "$$",
            "atmosphere": ["Casual", "Cozy"],
            "flavorNotes": ["savory", "umami"]
        }
        print(f"   Test preferences: {test_prefs}")
        
        # Step 3: Save preferences
        print("\n3. Saving test preferences...")
        service.save_preferences(test_user_id, test_prefs)
        print("✅ Preferences saved!")
        
        # Step 4: Fetch again to verify
        print("\n4. Fetching again to verify...")
        updated_prefs = service.get_current_preferences(test_user_id)
        print(f"✅ Updated preferences: {updated_prefs}")
        
        # Verify they match
        if updated_prefs == test_prefs:
            print("\n🎉 SUCCESS: Preferences match!")
        else:
            print("\n⚠️  WARNING: Preferences don't match exactly")
            print(f"   Expected: {test_prefs}")
            print(f"   Got: {updated_prefs}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_merge_preferences():
    """Test 2: Test preference merging logic"""
    print("\n" + "="*60)
    print("TEST 2: Preference Merging Logic")
    print("="*60)
    
    try:
        service = get_taste_profile_service()
        
        # Current preferences
        current = {
            "cuisines": ["Japanese", "Mexican"],
            "priceRange": "$$",
            "atmosphere": ["Casual"],
            "flavorNotes": ["spicy"]
        }
        
        # New insights from a review
        new_insights = {
            "cuisines_to_add": ["Italian"],
            "cuisines_to_keep": ["Japanese", "Mexican"],
            "atmosphere_tags": ["Cozy"],
            "price_preference": "$$$",
            "flavor_notes": ["savory", "rich"],
            "reasoning": "User loved Italian food, upscale place"
        }
        
        print(f"\nCurrent: {current}")
        print(f"New insights: {new_insights}")
        
        # Merge
        print("\nMerging...")
        merged = service.merge_preferences(current, new_insights)
        
        print(f"\n✅ Merged result: {merged}")
        
        # Verify
        assert "Italian" in merged["cuisines"], "Italian should be added"
        assert "Japanese" in merged["cuisines"], "Japanese should be kept"
        assert "Cozy" in merged["atmosphere"], "Cozy should be added"
        assert "Casual" in merged["atmosphere"], "Casual should be kept"
        assert merged["priceRange"] == "$$$", "Price range should update"
        assert "savory" in merged["flavorNotes"], "Savory should be added"
        
        print("\n🎉 SUCCESS: All merge assertions passed!")
        return True
        
    except AssertionError as e:
        print(f"\n❌ ASSERTION FAILED: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_llm_analysis():
    """Test 3: Test LLM analysis with sample review"""
    print("\n" + "="*60)
    print("TEST 3: LLM Analysis with Sample Review")
    print("="*60)
    
    try:
        service = get_taste_profile_service()
        
        # Sample review data (mimics real database structure)
        sample_review = {
            "id": "test-review-123",
            "description": "Absolutely amazing! The crust was perfectly charred and the mozzarella was so fresh. Love the simple, authentic flavors.",
            "overall_rating": 5,
            "restaurant_name": "Joe's Pizza",
            "images": {
                "dish": "Margherita Pizza",
                "cuisine": "Italian",
                "description": "Classic Neapolitan-style pizza with fresh mozzarella, basil, and tomato sauce"
            }
        }
        
        # Current preferences
        current_prefs = {
            "cuisines": ["Japanese", "Mexican"],
            "priceRange": "$$",
            "atmosphere": ["Casual"],
            "flavorNotes": ["spicy"]
        }
        
        print("\n📝 Sample Review:")
        print(f"   Dish: {sample_review['images']['dish']}")
        print(f"   Cuisine: {sample_review['images']['cuisine']}")
        print(f"   Rating: {sample_review['overall_rating']}/5")
        print(f"   User's Opinion: \"{sample_review['description']}\"")
        print(f"\n📊 Current Preferences: {current_prefs}")
        
        print("\n🤖 Analyzing with LLM...")
        insights = await service.analyze_review_with_llm(sample_review, current_prefs)
        
        print(f"\n✅ LLM Insights: {insights}")
        
        # Verify structure
        assert "cuisines_to_add" in insights, "Missing cuisines_to_add"
        assert "cuisines_to_keep" in insights, "Missing cuisines_to_keep"
        assert "atmosphere_tags" in insights, "Missing atmosphere_tags"
        assert "reasoning" in insights, "Missing reasoning"
        
        # Verify logic (5-star Italian review should add Italian)
        print(f"\n🔍 Validating logic...")
        print(f"   - Cuisines to add: {insights.get('cuisines_to_add')}")
        print(f"   - Should include 'Italian' (5-star review)")
        
        if "Italian" in insights.get("cuisines_to_add", []):
            print("   ✅ Italian correctly added!")
        else:
            print("   ⚠️  Italian not added, but review was 5-star")
        
        print(f"\n💭 LLM Reasoning: {insights.get('reasoning')}")
        
        print("\n🎉 SUCCESS: LLM analysis completed!")
        return True
        
    except AssertionError as e:
        print(f"\n❌ ASSERTION FAILED: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""
    print("\n🧪 TASTE PROFILE SERVICE TEST SUITE")
    print("=" * 60)
    
    results = []
    
    # Test 1: Basic operations
    result1 = await test_basic_preferences()
    results.append(("Basic Preferences", result1))
    
    # Test 2: Merging
    result2 = await test_merge_preferences()
    results.append(("Preference Merging", result2))
    
    # Test 3: LLM Analysis (the big one!)
    result3 = await test_llm_analysis()
    results.append(("LLM Analysis", result3))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    all_passed = all(r[1] for r in results)
    if all_passed:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n⚠️  SOME TESTS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

