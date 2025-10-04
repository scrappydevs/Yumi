"""
Quick script to mark restaurants with descriptions as processed.

This script:
1. Finds all restaurants that have a description
2. Sets processed = True for those restaurants
"""
import os
import sys
import subprocess
from supabase import create_client, Client
from dotenv import load_dotenv


def sync_secrets():
    """Sync secrets from Infisical to .env file."""
    try:
        print("🔄 Syncing secrets from Infisical to .env...")
        result = subprocess.run(
            ["infisical", "export", "--env=dev", "--format=dotenv"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if result.returncode == 0:
            with open('.env', 'w') as f:
                f.write(result.stdout)
            print("✅ Secrets synced to .env successfully!")
            return True
        else:
            print(
                "⚠️  Could not sync from Infisical. Using existing .env file if available")
            return False
    except Exception as e:
        print(f"⚠️  Could not sync secrets: {e}")
        return False


# Sync and load secrets
sync_secrets()
load_dotenv()


def main():
    """Mark restaurants with descriptions as processed."""
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv(
        "NEXT_PUBLIC_SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials")
        sys.exit(1)

    client: Client = create_client(supabase_url, supabase_key)

    print("\n" + "="*60)
    print("Marking Processed Restaurants")
    print("="*60 + "\n")

    # Find restaurants with descriptions
    print("Fetching restaurants with descriptions...")
    response = client.table("restaurants")\
        .select("id, name, description")\
        .not_.is_("description", "null")\
        .execute()

    restaurants = response.data
    print(f"Found {len(restaurants)} restaurants with descriptions\n")

    if not restaurants:
        print("✅ No restaurants to process!")
        return

    # Update all to processed = true
    print("Setting processed = true...")
    success_count = 0

    for restaurant in restaurants:
        try:
            client.table("restaurants")\
                .update({"processed": True})\
                .eq("id", restaurant['id'])\
                .execute()
            success_count += 1
            if success_count % 10 == 0:
                print(f"  Processed {success_count}/{len(restaurants)}...")
        except Exception as e:
            print(f"  ❌ Failed to update {restaurant['name']}: {e}")

    print(
        f"\n✅ Successfully marked {success_count}/{len(restaurants)} restaurants as processed")
    print("="*60)


if __name__ == "__main__":
    main()
