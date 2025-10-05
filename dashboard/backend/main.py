"""
Aegis Backend API
FastAPI application for handling infrastructure issue submissions.
"""
from routers import profiles, friends, users, preferences
from routers import invites
from routers import voice
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import subprocess

# Import services and utilities
from services.gemini_service import get_gemini_service
from services.supabase_service import get_supabase_service
from services.places_service import get_places_service
from services.taste_profile_service import get_taste_profile_service
from services.restaurant_search_service import get_restaurant_search_service
from services.restaurant_db_service import get_restaurant_db_service
from utils.auth import get_user_id_from_token
from supabase_client import SupabaseClient
from routers import issues, ai, audio, config, reservations, twilio_webhooks, friends_graph, nlp
import asyncio

# Lazy import for embedding service (heavy memory usage)


def get_embedding_service():
    from services.embedding_service import get_embedding_service as _get_embedding_service
    return _get_embedding_service()


# In-memory cache for AI-suggested restaurants (temporary until user submits review)
# Key: image_id, Value: restaurant_name
restaurant_suggestions_cache = {}

# Auto-sync secrets from Infisical before starting (only in development)


def sync_secrets():
    """Sync secrets from Infisical to .env file before loading environment variables"""
    # Skip in production (Render will provide env vars directly)
    if os.getenv('ENVIRONMENT') == 'production':
        print("✅ Production environment detected - using system environment variables")
        return

    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        env_path = os.path.join(script_dir, '.env')

        print("🔄 Syncing secrets from Infisical to .env...")
        # Updated command for newer Infisical CLI
        result = subprocess.run(
            ["infisical", "export", "--env=dev", "--format=dotenv"],
            capture_output=True,
            text=True,
            cwd=script_dir
        )
        if result.returncode == 0:
            # Write the output to .env file in the same directory as this script
            with open(env_path, 'w') as f:
                f.write(result.stdout)
            print(f"✅ Secrets synced to {env_path} successfully!")
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


# Sync secrets on startup
sync_secrets()

# Load environment variables from the backend directory
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, '.env'))

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

