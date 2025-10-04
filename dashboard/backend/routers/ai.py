"""
AI API router for Gemini integration

Provides endpoints for different Gemini models with customization options
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from ai_service import get_ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AIRequest(BaseModel):
    """Request model for AI generation"""
    prompt: str = Field(..., description="User query or instruction")
    system_instruction: Optional[str] = Field(
        None, description="System behavior instruction")
    temperature: float = Field(
        1.0, ge=0.0, le=2.0, description="Controls randomness (0.0-2.0)")
    max_tokens: Optional[int] = Field(
        None, ge=1, description="Maximum tokens in response")


class AIResponse(BaseModel):
    """Response model for AI generation"""
    success: bool
    text: Optional[str] = None
    model: str
    error: Optional[str] = None
    usage: Optional[dict] = None


class ImageGenerationRequest(BaseModel):
    """Request model for image generation"""
    prompt: str = Field(...,
                        description="Description of the image to generate")
    number_of_images: int = Field(
        1, ge=1, le=4, description="Number of images (1-4)")
    aspect_ratio: str = Field(
        "1:1", description="Image aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4")
    safety_filter_level: str = Field(
        "block_some", description="Safety filter: block_most, block_some, block_few")
    person_generation: str = Field(
        "allow_all", description="Person generation: allow_all, allow_adult, block_all")


class ImageData(BaseModel):
    """Image data model"""
    data: str
    format: str
    mime_type: str


class ImageGenerationResponse(BaseModel):
    """Response model for image generation"""
    success: bool
    images: List[ImageData]
    count: int
    prompt: str
    model: str
    error: Optional[str] = None


class VideoGenerationRequest(BaseModel):
    """Request model for video generation"""
    prompt: str = Field(...,
                        description="Description of the video to generate")
    aspect_ratio: str = Field(
        "16:9", description="Video aspect ratio: 16:9, 9:16, 1:1")
    duration_seconds: int = Field(
        5, ge=2, le=10, description="Video duration in seconds (2-10)")
    poll_interval: int = Field(
        10, ge=5, le=30, description="Seconds between status checks")
    max_wait_time: int = Field(
        600, ge=60, le=1800, description="Max wait time in seconds")


class VideoData(BaseModel):
    """Video data model"""
    data: str
    format: str
    mime_type: str
    duration: int


class VideoGenerationResponse(BaseModel):
    """Response model for video generation"""
    success: bool
    video: Optional[VideoData] = None
    prompt: str
    model: str
    generation_time: Optional[int] = None
    status: Optional[str] = None
    error: Optional[str] = None


@router.post("/generate/flash", response_model=AIResponse)
async def generate_with_flash(request: AIRequest):
    """
    Generate content using Gemini Flash (fastest model)

    - **prompt**: Your question or instruction
    - **system_instruction**: Optional instruction for model behavior
    - **temperature**: Controls randomness (0.0 = deterministic, 2.0 = creative)

    Best for: Quick responses, simple queries, real-time interactions
    """
    try:
        ai_service = get_ai_service()
        result = ai_service.generate_with_flash(
            prompt=request.prompt,
            system_instruction=request.system_instruction,
            temperature=request.temperature
        )
        return AIResponse(**result)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Error in generate_with_flash: {error_details}")
        raise HTTPException(
            status_code=500, detail=f"Flash generation failed: {str(e)}")


@router.post("/generate/pro", response_model=AIResponse)
async def generate_with_pro(request: AIRequest):
    """
    Generate content using Gemini Pro (balanced model)

    - **prompt**: Your question or instruction
    - **system_instruction**: Optional instruction for model behavior
    - **temperature**: Controls randomness (0.0 = deterministic, 2.0 = creative)
    - **max_tokens**: Maximum tokens in response (optional)

    Best for: Complex reasoning, detailed analysis, balanced performance
    """
    try:
        ai_service = get_ai_service()
        result = ai_service.generate_with_pro(
            prompt=request.prompt,
            system_instruction=request.system_instruction,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        return AIResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Pro generation failed: {str(e)}")


@router.post("/generate/lite", response_model=AIResponse)
async def generate_with_lite(request: AIRequest):
    """
    Generate content using Gemini Lite (lightweight model)

    - **prompt**: Your question or instruction
    - **system_instruction**: Optional instruction for model behavior
    - **temperature**: Controls randomness (0.0 = deterministic, 2.0 = creative)

    Best for: Simple tasks, low latency requirements, cost efficiency
    """
    try:
        ai_service = get_ai_service()
        result = ai_service.generate_with_lite(
            prompt=request.prompt,
            system_instruction=request.system_instruction,
            temperature=request.temperature
        )
        return AIResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Lite generation failed: {str(e)}")


@router.get("/models")
async def list_models():
    """
    List available Gemini models with their characteristics
    """
    return {
        "models": [
            {
                "id": "flash",
                "name": "Gemini Flash",
                "model": "gemini-2.0-flash-exp",
                "type": "text",
                "description": "Fastest model for quick responses",
                "best_for": ["Quick queries", "Real-time interactions", "Simple tasks"],
                "endpoint": "/api/ai/generate/flash"
            },
            {
                "id": "pro",
                "name": "Gemini Pro",
                "model": "gemini-1.5-pro",
                "type": "text",
                "description": "Balanced model for complex reasoning",
                "best_for": ["Complex analysis", "Detailed responses", "Balanced performance"],
                "endpoint": "/api/ai/generate/pro"
            },
            {
                "id": "lite",
                "name": "Gemini Lite",
                "model": "gemini-1.5-flash-8b",
                "type": "text",
                "description": "Lightweight model for efficiency",
                "best_for": ["Simple tasks", "Low latency", "Cost efficiency"],
                "endpoint": "/api/ai/generate/lite"
            },
            {
                "id": "imagen",
                "name": "Imagen 4.0",
                "model": "imagen-4.0-generate-001",
                "type": "image",
                "description": "Advanced image generation model",
                "best_for": ["Visual content", "Illustrations", "Concept art"],
                "endpoint": "/api/ai/generate/images"
            },
            {
                "id": "veo",
                "name": "Veo 3.0",
                "model": "veo-3.0-generate-001",
                "type": "video",
                "description": "Video generation model (slow, 2-10 min)",
                "best_for": ["Short video clips", "Animations", "Motion content"],
                "endpoint": "/api/ai/generate/video"
            }
        ]
    }


@router.post("/generate/images", response_model=ImageGenerationResponse)
async def generate_images(request: ImageGenerationRequest):
    """
    Generate images using Imagen 4.0

    - **prompt**: Description of the image you want to create
    - **number_of_images**: How many images to generate (1-4)
    - **aspect_ratio**: Image dimensions (1:1, 16:9, 9:16, 4:3, 3:4)
    - **safety_filter_level**: Content safety filtering level
    - **person_generation**: Policy for generating people in images

    Best for: Visual content creation, illustrations, concept art

    Returns base64-encoded PNG images that can be directly displayed in browsers.
    """
    try:
        ai_service = get_ai_service()
        result = ai_service.generate_images(
            prompt=request.prompt,
            number_of_images=request.number_of_images,
            aspect_ratio=request.aspect_ratio,
            safety_filter_level=request.safety_filter_level,
            person_generation=request.person_generation
        )
        return ImageGenerationResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Image generation failed: {str(e)}")


@router.post("/generate/video", response_model=VideoGenerationResponse)
async def generate_video(request: VideoGenerationRequest):
    """
    Generate video using Veo 3.0

    ⚠️ **Warning**: Video generation takes several minutes to complete!
    This endpoint will wait until the video is ready or timeout occurs.

    - **prompt**: Description of the video you want to create
    - **aspect_ratio**: Video dimensions (16:9, 9:16, 1:1)
    - **duration_seconds**: Video length in seconds (2-10)
    - **poll_interval**: How often to check status (5-30 seconds)
    - **max_wait_time**: Maximum time to wait (60-1800 seconds)

    Best for: Short video clips, animations, motion content

    Returns base64-encoded MP4 video that can be downloaded or displayed.

    Note: This is a long-running operation. Consider using async/background tasks
    in production for better user experience.
    """
    try:
        ai_service = get_ai_service()
        result = ai_service.generate_video(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            duration_seconds=request.duration_seconds,
            poll_interval=request.poll_interval,
            max_wait_time=request.max_wait_time
        )
        return VideoGenerationResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Video generation failed: {str(e)}")


@router.get("/health")
async def ai_health_check():
    """Check if AI service is properly configured"""
    try:
        ai_service = get_ai_service()
        return {
            "status": "healthy",
            "service": "gemini-ai",
            "configured": True,
            "capabilities": {
                "text_generation": True,
                "image_generation": True,
                "video_generation": True
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "gemini-ai",
            "configured": False,
            "error": str(e)
        }
