"""
Quick test script to verify backend setup.
Run this before starting the full server to catch configuration issues early.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_env_variables():
    """Check if all required environment variables are set."""
    print("🔍 Checking environment variables...")
    
    required_vars = {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_SERVICE_KEY": os.getenv("SUPABASE_SERVICE_KEY"),
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
    }
    
    optional_vars = {
        "SUPABASE_STORAGE_BUCKET": os.getenv("SUPABASE_STORAGE_BUCKET", "issue-images"),
        "API_HOST": os.getenv("API_HOST", "0.0.0.0"),
        "API_PORT": os.getenv("API_PORT", "8000"),
    }
    
    all_good = True
    
    for var, value in required_vars.items():
        if value:
            print(f"  ✅ {var}: {'*' * 10} (set)")
        else:
            print(f"  ❌ {var}: NOT SET")
            all_good = False
    
    print("\n📋 Optional variables:")
    for var, value in optional_vars.items():
        print(f"  ℹ️  {var}: {value}")
    
    return all_good

def test_imports():
    """Test if all required packages can be imported."""
    print("\n📦 Testing package imports...")
    
    packages = [
        ("fastapi", "FastAPI"),
        ("anthropic", "Anthropic client"),
        ("supabase", "Supabase client"),
        ("jwt", "JWT decoder"),
        ("PIL", "Pillow (image processing)"),
    ]
    
    all_good = True
    
    for package, description in packages:
        try:
            __import__(package)
            print(f"  ✅ {package}: {description}")
        except ImportError as e:
            print(f"  ❌ {package}: IMPORT ERROR - {e}")
            all_good = False
    
    return all_good

def test_services():
    """Test if services can be initialized."""
    print("\n🔧 Testing service initialization...")
    
    # Test Claude service
    try:
        from services.claude_service import get_claude_service
        claude = get_claude_service()
        print(f"  ✅ Claude service: Model {claude.model}")
    except Exception as e:
        print(f"  ❌ Claude service: {e}")
        return False
    
    # Test Supabase service
    try:
        from services.supabase_service import get_supabase_service
        supabase = get_supabase_service()
        print(f"  ✅ Supabase service: Bucket '{supabase.bucket_name}'")
    except Exception as e:
        print(f"  ❌ Supabase service: {e}")
        return False
    
    return True

def test_auth():
    """Test JWT auth utility."""
    print("\n🔐 Testing auth utility...")
    
    try:
        from utils.auth import get_user_id_from_token
        print(f"  ✅ Auth utility imported successfully")
        return True
    except Exception as e:
        print(f"  ❌ Auth utility: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 60)
    print("🚀 Aegis Backend Setup Test")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Environment Variables", test_env_variables()))
    results.append(("Package Imports", test_imports()))
    results.append(("Auth Utility", test_auth()))
    results.append(("Service Initialization", test_services()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n🎉 All tests passed! You're ready to run the server.")
        print("\nTo start the server:")
        print("  conda activate aegis")
        print("  cd dashboard/backend")
        print("  python main.py")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above before running the server.")
        print("\nCommon fixes:")
        print("  1. Create a .env file with required variables (see BACKEND_SETUP.md)")
        print("  2. Make sure you have valid API keys")
        print("  3. Check that Supabase URL and service key are correct")
    
    return all_passed

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)

