"""
Aegis Backend API
FastAPI application for handling infrastructure issue submissions.
"""
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import subprocess

# Import services and utilities
from services.gemini_service import get_gemini_service
from services.supabase_service import get_supabase_service
from services.places_service import get_places_service
from services.embedding_service import get_embedding_service
from services.taste_profile_service import get_taste_profile_service
from services.restaurant_search_service import get_restaurant_search_service
from utils.auth import get_user_id_from_token
from supabase_client import SupabaseClient
from routers import issues, ai, audio, config
import asyncio

# In-memory cache for AI-suggested restaurants (temporary until user submits review)
# Key: image_id, Value: restaurant_name
restaurant_suggestions_cache = {}

# Auto-sync secrets from Infisical before starting
def sync_secrets():
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        env_path = os.path.join(script_dir, '.env')

        print("🔄 Syncing secrets from Infisical to .env...")
        # Updated command for newer Infisical CLI
        result = subprocess.run(
            ["infisical", "export", "--format=dotenv"],
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

# Load environment variables from the backend directory
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, '.env'))

# Initialize FastAPI
app = FastAPI(
    title="Aegis Backend API",
    description="Backend API for Aegis infrastructure issue reporting",
    version="1.0.0"
)

# CORS configuration - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers for dashboard/civic infrastructure features
app.include_router(issues.router)
app.include_router(ai.router)
app.include_router(audio.router)
app.include_router(config.router)


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
        
        # Find nearby restaurants if we have coordinates
        nearby_restaurants = []
        if latitude is not None and longitude is not None:
            print(f"[BACKGROUND AI] Finding restaurants near ({latitude}, {longitude})...")
            try:
                nearby_restaurants = places_service.find_nearby_restaurants(
                    latitude=latitude,
                    longitude=longitude,
                    radius=1000,  # 1km radius
                    limit=25
                )
                print(f"[BACKGROUND AI] Found {len(nearby_restaurants)} nearby restaurants")
            except Exception as e:
                print(f"[BACKGROUND AI] Warning: Could not fetch nearby restaurants: {str(e)}")
                # Continue without restaurants - AI can still analyze the food
        else:
            print(f"[BACKGROUND AI] No coordinates provided, skipping restaurant search")
        
        # Analyze with Gemini AI
        if nearby_restaurants:
            analysis = gemini_service.analyze_food_with_restaurant_matching(image_bytes, nearby_restaurants)
            print(f"[BACKGROUND AI] Dish: {analysis['dish']}")
            print(f"[BACKGROUND AI] Cuisine: {analysis['cuisine']}")
            print(f"[BACKGROUND AI] Restaurant: {analysis['restaurant']}")
        else:
            # Fallback to basic analysis if no restaurants
            analysis = gemini_service.analyze_food_image(image_bytes)
            analysis['restaurant'] = 'Unknown'
            print(f"[BACKGROUND AI] Dish: {analysis['dish']}")
            print(f"[BACKGROUND AI] Cuisine: {analysis['cuisine']}")
        
        # Cache the AI-suggested restaurant (temporary, for auto-fill)
        if analysis.get('restaurant') and analysis['restaurant'] != 'Unknown':
            restaurant_suggestions_cache[image_id] = analysis['restaurant']
            print(f"[BACKGROUND AI] Cached restaurant suggestion: {analysis['restaurant']}")
        
        # Update the images table with AI analysis (dish & cuisine only)
        supabase_service.update_image_description(
            image_id, 
            analysis['description'],
            dish=analysis['dish'],
            cuisine=analysis['cuisine']
        )
        print(f"[BACKGROUND AI] Updated image {image_id} with AI analysis")
        
    except Exception as e:
        print(f"[BACKGROUND AI ERROR] Failed to analyze image {image_id}: {str(e)}")


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
        print(f"[UPLOAD IMAGE] Location: {geolocation} (lat: {latitude}, lon: {longitude})")
        print(f"[UPLOAD IMAGE] Time: {timestamp}")
        print(f"[UPLOAD IMAGE] Image: {image.filename}, Type: {image.content_type}")
        
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
        image_url = supabase_service.upload_image(user_id, image_bytes, extension)
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
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")


async def update_taste_profile_background(user_id: str, review_id: str):
    """
    Background task to update user's taste profile after review submission.
    Runs asynchronously without blocking the API response.
    
    Args:
        user_id: User UUID
        review_id: Review UUID that was just created
    """
    try:
        print(f"[TASTE PROFILE] Starting background update for user {user_id}, review {review_id}")
        
        # Get services
        supabase_service = get_supabase_service()
        taste_profile_service = get_taste_profile_service()
        
        # Fetch full review data with joined image
        review_data = supabase_service.get_review_with_image(review_id)
        
        if not review_data:
            print(f"[TASTE PROFILE] Review {review_id} not found, skipping profile update")
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
        print(f"[SUBMIT REVIEW] Restaurant: {restaurant_name}, Rating: {rating}/5")
        print(f"[SUBMIT REVIEW] User Review: {user_review}")
        
        # Validate rating
        if rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        # Validate required fields
        if not restaurant_name.strip():
            raise HTTPException(status_code=400, detail="Restaurant name is required")
        
        if not user_review.strip():
            raise HTTPException(status_code=400, detail="Review text is required")

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
        background_tasks.add_task(
            update_taste_profile_background,
            user_id=user_id,
            review_id=review['id']
        )
        print(f"[SUBMIT REVIEW] ✅ Taste profile update queued")

        return review

    except HTTPException:
        raise
    except Exception as e:
        print(f"[SUBMIT REVIEW ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Review submission failed: {str(e)}")


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
            print(f"[GET_IMAGE] Including suggested restaurant: {suggested_restaurant}")
        else:
            image['suggested_restaurant'] = None
        
        return image
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET_IMAGE ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch image: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")


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
        print(f"[FOOD_GRAPH] Request from user: {user_id}, min_similarity: {min_similarity}")
        
        # Validate min_similarity
        if min_similarity < 0.0 or min_similarity > 1.0:
            raise HTTPException(status_code=400, detail="min_similarity must be between 0.0 and 1.0")
        
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
            embedding = embedding_service.generate_food_embedding(dish, cuisine, description)
            
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
                similarity = embedding_service.calculate_similarity(embeddings[i], embeddings[j])
                
                if similarity >= min_similarity:
                    edge = {
                        "source": nodes[i]["id"],
                        "target": nodes[j]["id"],
                        "weight": round(similarity, 3)
                    }
                    edges.append(edge)
        
        print(f"[FOOD_GRAPH] Found {len(edges)} edges (min_similarity={min_similarity})")
        
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
        raise HTTPException(status_code=500, detail=f"Failed to generate food graph: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"Restaurant search failed: {str(e)}")


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
        print(f"[SEARCH RESTAURANTS] Request from user: {user_id}")
        print(f"[SEARCH RESTAURANTS] Query: '{query}'")
        print(f"[SEARCH RESTAURANTS] Location: ({latitude}, {longitude})")
        
        # Get restaurant search service
        search_service = get_restaurant_search_service()
        
        # Execute search (currently Stage 1 - tool testing only)
        results = await search_service.search_restaurants(
            query=query,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude
        )
        
        print(f"[SEARCH RESTAURANTS] ✅ Search completed")
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SEARCH RESTAURANTS ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Restaurant search failed: {str(e)}")


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
        log_level="info"
    )
