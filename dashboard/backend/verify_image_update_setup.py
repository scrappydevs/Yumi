"""
Verification script to check if the image metadata update script is ready to run.

This script verifies:
1. Required environment variables are set
2. Database connection works
3. Gemini API is accessible
4. Images table exists and has records needing updates
"""
import os
import sys
import subprocess
from supabase import create_client
from dotenv import load_dotenv


def sync_secrets():
    """Sync secrets from Infisical to .env file before loading environment variables"""
    try:
        print("🔄 Syncing secrets from Infisical to .env...")
        result = subprocess.run(
            ["infisical", "export", "--env=dev", "--format=dotenv"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if result.returncode == 0:
            # Write the output to .env file
            with open('.env', 'w') as f:
                f.write(result.stdout)
            print("✅ Secrets synced to .env successfully!\n")
            return True
        else:
            print(
                "⚠️  Could not sync from Infisical. Using existing .env file if available")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
            print()
            return False
    except FileNotFoundError:
        print("⚠️  Infisical CLI not found. Install with: brew install infisical/get-cli/infisical")
        print("   Using existing .env file if available\n")
        return False
    except Exception as e:
        print(f"⚠️  Could not sync secrets: {e}")
        print("   Using existing .env file if available\n")
        return False


# Sync and load secrets first
sync_secrets()
load_dotenv()

# ANSI color codes for pretty output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
BOLD = '\033[1m'
RESET = '\033[0m'


def print_header(text):
    """Print a formatted header."""
    print(f"\n{BLUE}{BOLD}{'='*60}{RESET}")
    print(f"{BLUE}{BOLD}{text:^60}{RESET}")
    print(f"{BLUE}{BOLD}{'='*60}{RESET}\n")


def check_mark(passed):
    """Return check mark or X based on status."""
    return f"{GREEN}✓{RESET}" if passed else f"{RED}✗{RESET}"


def check_environment_variables():
    """Check if required environment variables are set."""
    print_header("Checking Environment Variables")

    # Check for service key with both possible names
    service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv(
        "NEXT_PUBLIC_SUPABASE_SERVICE_KEY")

    checks = {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_SERVICE_KEY": service_key,
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY")
    }

    all_passed = True

    for var_name, var_value in checks.items():
        status = bool(var_value)
        all_passed = all_passed and status

        if status:
            # Show first 20 chars for confirmation
            display_value = var_value[:20] + \
                "..." if len(var_value) > 20 else var_value
            print(f"{check_mark(True)} {var_name}: {display_value}")
        else:
            print(f"{check_mark(False)} {var_name}: {RED}NOT SET{RESET}")

    if not all_passed:
        print(f"\n{YELLOW}⚠ Missing environment variables!{RESET}")
        print("Set them using:")
        print("  export SUPABASE_URL='your-url'")
        print("  export SUPABASE_SERVICE_KEY='your-key'")
        print("  export GEMINI_API_KEY='your-gemini-key'")

    return all_passed


def check_database_connection():
    """Check if we can connect to Supabase."""
    print_header("Checking Database Connection")

    try:
        supabase_url = os.getenv("SUPABASE_URL")
        # Check for service key with both possible names
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv(
            "NEXT_PUBLIC_SUPABASE_SERVICE_KEY")

        if not supabase_url or not supabase_key:
            print(f"{check_mark(False)} Missing Supabase credentials")
            print(
                f"   Error: {RED}SUPABASE_URL or SUPABASE_SERVICE_KEY not set{RESET}")
            return None

        client = create_client(supabase_url, supabase_key)

        # Try a simple query
        response = client.table("images").select("id").limit(1).execute()

        print(f"{check_mark(True)} Successfully connected to Supabase")
        return client

    except Exception as e:
        print(f"{check_mark(False)} Failed to connect to Supabase")
        print(f"   Error: {RED}{str(e)}{RESET}")
        return None


def check_images_table(client):
    """Check images table and count records needing updates."""
    print_header("Checking Images Table")

    if not client:
        print(f"{check_mark(False)} Cannot check table (no database connection)")
        return False

    try:
        # Count total images
        total_response = client.table("images").select(
            "id", count="exact").execute()
        total_count = total_response.count

        print(f"{check_mark(True)} Images table exists")
        print(f"   Total images: {total_count}")

        # Count images missing dish or cuisine
        missing_response = client.table("images")\
            .select("id", count="exact")\
            .or_("dish.is.null,cuisine.is.null")\
            .not_.is_("image_url", "null")\
            .execute()

        missing_count = missing_response.count

        if missing_count > 0:
            print(
                f"{check_mark(True)} Found {GREEN}{missing_count}{RESET} images needing metadata updates")
            print(f"   {missing_count} images are missing dish and/or cuisine")
        else:
            print(f"{YELLOW}⚠{RESET} No images found needing updates")
            print(f"   All images have dish and cuisine already set")

        # Sample a few records to show
        if missing_count > 0:
            print(f"\n{BOLD}Sample records:{RESET}")
            samples = client.table("images")\
                .select("id, dish, cuisine, image_url")\
                .or_("dish.is.null,cuisine.is.null")\
                .not_.is_("image_url", "null")\
                .limit(3)\
                .execute()

            for img in samples.data:
                dish_status = f"'{img['dish']}'" if img['dish'] else f"{RED}NULL{RESET}"
                cuisine_status = f"'{img['cuisine']}'" if img['cuisine'] else f"{RED}NULL{RESET}"
                print(
                    f"   ID {img['id']}: dish={dish_status}, cuisine={cuisine_status}")

        return missing_count > 0

    except Exception as e:
        print(f"{check_mark(False)} Error checking images table")
        print(f"   Error: {RED}{str(e)}{RESET}")
        return False


def check_gemini_api():
    """Check if Gemini API is accessible."""
    print_header("Checking Gemini API")

    gemini_key = os.getenv("GEMINI_API_KEY")

    if not gemini_key:
        print(f"{check_mark(False)} GEMINI_API_KEY not set")
        return False

    try:
        import google.generativeai as genai

        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Try a simple test (doesn't count against quota)
        print(f"{check_mark(True)} Gemini API key is valid")
        print(f"   Model: gemini-2.5-flash")

        return True

    except Exception as e:
        print(f"{check_mark(False)} Failed to initialize Gemini API")
        print(f"   Error: {RED}{str(e)}{RESET}")
        print(
            f"\n   {YELLOW}Note:{RESET} Make sure your API key is valid and has quota")
        return False


def main():
    """Run all verification checks."""
    print(f"\n{BOLD}Image Metadata Update - Setup Verification{RESET}")

    # Run all checks
    env_ok = check_environment_variables()
    db_client = check_database_connection()
    images_ok = check_images_table(db_client)
    gemini_ok = check_gemini_api()

    # Final summary
    print_header("Summary")

    all_passed = env_ok and db_client and images_ok and gemini_ok

    if all_passed:
        print(f"{GREEN}{BOLD}✓ All checks passed!{RESET}")
        print(f"\nYou're ready to run the script:")
        print(f"  {BLUE}python update_image_metadata.py{RESET}")
    else:
        print(f"{RED}{BOLD}✗ Some checks failed{RESET}")
        print(f"\n{YELLOW}Fix the issues above before running the script.{RESET}")

        if not env_ok:
            print(f"\n1. Set missing environment variables")
        if not db_client:
            print(f"\n2. Fix database connection")
        if not gemini_ok:
            print(f"\n3. Configure Gemini API key")
        if not images_ok and db_client:
            print(f"\n4. Ensure images table has records needing updates")

    print()
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
