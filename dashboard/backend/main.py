from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import os
import subprocess

# Auto-sync secrets from Infisical before starting
def sync_secrets():
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
            print("⚠️  Could not sync from Infisical. Using existing .env file if available")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
    except FileNotFoundError:
        print("⚠️  Infisical CLI not found. Install with: brew install infisical/get-cli/infisical")
        print("   Using existing .env file if available")
    except Exception as e:
        print(f"⚠️  Could not sync secrets: {e}")
        print("   Using existing .env file if available")

# Sync secrets on startup
sync_secrets()

# Load environment variables
load_dotenv()

from supabase_client import SupabaseClient
from routers import issues

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        SupabaseClient.initialize()
        print("✅ Application startup complete")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize Supabase: {e}")
    
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

# CORS configuration
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
