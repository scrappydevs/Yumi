# Load environment variables FIRST, before any imports that need them
from utils.auth import get_user_id_from_token
from fastapi import Depends, Form, HTTPException
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from supabase_client import SupabaseClient
from routers import issues, ai, audio, config, reservations, twilio_webhooks
import os
import subprocess
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
            print("✅ Secrets synced to .env successfully!")
        else:
            print(
                "⚠️  Could not sync from Infisical. Using existing .env file if available")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
    except FileNotFoundError:
        print("⚠️  Infisical CLI not found. Install with: brew install infisical/get-cli/infisical")
        print("   Using existing .env file if available")
    except Exception as e:
        print(f"⚠️  Could not sync secrets: {e}")
        print("   Using existing .env file if available")


# Sync and load secrets BEFORE importing modules that need environment variables
sync_secrets()
load_dotenv()

# Now import modules that depend on environment variables


# Lifespan context manager for startup/shutdown events

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        SupabaseClient.initialize()
        print("✅ Supabase client initialized")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize Supabase: {e}")

    try:
        from services.twilio_service import TwilioService
        TwilioService.initialize()
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize Twilio: {e}")

    print("✅ Application startup complete")

    yield

    # Shutdown
    print("🔄 Application shutdown")

app = FastAPI(
    title="Aegis Infrastructure API",
    description="Backend API for Aegis Civic Infrastructure Intelligence Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(issues.router)
app.include_router(ai.router)
app.include_router(audio.router)
app.include_router(config.router)
app.include_router(reservations.router, prefix="/api")
app.include_router(twilio_webhooks.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Welcome to Aegis Infrastructure API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "aegis-api"}


# ============================================================================
# IMPLICIT SIGNALS & PREFERENCE TRACKING
# ============================================================================


@app.post("/api/interactions/track")
async def track_interaction(
    user_id: str = Depends(get_user_id_from_token),
    interaction_type: str = Form(...),
    place_id: str = Form(None),
    restaurant_name: str = Form(None),
    cuisine: str = Form(None),
    atmosphere: str = Form(None),
    address: str = Form(None),
    latitude: float = Form(None),
    longitude: float = Form(None)
):
    """
    Track implicit user interactions with restaurants (click, view, maps_view, reservation).

    **Auto-updates preferences every ~10 interactions.**

    Args:
        interaction_type: Type of interaction (view, click, maps_view, reservation)
        place_id: Google Place ID (can be None)
        restaurant_name: Name of restaurant (can be None)
        cuisine: Optional cuisine type
        atmosphere: Optional atmosphere (e.g., "Casual", "Fine Dining")
        address: Optional restaurant address
        latitude: Optional restaurant latitude
        longitude: Optional restaurant longitude

    Returns:
        Success confirmation
    """
    try:
        print(
            f"[TRACK INTERACTION] {interaction_type} from user: {user_id[:8]}...")

        from services.implicit_signals_service import get_implicit_signals_service
        signals_service = get_implicit_signals_service()

        # Track the interaction (auto-updates every ~10 interactions)
        signals_service.track_restaurant_interaction(
            user_id=user_id,
            interaction_type=interaction_type,
            place_id=place_id,
            restaurant_name=restaurant_name,
            cuisine=cuisine,
            atmosphere=atmosphere,
            address=address,
            latitude=latitude,
            longitude=longitude
        )

        print(f"[TRACK INTERACTION] ✅ Tracked successfully")
        return {"status": "success", "message": "Interaction tracked"}

    except Exception as e:
        print(f"[TRACK INTERACTION ERROR] {str(e)}")
        # Don't fail - tracking is non-critical
        return {"status": "error", "message": str(e)}


@app.post("/api/preferences/update-from-signals")
async def update_preferences_from_signals(
    user_id: str = Depends(get_user_id_from_token),
    days: int = Form(30)
):
    """
    Manually trigger preference update from implicit signals.
    This analyzes recent user behavior and generates natural language preferences.

    **This also happens automatically every ~10 interactions.**

    Args:
        days: Number of days of history to analyze (default: 30)

    Returns:
        Updated preference text
    """
    try:
        print(
            f"[UPDATE PREFERENCES] Manual trigger for user: {user_id[:8]}...")

        from services.taste_profile_service import get_taste_profile_service
        taste_profile_service = get_taste_profile_service()

        # Update preferences from implicit signals
        new_prefs = await taste_profile_service.update_profile_from_implicit_signals(
            user_id=user_id,
            days=days
        )

        print(f"[UPDATE PREFERENCES] ✅ Preferences updated")
        return {
            "status": "success",
            "preferences": new_prefs
        }

    except Exception as e:
        print(f"[UPDATE PREFERENCES ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to update preferences: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
