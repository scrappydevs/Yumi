# Load environment variables FIRST, before any imports that need them
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