# Initialize FastAPI
app = FastAPI(
    title="Aegis Backend API",
    description="Backend API for Aegis infrastructure issue reporting and food reviews",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
# Get allowed origins from environment variable (comma-separated list)
frontend_urls = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [url.strip() for url in frontend_urls.split(",")]

# In development, allow all origins for convenience
if os.getenv("ENVIRONMENT") != "production":
    allowed_origins = ["*"]
    print("⚠️  Development mode: Allowing all CORS origins")
else:
    # Always allow these production domains
    production_origins = [
        "https://findwithyummy.netlify.app",
        "https://yummy-wehd.onrender.com"
    ]
    # Add any custom domains from env var
    allowed_origins = list(set(production_origins + allowed_origins))
    print(f"✅ Production mode: CORS restricted to {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers for dashboard/civic infrastructure features AND Twilio/reservations
app.include_router(issues.router)
app.include_router(ai.router)
app.include_router(audio.router)
app.include_router(config.router)
app.include_router(reservations.router, prefix="/api")
app.include_router(twilio_webhooks.router, prefix="/api")

# Import and include voice router
app.include_router(voice.router, prefix="/api")

# Import and include invites router
app.include_router(invites.router, prefix="/api")

# Import and include friends graph router
app.include_router(friends_graph.router, prefix="/api")

# Import and include NLP router
app.include_router(nlp.router)

# Import and include iOS friends management routers
app.include_router(profiles.router, prefix="/api")
app.include_router(friends.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(preferences.router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Aegis API is running",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check with service status."""
    status = {"status": "healthy", "services": {}}

    # Check Gemini service
    try:
        gemini = get_gemini_service()
        status["services"]["gemini"] = "configured"
    except Exception as e:
        status["services"]["gemini"] = f"error: {str(e)}"
        status["status"] = "degraded"

    # Check Supabase service
    try:
        supabase = get_supabase_service()
        status["services"]["supabase"] = "configured"
    except Exception as e:
        status["services"]["supabase"] = f"error: {str(e)}"
        status["status"] = "degraded"

    return status


async def analyze_and_update_description(image_id: int, image_bytes: bytes, latitude: float = None, longitude: float = None):
    """
    Background task: Analyze image with AI, find nearby restaurants, and update database.
    This runs asynchronously so the user doesn't have to wait.
    """
    try:
        print(f"[BACKGROUND AI] Starting analysis for image {image_id}...")

        # Get services
        gemini_service = get_gemini_service()
        supabase_service = get_supabase_service()
        places_service = get_places_service()

        # Skip restaurant search for faster AI analysis
        # User manually enters restaurant name anyway, so auto-suggestion isn't critical
        print(
            f"[BACKGROUND AI] Skipping restaurant search for speed - analyzing food only")

        # Analyze with Gemini AI (basic analysis only)
        analysis = gemini_service.analyze_food_image(image_bytes)
        analysis['restaurant'] = 'Unknown'
        print(f"[BACKGROUND AI] Dish: {analysis['dish']}")
        print(f"[BACKGROUND AI] Cuisine: {analysis['cuisine']}")

        # Cache the AI-suggested restaurant (temporary, for auto-fill)
        if analysis.get('restaurant') and analysis['restaurant'] != 'Unknown':
            restaurant_suggestions_cache[image_id] = analysis['restaurant']
            print(
                f"[BACKGROUND AI] Cached restaurant suggestion: {analysis['restaurant']}")

        # Update the images table with AI analysis (dish & cuisine only)
        supabase_service.update_image_description(
            image_id,
            analysis['description'],
            dish=analysis['dish'],
            cuisine=analysis['cuisine']
        )
        print(f"[BACKGROUND AI] Updated image {image_id} with AI analysis")

    except Exception as e:
        print(
            f"[BACKGROUND AI ERROR] Failed to analyze image {image_id}: {str(e)}")


@app.post("/api/images/upload")
async def upload_image(
    user_id: str = Depends(get_user_id_from_token),
    image: UploadFile = File(...),
    geolocation: str = Form(...),
    timestamp: str = Form(...),
    latitude: float = Form(None),  # Optional: for restaurant matching
    longitude: float = Form(None)  # Optional: for restaurant matching
):
    """
    Upload image and create database entry immediately.
    AI analysis happens in background - user doesn't wait for it.

    Args:
        user_id: Extracted from JWT token (automatic)
        image: Uploaded food image file
        geolocation: Location string (lat,long) for display
        timestamp: ISO8601 timestamp
        latitude: Optional latitude for restaurant matching
        longitude: Optional longitude for restaurant matching

    Returns:
        JSON with image_id and image_url (immediate response)
    """
    try:
        print(f"[UPLOAD IMAGE] Request from user: {user_id}")
        print(
            f"[UPLOAD IMAGE] Location: {geolocation} (lat: {latitude}, lon: {longitude})")
        print(f"[UPLOAD IMAGE] Time: {timestamp}")
        print(
            f"[UPLOAD IMAGE] Image: {image.filename}, Type: {image.content_type}")

        # Validate image type
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Read image bytes
        image_bytes = await image.read()

        print(f"[UPLOAD IMAGE] Image size: {len(image_bytes)} bytes")

        # Determine file extension
        extension = "jpg"
        if "png" in image.content_type.lower():
            extension = "png"
        elif "jpeg" in image.content_type.lower() or "jpg" in image.content_type.lower():
            extension = "jpg"

        # Get Supabase service
        supabase_service = get_supabase_service()

        # 1. Upload image to storage
        print(f"[UPLOAD IMAGE] Uploading to storage...")
        image_url = supabase_service.upload_image(
            user_id, image_bytes, extension)
        print(f"[UPLOAD IMAGE] Uploaded: {image_url}")

        # 2. Create entry in images table (with placeholder description)
        print(f"[UPLOAD IMAGE] Creating images table entry...")
        image_record = supabase_service.create_food_image(
            image_url=image_url,
            food_description="Analyzing...",  # Placeholder while AI processes
            geolocation=geolocation,
            timestamp=timestamp
        )

        image_id = image_record["id"]
        print(f"[UPLOAD IMAGE] Success! Image ID: {image_id}")

        # 3. Start AI analysis in background (non-blocking) with restaurant matching
        asyncio.create_task(analyze_and_update_description(
            image_id,
            image_bytes,
            latitude=latitude,
            longitude=longitude
        ))

        # Return immediately - user can start filling form
        return {
            "image_id": image_id,
            "image_url": image_url
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD IMAGE ERROR] {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Image upload failed: {str(e)}")


async def update_taste_profile_background(user_id: str, review_id: str):
    """
    Background task to update user's taste profile after review submission.
    Runs asynchronously without blocking the API response.

    Args:
        user_id: User UUID
        review_id: Review UUID that was just created
    """
    try:
        print(
            f"[TASTE PROFILE] Starting background update for user {user_id}, review {review_id}")

        # Get services
        supabase_service = get_supabase_service()
        taste_profile_service = get_taste_profile_service()

        # Fetch full review data with joined image
        review_data = supabase_service.get_review_with_image(review_id)

        if not review_data:
            print(
                f"[TASTE PROFILE] Review {review_id} not found, skipping profile update")
            return

        # Update taste profile
        updated_prefs = await taste_profile_service.update_profile_from_review(
            user_id=user_id,
            review_data=review_data
        )

        print(f"[TASTE PROFILE] ✅ Profile updated successfully!")
        print(f"[TASTE PROFILE] New preferences: {updated_prefs}")

    except Exception as e:
        # Log error but don't crash (background task should be resilient)
        print(f"[TASTE PROFILE ERROR] Failed to update profile: {str(e)}")
        import traceback
        traceback.print_exc()


@app.post("/api/reviews/submit")
async def submit_review(
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_user_id_from_token),
    image_id: int = Form(...),
    user_review: str = Form(...),
    restaurant_name: str = Form(...),
    rating: int = Form(...)
):
    """
    Create review entry linked to an existing image.
    Image should already be uploaded via /api/images/upload

    After creating the review, automatically updates user's taste profile
    in the background based on the review content.

    Args:
        background_tasks: FastAPI background tasks (automatic)
        user_id: Extracted from JWT token (automatic)
        image_id: ID from images table (returned from upload endpoint)
        user_review: User's written review
        restaurant_name: Name of the restaurant
        rating: Star rating (1-5)

    Returns:
        Created review object
    """
    try:
        print(f"[SUBMIT REVIEW] Request from user: {user_id}")
        print(f"[SUBMIT REVIEW] Image ID: {image_id}")
        print(
            f"[SUBMIT REVIEW] Restaurant: {restaurant_name}, Rating: {rating}/5")
        print(f"[SUBMIT REVIEW] User Review: {user_review}")

        # Validate rating
        if rating < 1 or rating > 5:
            raise HTTPException(
                status_code=400, detail="Rating must be between 1 and 5")

        # Validate required fields
        if not restaurant_name.strip():
            raise HTTPException(
                status_code=400, detail="Restaurant name is required")

        if not user_review.strip():
            raise HTTPException(
                status_code=400, detail="Review text is required")

        # Get Supabase service
        supabase_service = get_supabase_service()

        # Create review entry in database
        print(f"[SUBMIT REVIEW] Creating review entry...")
        review = supabase_service.create_review(
            user_id=user_id,
            image_id=image_id,
            user_review=user_review,
            restaurant_name=restaurant_name,
            rating=rating
        )

        print(f"[SUBMIT REVIEW] Review created: {review.get('id')}")

        # 🆕 Trigger background task to update taste profile
        # TODO: Re-enable when update_profile_from_review method is implemented
        # background_tasks.add_task(
        #     update_taste_profile_background,
        #     user_id=user_id,
        #     review_id=review['id']
        # )
        # print(f"[SUBMIT REVIEW] ✅ Taste profile update queued")

        return review

    except HTTPException:
        raise
    except Exception as e:
        print(f"[SUBMIT REVIEW ERROR] {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Review submission failed: {str(e)}")


@app.get("/api/images/{image_id}")
async def get_image(image_id: int, user_id: str = Depends(get_user_id_from_token)):
    """
    Get a single image by ID (for fetching AI analysis results).
    Includes AI-suggested restaurant from cache (if available).

    Args:
        image_id: ID of the image
        user_id: Extracted from JWT token (automatic)

    Returns:
        Image data with AI analysis + suggested_restaurant
    """
    try:
        print(f"[GET_IMAGE] Request for image {image_id} from user: {user_id}")

        supabase_service = get_supabase_service()
        image = supabase_service.get_image_by_id(image_id)

        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        # Add AI-suggested restaurant from cache (temporary, not stored in DB)
        suggested_restaurant = restaurant_suggestions_cache.get(image_id)
        if suggested_restaurant:
            image['suggested_restaurant'] = suggested_restaurant
            print(
                f"[GET_IMAGE] Including suggested restaurant: {suggested_restaurant}")
        else:
            image['suggested_restaurant'] = None

        return image

    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET_IMAGE ERROR] {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch image: {str(e)}")


@app.get("/api/reviews")
async def get_reviews(user_id: str = Depends(get_user_id_from_token)):
    """
    Get all reviews for authenticated user.

    Args:
        user_id: Extracted from JWT token (automatic)

    Returns:
        List of user's reviews with image data
    """
    try:
        print(f"[GET_REVIEWS] Request from user: {user_id}")

        # Get Supabase service
        supabase_service = get_supabase_service()

        # Fetch user's reviews
        reviews = supabase_service.get_user_reviews(user_id)

        print(f"[GET_REVIEWS] Found {len(reviews)} reviews")

        return reviews

    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET_REVIEWS ERROR] {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch reviews: {str(e)}")


@app.get("/api/reviews/all")
async def get_all_reviews():
    """
    Get all reviews (for dashboard - no auth required for MVP).

    Returns:
        List of all reviews with image data
    """
    try:
        print(f"[GET_ALL_REVIEWS] Request received")

        # Get Supabase service
        supabase_service = get_supabase_service()

        # Fetch all reviews
        reviews = supabase_service.get_all_reviews()

        print(f"[GET_ALL_REVIEWS] Found {len(reviews)} total reviews")

        return reviews

    except Exception as e:
        print(f"[GET_ALL_REVIEWS ERROR] {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch reviews: {str(e)}")


@app.get("/api/food-graph")
async def get_food_graph(
    user_id: str = Depends(get_user_id_from_token),
    min_similarity: float = 0.5
):
    """
    Generate food similarity graph for a user's reviews.
    Returns nodes (foods) and edges (similarities) for visualization.

    Args:
        user_id: Extracted from JWT token (automatic)
        min_similarity: Minimum similarity threshold for creating edges (0.0 - 1.0)

    Returns:
        Graph data with nodes and edges:
        {
            "nodes": [
                {
                    "id": 123,
                    "dish": "Spaghetti Carbonara",
                    "cuisine": "Italian",
                    "restaurant": "Joe's Italian",
                    "rating": 5,
                    "image_url": "https://...",
                    "description": "...",
                    "timestamp": "2025-10-04T..."
                },
                ...
            ],
            "edges": [
                {
                    "source": 123,
                    "target": 456,
                    "weight": 0.87
                },
                ...
            ]
        }
    """
    try:
        print(
            f"[FOOD_GRAPH] Request from user: {user_id}, min_similarity: {min_similarity}")

        # Validate min_similarity
        if min_similarity < 0.0 or min_similarity > 1.0:
            raise HTTPException(
                status_code=400, detail="min_similarity must be between 0.0 and 1.0")

        # Get services
        supabase_service = get_supabase_service()
        embedding_service = get_embedding_service()

        # Fetch user's reviews with image data
        reviews = supabase_service.get_user_reviews(user_id)

        if not reviews:
            print(f"[FOOD_GRAPH] No reviews found for user {user_id}")
            return {"nodes": [], "edges": []}

        print(f"[FOOD_GRAPH] Found {len(reviews)} reviews")

        # Build nodes with embeddings
        nodes = []
        embeddings = []

        for review in reviews:
            # Get image data (nested in review)
            images = review.get('images', {})

            if not images:
                continue

            image_id = images.get('id')
            dish = images.get('dish', 'Unknown Dish')
            cuisine = images.get('cuisine', 'Unknown')
            description = images.get('description', '')
            image_url = images.get('image_url', '')
            timestamp = images.get('timestamp', '')

            # Review-specific data
            restaurant_name = review.get('restaurant_name', 'Unknown')
            rating = review.get('overall_rating', 0)

            # Generate embedding from food data
            embedding = embedding_service.generate_food_embedding(
                dish, cuisine, description)

            node = {
                "id": image_id,
                "dish": dish,
                "cuisine": cuisine,
                "restaurant": restaurant_name,
                "rating": rating,
                "image_url": image_url,
                "description": description[:100] + "..." if len(description) > 100 else description,
                "timestamp": timestamp
            }

            nodes.append(node)
            embeddings.append(embedding)

        print(f"[FOOD_GRAPH] Built {len(nodes)} nodes")

        # Calculate pairwise similarities and build edges
        edges = []

        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                similarity = embedding_service.calculate_similarity(
                    embeddings[i], embeddings[j])

                if similarity >= min_similarity:
                    edge = {
                        "source": nodes[i]["id"],
                        "target": nodes[j]["id"],
                        "weight": round(similarity, 3)
                    }
                    edges.append(edge)

        print(
            f"[FOOD_GRAPH] Found {len(edges)} edges (min_similarity={min_similarity})")

        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_foods": len(nodes),
                "total_connections": len(edges),
                "min_similarity": min_similarity
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[FOOD_GRAPH ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to generate food graph: {str(e)}")


def create_taste_profile_summary(profile_text: str) -> str:
    """
    Create a concise summary of the taste profile for iOS display.
    Extracts key preferences and creates a short, readable summary.
    
    Args:
        profile_text: Full taste profile text from database
        
    Returns:
        Shortened, summarized version for mobile display
    """
    if not profile_text or len(profile_text.strip()) < 50:
        return ""
    
    # Extract key elements using simple text processing
    text = profile_text.lower()
    
    # Find cuisine preferences
    cuisines = []
    cuisine_keywords = {
        'thai': 'Thai', 'japanese': 'Japanese', 'italian': 'Italian', 
        'chinese': 'Chinese', 'mexican': 'Mexican', 'indian': 'Indian',
        'american': 'American', 'french': 'French', 'korean': 'Korean',
        'vietnamese': 'Vietnamese', 'greek': 'Greek', 'spanish': 'Spanish'
    }
    
    for keyword, display_name in cuisine_keywords.items():
        if keyword in text and display_name not in cuisines:
            cuisines.append(display_name)
    
    # Find atmosphere preferences
    atmospheres = []
    atmosphere_keywords = {
        'casual': 'casual', 'upscale': 'upscale', 'romantic': 'romantic',
        'cozy': 'cozy', 'modern': 'modern', 'traditional': 'traditional',
        'outdoor': 'outdoor seating', 'intimate': 'intimate'
    }
    
    for keyword, display_name in atmosphere_keywords.items():
        if keyword in text and display_name not in atmospheres:
            atmospheres.append(display_name)
    
    # Find price preferences
    price_preference = ""
    if '$$' in profile_text or 'mid-range' in text:
        price_preference = "mid-range"
    elif '$$$' in profile_text or 'upscale' in text:
        price_preference = "upscale"
    elif '$' in profile_text or 'budget' in text:
        price_preference = "budget-friendly"
    
    # Build summary
    summary_parts = []
    
    # Cuisine summary
    if cuisines:
        if len(cuisines) == 1:
            summary_parts.append(f"love {cuisines[0]} cuisine")
        elif len(cuisines) == 2:
            summary_parts.append(f"enjoy {cuisines[0]} and {cuisines[1]} cuisine")
        else:
            # For 3+ cuisines, be more specific
            cuisine_list = ", ".join(cuisines[:3])  # Show up to 3
            if len(cuisines) > 3:
                cuisine_list += f" and {len(cuisines) - 3} other cuisines"
            summary_parts.append(f"enjoy {cuisine_list}")
    
    # Atmosphere summary
    if atmospheres:
        if len(atmospheres) == 1:
            summary_parts.append(f"prefer {atmospheres[0]} dining atmospheres")
        elif len(atmospheres) == 2:
            summary_parts.append(f"prefer {atmospheres[0]} and {atmospheres[1]} dining")
        else:
            # For 3+ atmospheres, be more descriptive
            atm_list = ", ".join(atmospheres[:2])
            summary_parts.append(f"prefer {atm_list} and other comfortable dining settings")
    
    # Price summary
    if price_preference:
        summary_parts.append(f"likes {price_preference} restaurants")
    
    # Combine into readable summary
    if summary_parts:
        summary = "You " + ", ".join(summary_parts) + "."
        # Target length for 2 lines on mobile (around 150-200 characters)
        if len(summary) > 200:
            # Take first two parts for more detail
            if len(summary_parts) >= 2:
                summary = f"You {summary_parts[0]} and {summary_parts[1]}."
            else:
                # If only one part, truncate it to fit 2 lines
                summary = f"You {summary_parts[0]}."
                if len(summary) > 200:
                    summary = summary[:197] + "..."
        return summary
    
    # Fallback: create a 2-line summary from first two sentences
    sentences = [s.strip() for s in profile_text.split('.') if s.strip()]
    if sentences:
        if len(sentences) >= 2:
            # Combine first two sentences for 2-line summary
            summary = f"{sentences[0]}. {sentences[1]}."
            if len(summary) > 200:
                summary = summary[:197] + "..."
            return summary
        else:
            # Single sentence - make it more descriptive if too short
            first_sentence = sentences[0]
            if len(first_sentence) > 200:
                return first_sentence[:197] + "..."
            elif len(first_sentence) < 80:
                # If too short, try to add more context
                return f"You have diverse taste preferences. {first_sentence}"
            return first_sentence
    
    return ""


@app.get("/api/profile/taste-profile-text")
async def get_taste_profile_text(
    user_id: str = Depends(get_user_id_from_token)
):
    """
    Get user's taste profile as natural language text.
    
    Returns:
        Natural language description of user's food preferences
    """
    try:
        print(f"\n{'='*60}")
        print(f"[TASTE PROFILE TEXT API] 📝 Getting taste profile text for user: {user_id[:8]}...")
        print(f"{'='*60}")
        
        # Get taste profile service
        taste_profile_service = get_taste_profile_service()
        
        # Get user's taste profile text
        profile_text = taste_profile_service.get_current_preferences_text(user_id)
        
        # Create a summarized version for iOS display (keep original in DB)
        summarized_text = ""
        if profile_text:
            # Extract key preferences and create a concise summary
            summarized_text = create_taste_profile_summary(profile_text)
        
        print(f"[TASTE PROFILE TEXT API] ✅ Profile text retrieved ({len(profile_text)} chars)")
        print(f"[TASTE PROFILE TEXT API] Summarized to ({len(summarized_text)} chars)")
        if summarized_text:
            print(f"[TASTE PROFILE TEXT API] Summary: {summarized_text}")
        else:
            print(f"[TASTE PROFILE TEXT API] No profile text found")
        print(f"{'='*60}\n")
        
        return {
            "status": "success",
            "profile_text": summarized_text,  # Return summarized version
            "has_profile": bool(profile_text.strip())
        }
        
    except Exception as e:
        print(f"[TASTE PROFILE TEXT API ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get taste profile text: {str(e)}"
        )


@app.post("/api/restaurants/search/test")
async def search_restaurants_test(
    query: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    user_id: str = Form("test-user-123")  # Optional test user ID
):
    """
    TEST ENDPOINT (No Auth) - Natural language restaurant search using LLM with tool calls.
    Use this for Stage 1 testing without authentication.

    Args:
        query: User's natural language query (e.g., "Quiet Italian spot with outdoor seating")
        latitude: User's current latitude
        longitude: User's current longitude
        user_id: Optional test user ID (defaults to "test-user-123")

    Returns:
        Search results with top restaurants matching query and user preferences

    Example:
        POST /api/restaurants/search/test
        Form data:
            query=Italian restaurant near me
            latitude=40.7580
            longitude=-73.9855
    """
    try:
        print(f"[SEARCH RESTAURANTS TEST] Request from user: {user_id}")
        print(f"[SEARCH RESTAURANTS TEST] Query: '{query}'")
        print(f"[SEARCH RESTAURANTS TEST] Location: ({latitude}, {longitude})")

        # Get restaurant search service
        search_service = get_restaurant_search_service()

        # Execute search (currently Stage 1 - tool testing only)
        results = await search_service.search_restaurants(
            query=query,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude
        )

        print(f"[SEARCH RESTAURANTS TEST] ✅ Search completed")
        return results

    except HTTPException:
        raise
    except Exception as e:
        print(f"[SEARCH RESTAURANTS TEST ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Restaurant search failed: {str(e)}")


@app.post("/api/restaurants/nearby")
async def get_nearby_restaurants(
    user_id: str = Depends(get_user_id_from_token),
    latitude: float = Form(...),
    longitude: float = Form(...),
    radius: int = Form(2000),
    limit: int = Form(20)
):
    """
    Fetch nearby restaurants immediately without LLM analysis.
    Returns highest rated and most reviewed restaurants from database.

    Args:
        user_id: Extracted from JWT token (automatic)
        latitude: User's current latitude
        longitude: User's current longitude
        radius: Search radius in meters (default: 2000m)
        limit: Maximum number of restaurants (default: 20)

    Returns:
        List of nearby high-quality restaurants sorted by quality score
    """
    try:
        print(f"[NEARBY RESTAURANTS] Request from user: {user_id}")
        print(f"[NEARBY RESTAURANTS] Location: ({latitude}, {longitude})")
        print(f"[NEARBY RESTAURANTS] Radius: {radius}m, Limit: {limit}")

        # Get database service
        restaurant_db_service = get_restaurant_db_service()

        # Fetch nearby restaurants with quality filter
        restaurants = restaurant_db_service.get_nearby_restaurants(
            latitude=latitude,
            longitude=longitude,
            radius_meters=radius,
            limit=limit * 2,  # Get more for quality sorting
            min_rating=3.5,  # Reasonable minimum
            min_reviews=10  # Filter out unproven spots
        )

        # Sort by quality score: rating * log(reviews + 1)
        import math
        for r in restaurants:
            review_count = r.get('user_ratings_total', 0) or 0
            r['quality_score'] = r['rating'] * math.log(review_count + 1)

        restaurants.sort(key=lambda r: r['quality_score'], reverse=True)
        restaurants = restaurants[:limit]

        print(
            f"[NEARBY RESTAURANTS] ✅ Found {len(restaurants)} high-quality restaurants")
        return {
            "status": "success",
            "restaurants": restaurants,
            "count": len(restaurants)
        }

    except Exception as e:
        print(f"[NEARBY RESTAURANTS ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch nearby restaurants: {str(e)}")


@app.get("/api/friends/search")
async def search_friends(
    user_id: str = Depends(get_user_id_from_token),
    query: str = ""
):
    """
    Get user's friends list, optionally filtered by username.
    Used for @ mention autocomplete.

    Args:
        user_id: Extracted from JWT token (automatic)
        query: Optional search query to filter friends by username or display name

    Returns:
        List of friends with id, username, display_name, avatar_url

    Example:
        GET /api/friends/search?query=jul
        Returns friends whose username or display_name contains "jul"
    """
    try:
        print(f"[FRIENDS SEARCH] Request from user: {user_id}")
        print(f"[FRIENDS SEARCH] Query: '{query}'")

        # Get Supabase service
        supabase_service = get_supabase_service()

        # Step 1: Get current user's friends array
        user_response = supabase_service.client.table("profiles")\
            .select("friends")\
            .eq("id", user_id)\
            .single()\
            .execute()

        if not user_response.data:
            return {"friends": []}

        friend_ids = user_response.data.get("friends", [])

        if not friend_ids:
            return {"friends": []}

        print(f"[FRIENDS SEARCH] User has {len(friend_ids)} friends")

        # Step 2: Get friend profiles
        friends_query = supabase_service.client.table("profiles")\
            .select("id, username, display_name, avatar_url")\
            .in_("id", friend_ids)

        # Apply search filter if query provided
        if query.strip():
            # Search in both username and display_name
            friends_query = friends_query.or_(
                f"username.ilike.%{query}%,display_name.ilike.%{query}%"
            )

        friends_response = friends_query.execute()

        friends = friends_response.data or []

        print(f"[FRIENDS SEARCH] ✅ Returning {len(friends)} friends")

        return {"friends": friends}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[FRIENDS SEARCH ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Friends search failed: {str(e)}")


@app.post("/api/restaurants/search")
async def search_restaurants(
    user_id: str = Depends(get_user_id_from_token),
    query: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """
    Natural language restaurant search using LLM with tool calls.

    Args:
        user_id: Extracted from JWT token (automatic)
        query: User's natural language query (e.g., "Quiet Italian spot with outdoor seating")
        latitude: User's current latitude
        longitude: User's current longitude

    Returns:
        Search results with top restaurants matching query and user preferences

    Example query:
        POST /api/restaurants/search
        {
            "query": "Italian restaurant near me",
            "latitude": 40.7580,
            "longitude": -73.9855
        }
    """
    try:
        import time
        start_time = time.time()

        print(f"\n{'='*80}")
        print(f"[SEARCH RESTAURANTS] 🔍 NEW SEARCH REQUEST")
        print(f"{'='*80}")
        print(f"[SEARCH RESTAURANTS] User: {user_id[:8]}...")
        print(f"[SEARCH RESTAURANTS] Query: '{query}'")
        print(f"[SEARCH RESTAURANTS] Location: ({latitude}, {longitude})")
        print(f"[SEARCH RESTAURANTS] Timestamp: {time.strftime('%H:%M:%S')}")
        print(f"{'='*80}\n")

        # Get restaurant search service
        print(f"[SEARCH RESTAURANTS] Step 1/3: Getting search service...")
        search_service = get_restaurant_search_service()
        print(f"[SEARCH RESTAURANTS] ✅ Search service ready")

        # Execute search (currently Stage 1 - tool testing only)
        print(f"[SEARCH RESTAURANTS] Step 2/3: Calling search_restaurants method...")
        results = await search_service.search_restaurants(
            query=query,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude
        )

        # Track the search for implicit signals learning
        try:
            print(f"\n[SEARCH TRACKING] 🔍 Tracking search query...")
            print(f"[SEARCH TRACKING] Query: '{query}'")
            print(f"[SEARCH TRACKING] User: {user_id[:8]}...")
            print(
                f"[SEARCH TRACKING] Results: {len(results.get('top_restaurants', []))} restaurants")

            from services.implicit_signals_service import get_implicit_signals_service
            signals_service = get_implicit_signals_service()
            signals_service.track_search(
                user_id=user_id,
                query=query,
                latitude=latitude,
                longitude=longitude,
                metadata={'result_count': len(
                    results.get('top_restaurants', []))}
            )
            print(f"[SEARCH TRACKING] ✅ Search tracked successfully\n")
        except Exception as track_error:
            print(
                f"[SEARCH TRACKING] ❌ Warning: Failed to track search: {track_error}")
            # Don't fail the search if tracking fails

        elapsed = time.time() - start_time
        print(f"\n{'='*80}")
        print(
            f"[SEARCH RESTAURANTS] Step 3/3: ✅ SEARCH COMPLETED in {elapsed:.2f}s")
        print(
            f"[SEARCH RESTAURANTS] Results: {len(results.get('top_restaurants', []))} top restaurants")
        print(f"{'='*80}\n")
        return results

    except HTTPException:
        raise
    except Exception as e:
        print(f"[SEARCH RESTAURANTS ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Restaurant search failed: {str(e)}")


@app.post("/api/restaurants/discover")
async def discover_restaurants(
    user_id: str = Depends(get_user_id_from_token),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """
    Discover personalized restaurant recommendations.
    Returns 2 restaurants based on user's preferences and location.

    Args:
        user_id: Extracted from JWT token (automatic)
        latitude: User's current latitude
        longitude: User's current longitude

    Returns:
        { "status": "success", "restaurants": [...], "reasoning": "..." }

    Example:
        POST /api/restaurants/discover
        Form data:
            latitude=40.4406
            longitude=-79.9959
    """
    try:
        import time
        start_time = time.time()

        print(f"\n{'='*80}")
        print(f"[DISCOVER] 🌟 NEW DISCOVER REQUEST")
        print(f"{'='*80}")
        print(f"[DISCOVER] User: {user_id[:8]}...")
        print(f"[DISCOVER] Location: ({latitude}, {longitude})")
        print(f"[DISCOVER] Timestamp: {time.strftime('%H:%M:%S')}")
        print(f"{'='*80}\n")

        # Get restaurant search service
        search_service = get_restaurant_search_service()

        # Use a neutral discovery query to get personalized recommendations
        query = "restaurants that match my taste profile perfectly"

        print(f"[DISCOVER] Using query: '{query}'")

        # Execute search
        results = await search_service.search_restaurants(
            query=query,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude
        )

        # Return only top 2 restaurants for discover
        top_restaurants = results.get('top_restaurants', [])[:2]

        elapsed = time.time() - start_time
        print(f"\n{'='*80}")
        print(f"[DISCOVER] ✅ COMPLETED in {elapsed:.2f}s")
        print(f"[DISCOVER] Returning {len(top_restaurants)} restaurants")
        print(f"{'='*80}\n")

        return {
            "status": "success",
            "restaurants": top_restaurants,
            "reasoning": results.get('reasoning', ''),
            "location": {
                "latitude": latitude,
                "longitude": longitude
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[DISCOVER ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@app.post("/api/restaurants/discover-ios")
async def discover_restaurants_ios(
    user_id: str = Depends(get_user_id_from_token),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """
    iOS-optimized discover endpoint - faster version with 10 restaurant candidates.
    Returns 2 restaurants based on user's preferences and location.

    Args:
        user_id: Extracted from JWT token (automatic)
        latitude: User's current latitude
        longitude: User's current longitude

    Returns:
        { "status": "success", "restaurants": [...], "reasoning": "..." }

    Example:
        POST /api/restaurants/discover-ios
        Form data:
            latitude=40.4406
            longitude=-79.9959
    """
    try:
        import time
        start_time = time.time()

        print(f"\n{'='*80}")
        print(f"[DISCOVER-iOS] 🌟 NEW iOS DISCOVER REQUEST")
        print(f"{'='*80}")
        print(f"[DISCOVER-iOS] User: {user_id[:8]}...")
        print(f"[DISCOVER-iOS] Location: ({latitude}, {longitude})")
        print(f"[DISCOVER-iOS] Timestamp: {time.strftime('%H:%M:%S')}")
        print(f"{'='*80}\n")

        # Get restaurant search service
        search_service = get_restaurant_search_service()

        # Use a neutral discovery query to get personalized recommendations
        query = "restaurants that match my taste profile perfectly"

        print(f"[DISCOVER-iOS] Using query: '{query}'")
        print(f"[DISCOVER-iOS] Limiting to 8 candidates for speed")

        # Execute search with iOS optimization (8 candidates for faster LLM response)
        results = await search_service.search_restaurants(
            query=query,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            max_candidates=8
        )

        # Return only top 2 restaurants for discover
        top_restaurants = results.get('top_restaurants', [])[:2]

        elapsed = time.time() - start_time
        print(f"\n{'='*80}")
        print(f"[DISCOVER-iOS] ✅ COMPLETED in {elapsed:.2f}s")
        print(f"[DISCOVER-iOS] Returning {len(top_restaurants)} restaurants")

        # Debug: Check reasoning in each restaurant before returning
        for i, r in enumerate(top_restaurants, 1):
            has_reasoning = 'reasoning' in r and r.get('reasoning')
            status = "✅" if has_reasoning else "❌"
            print(f"{status} [DISCOVER-iOS] Restaurant {i}: {r.get('name')} - {'HAS REASONING' if has_reasoning else 'NO REASONING'}")

        print(f"{'='*80}\n")

        return {
            "status": "success",
            "restaurants": top_restaurants,
            "reasoning": results.get('reasoning', ''),
            "location": {
                "latitude": latitude,
                "longitude": longitude
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[DISCOVER-iOS ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@app.post("/api/restaurants/search-ios")
async def search_restaurants_ios(
    user_id: str = Depends(get_user_id_from_token),
    query: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """
    iOS-optimized search endpoint - faster version with 10 restaurant candidates.
    Natural language restaurant search using LLM with tool calls.

    Args:
        user_id: Extracted from JWT token (automatic)
        query: User's natural language query (e.g., "Quiet Italian spot with outdoor seating")
        latitude: User's current latitude
        longitude: User's current longitude

    Returns:
        Search results with top restaurants matching query and user preferences

    Example query:
        POST /api/restaurants/search-ios
        {
            "query": "Italian restaurant near me",
            "latitude": 40.7580,
            "longitude": -73.9855
        }
    """
    try:
        import time
        start_time = time.time()

        print(f"\n{'='*80}")
        print(f"[SEARCH-iOS] 🔍 NEW iOS SEARCH REQUEST")
        print(f"{'='*80}")
        print(f"[SEARCH-iOS] User: {user_id[:8]}...")
        print(f"[SEARCH-iOS] Query: '{query}'")
        print(f"[SEARCH-iOS] Location: ({latitude}, {longitude})")
        print(f"[SEARCH-iOS] Timestamp: {time.strftime('%H:%M:%S')}")
        print(f"{'='*80}\n")

        # Get restaurant search service
        print(f"[SEARCH-iOS] Step 1/3: Getting search service...")
        search_service = get_restaurant_search_service()
        print(f"[SEARCH-iOS] ✅ Search service ready")
        print(f"[SEARCH-iOS] Limiting to 8 candidates for speed")

        # Execute search with iOS optimization (8 candidates for faster LLM response)
        print(f"[SEARCH-iOS] Step 2/3: Calling search_restaurants method...")
        results = await search_service.search_restaurants(
            query=query,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            max_candidates=8
        )

        # Track the search for implicit signals learning
        try:
            print(f"\n[SEARCH TRACKING] 🔍 Tracking iOS search query...")
            print(f"[SEARCH TRACKING] Query: '{query}'")
            print(f"[SEARCH TRACKING] User: {user_id[:8]}...")
            print(
                f"[SEARCH TRACKING] Results: {len(results.get('top_restaurants', []))} restaurants")

            from services.implicit_signals_service import get_implicit_signals_service
            signals_service = get_implicit_signals_service()
            signals_service.track_search(
                user_id=user_id,
                query=query,
                latitude=latitude,
                longitude=longitude,
                metadata={'result_count': len(
                    results.get('top_restaurants', [])), 'source': 'ios'}
            )
            print(f"[SEARCH TRACKING] ✅ Search tracked successfully\n")
        except Exception as track_error:
            print(
                f"[SEARCH TRACKING] ❌ Warning: Failed to track search: {track_error}")
            # Don't fail the search if tracking fails

        elapsed = time.time() - start_time
        print(f"\n{'='*80}")
        print(
            f"[SEARCH-iOS] Step 3/3: ✅ SEARCH COMPLETED in {elapsed:.2f}s")
        print(
            f"[SEARCH-iOS] Results: {len(results.get('top_restaurants', []))} top restaurants")

        # Debug: Check reasoning in each restaurant before returning
        for i, r in enumerate(results.get('top_restaurants', []), 1):
            has_reasoning = 'reasoning' in r and r.get('reasoning')
            status = "✅" if has_reasoning else "❌"
            print(f"{status} [SEARCH-iOS] Restaurant {i}: {r.get('name')} - {'HAS REASONING' if has_reasoning else 'NO REASONING'}")

        print(f"{'='*80}\n")
        return results

    except HTTPException:
        raise
    except Exception as e:
        print(f"[SEARCH-iOS ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Restaurant search failed: {str(e)}")


@app.post("/api/restaurants/search-group")
async def search_restaurants_group(
    user_id: str = Depends(get_user_id_from_token),
    query: str = Form(...),
    friend_ids: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """
    Search restaurants for a group of users with merged preferences.

    Args:
        user_id: Requesting user (from JWT token, automatic)
        query: Natural language query (e.g., "I want lunch with @julian")
        friend_ids: Comma-separated friend UUIDs (e.g., "uuid1,uuid2,uuid3")
        latitude: User's current latitude
        longitude: User's current longitude

    Returns:
        Top 3 restaurants matching merged group preferences

    Example:
        POST /api/restaurants/search-group
        {
            "query": "I want lunch with @julian",
            "friend_ids": "694e85e9-bb28-4139-9110-429d20a67b93",
            "latitude": 40.7580,
            "longitude": -73.9855
        }
    """
    try:
        print(f"[GROUP SEARCH] Request from user: {user_id}")
        print(f"[GROUP SEARCH] Query: '{query}'")
        print(f"[GROUP SEARCH] Friend IDs: '{friend_ids}'")
        print(f"[GROUP SEARCH] Location: ({latitude}, {longitude})")

        # Parse friend IDs (comma-separated string to list)
        friend_id_list = [fid.strip()
                          for fid in friend_ids.split(",") if fid.strip()]

        # Create complete user list (requesting user + friends)
        all_user_ids = [user_id] + friend_id_list

        print(f"[GROUP SEARCH] Total users in group: {len(all_user_ids)}")

        # Get restaurant search service
        search_service = get_restaurant_search_service()

        # Execute group search
        results = await search_service.search_restaurants_for_group(
            query=query,
            user_ids=all_user_ids,
            latitude=latitude,
            longitude=longitude
        )

        # Track the group search for implicit signals learning
        try:
            print(f"\n[SEARCH TRACKING] 🔍 Tracking GROUP search query...")
            print(f"[SEARCH TRACKING] Query: '{query}'")
            print(f"[SEARCH TRACKING] User: {user_id[:8]}...")
            print(f"[SEARCH TRACKING] Group size: {len(all_user_ids)} people")
            print(
                f"[SEARCH TRACKING] Results: {len(results.get('top_restaurants', []))} restaurants")

            from services.implicit_signals_service import get_implicit_signals_service
            signals_service = get_implicit_signals_service()
            signals_service.track_search(
                user_id=user_id,
                query=query,
                latitude=latitude,
                longitude=longitude,
                metadata={
                    'search_type': 'group',
                    'group_size': len(all_user_ids),
                    'friend_ids': friend_id_list,
                    'result_count': len(results.get('top_restaurants', []))
                }
            )
            print(f"[SEARCH TRACKING] ✅ Group search tracked successfully\n")
        except Exception as track_error:
            print(
                f"[SEARCH TRACKING] ❌ Warning: Failed to track group search: {track_error}")
            # Don't fail the search if tracking fails

        print(f"[GROUP SEARCH] ✅ Group search completed")
        return results

    except HTTPException:
        raise
    except Exception as e:
        print(f"[GROUP SEARCH ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Group restaurant search failed: {str(e)}")


@app.post("/api/restaurants/search-group-stream")
async def search_restaurants_group_stream(
    user_id: str = Depends(get_user_id_from_token),
    query: str = Form(...),
    friend_ids: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """
    Streaming version of group restaurant search with real-time progress updates.

    Yields Server-Sent Events (SSE) with progress updates as the search proceeds.

    Progress messages:
    - Step 1: Analyzing group taste profiles
    - Step 2: Finding nearby restaurants
    - Step 3: Computing compatibility scores
    - Final: Complete results

    Returns:
        StreamingResponse with SSE-formatted progress updates
    """
    try:
        print(f"[GROUP SEARCH STREAM API] Request from user: {user_id}")
        print(f"[GROUP SEARCH STREAM API] Query: '{query}'")
        print(f"[GROUP SEARCH STREAM API] Friend IDs: '{friend_ids}'")

        # Parse friend IDs
        friend_id_list = [fid.strip()
                          for fid in friend_ids.split(",") if fid.strip()]
        all_user_ids = [user_id] + friend_id_list

        print(f"[GROUP SEARCH STREAM API] Total users: {len(all_user_ids)}")

        # Get search service
        search_service = get_restaurant_search_service()

        # Create streaming generator
        async def generate():
            async for sse_message in search_service.search_restaurants_for_group_stream(
                query=query,
                user_ids=all_user_ids,
                latitude=latitude,
                longitude=longitude
            ):
                yield sse_message

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[GROUP SEARCH STREAM API ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Streaming group search failed: {str(e)}")


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
        print(f"\n{'='*80}")
        print(f"[TRACK INTERACTION] 🎯 NEW INTERACTION")
        print(f"{'='*80}")
        print(f"[TRACK INTERACTION] User: {user_id[:8]}...")
        print(f"[TRACK INTERACTION] Type: {interaction_type}")
        print(f"[TRACK INTERACTION] Restaurant: {restaurant_name or 'N/A'}")
        print(f"[TRACK INTERACTION] Place ID: {place_id or 'N/A'}")
        print(f"[TRACK INTERACTION] Cuisine: {cuisine or 'N/A'}")
        print(f"[TRACK INTERACTION] Atmosphere: {atmosphere or 'N/A'}")
        print(
            f"[TRACK INTERACTION] Location: ({latitude}, {longitude})" if latitude and longitude else "[TRACK INTERACTION] Location: N/A")
        print(f"[TRACK INTERACTION] Address: {address or 'N/A'}")
        print(f"{'='*80}")

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

        print(f"[TRACK INTERACTION] ✅ Successfully tracked and saved to database")
        print(f"{'='*80}\n")
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

    print(f"\n{'='*60}")
    print(f"🚀 Starting Aegis Backend API")
    print(f"{'='*60}")
    print(f"📍 Server: http://{host}:{port}")
    print(f"📚 Docs: http://{host}:{port}/docs")
    print(f"🔍 Health: http://{host}:{port}/health")
    print(f"{'='*60}\n")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
        timeout_keep_alive=120  # 2 minutes for long LLM calls
    )
