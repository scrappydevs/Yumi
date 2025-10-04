"""
AI Service for Gemini API integration

This module provides modular functions for different Gemini models:
- Flash: Fast responses for quick queries
- Pro: Balanced performance and capability
- Lite: Lightweight model for simple tasks
- Imagen: Image generation
- Veo: Video generation
"""
import os
import time
import base64
from io import BytesIO
from typing import Optional, Dict, Any, List
from google import genai
from google.genai import types


class GeminiAIService:
    """Service class for interacting with Gemini API"""

    def __init__(self):
        """Initialize Gemini client with API key from environment"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not found in environment variables")

        self.client = genai.Client(api_key=api_key)

    def _generate_content(
        self,
        model: str,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 1.0,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Internal method to generate content from Gemini API

        Args:
            model: Model name (e.g., "gemini-2.5-flash")
            prompt: User prompt/query
            system_instruction: Optional system instruction for model behavior
            temperature: Controls randomness (0.0 to 2.0)
            max_tokens: Maximum tokens in response

        Returns:
            Dict containing response text and metadata
        """
        try:
            config = {}
            if system_instruction:
                config['system_instruction'] = system_instruction
            if temperature is not None:
                config['temperature'] = temperature
            if max_tokens:
                config['max_output_tokens'] = max_tokens

            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
                config=config if config else None
            )

            # Convert usage_metadata to dict for Pydantic validation
            usage_metadata = getattr(response, 'usage_metadata', None)
            usage_dict = None
            if usage_metadata:
                # Try to convert to dict - handle both Pydantic models and other objects
                if hasattr(usage_metadata, 'model_dump'):
                    usage_dict = usage_metadata.model_dump()
                elif hasattr(usage_metadata, 'dict'):
                    usage_dict = usage_metadata.dict()
                elif hasattr(usage_metadata, '__dict__'):
                    usage_dict = vars(usage_metadata)

            return {
                "success": True,
                "text": response.text,
                "model": model,
                "usage": usage_dict
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": model
            }

    def generate_with_flash(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 1.0
    ) -> Dict[str, Any]:
        """
        Generate content using Gemini Flash (fastest model)

        Best for: Quick responses, simple queries, real-time interactions

        Args:
            prompt: User query or instruction
            system_instruction: Optional system behavior instruction
            temperature: Controls randomness (default: 1.0)

        Returns:
            Dict containing response and metadata
        """
        return self._generate_content(
            model="gemini-2.0-flash-exp",
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=temperature
        )

    def generate_with_pro(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 1.0,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate content using Gemini Pro (balanced model)

        Best for: Complex reasoning, detailed analysis, balanced performance

        Args:
            prompt: User query or instruction
            system_instruction: Optional system behavior instruction
            temperature: Controls randomness (default: 1.0)
            max_tokens: Maximum tokens in response

        Returns:
            Dict containing response and metadata
        """
        return self._generate_content(
            model="gemini-2.5-flash",
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=temperature,
            max_tokens=max_tokens
        )

    def generate_with_lite(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 1.0
    ) -> Dict[str, Any]:
        """
        Generate content using Gemini Lite (lightweight model)

        Best for: Simple tasks, low latency requirements, cost efficiency

        Args:
            prompt: User query or instruction
            system_instruction: Optional system behavior instruction
            temperature: Controls randomness (default: 1.0)

        Returns:
            Dict containing response and metadata
        """
        return self._generate_content(
            model="gemini-2.5-flash-lite",
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=temperature
        )

    def generate_images(
        self,
        prompt: str,
        number_of_images: int = 1,
        aspect_ratio: str = "1:1",
        safety_filter_level: str = "block_some",
        person_generation: str = "allow_all"
    ) -> Dict[str, Any]:
        """
        Generate images using Imagen 4.0

        Best for: Creating visual content, illustrations, concept art

        Args:
            prompt: Description of the image to generate
            number_of_images: Number of images to generate (1-4)
            aspect_ratio: Image aspect ratio ("1:1", "16:9", "9:16", "4:3", "3:4")
            safety_filter_level: Safety filter ("block_most", "block_some", "block_few")
            person_generation: Person generation policy ("allow_all", "allow_adult", "block_all")

        Returns:
            Dict containing success status and base64-encoded images
        """
        try:
            config = types.GenerateImagesConfig(
                number_of_images=number_of_images,
                aspect_ratio=aspect_ratio,
                safety_filter_level=safety_filter_level,
                person_generation=person_generation
            )

            response = self.client.models.generate_images(
                model='imagen-4.0-generate-001',
                prompt=prompt,
                config=config
            )

            # Convert images to base64 for easy transport
            images = []
            for generated_image in response.generated_images:
                # Convert PIL image to base64
                buffered = BytesIO()
                generated_image.image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                images.append({
                    "data": img_str,
                    "format": "png",
                    "mime_type": "image/png"
                })

            return {
                "success": True,
                "images": images,
                "count": len(images),
                "prompt": prompt,
                "model": "imagen-4.0"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "images": [],
                "count": 0,
                "prompt": prompt,
                "model": "imagen-4.0"
            }

    def generate_video(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
        duration_seconds: int = 5,
        poll_interval: int = 10,
        max_wait_time: int = 600
    ) -> Dict[str, Any]:
        """
        Generate video using Veo 3.0

        Best for: Creating short video clips, animations, motion content

        Args:
            prompt: Description of the video to generate
            aspect_ratio: Video aspect ratio ("16:9", "9:16", "1:1")
            duration_seconds: Video duration in seconds (2-10)
            poll_interval: Seconds between status checks (default: 10)
            max_wait_time: Maximum time to wait for video generation (default: 600s/10min)

        Returns:
            Dict containing success status and base64-encoded video or download URL
        """
        try:
            config = types.GenerateVideoConfig(
                aspect_ratio=aspect_ratio,
                duration_seconds=duration_seconds
            )

            # Start video generation operation
            operation = self.client.models.generate_videos(
                model="veo-3.0-generate-001",
                prompt=prompt,
                config=config
            )

            # Poll for completion
            wait_time = 0
            while not operation.done and wait_time < max_wait_time:
                time.sleep(poll_interval)
                wait_time += poll_interval
                operation = self.client.operations.get(operation)

            if not operation.done:
                return {
                    "success": False,
                    "error": f"Video generation timed out after {max_wait_time} seconds",
                    "status": "timeout",
                    "prompt": prompt,
                    "model": "veo-3.0"
                }

            # Get the generated video
            generated_video = operation.response.generated_videos[0]

            # Download video data
            video_data = self.client.files.download(file=generated_video.video)

            # Convert to base64
            video_b64 = base64.b64encode(video_data).decode()

            return {
                "success": True,
                "video": {
                    "data": video_b64,
                    "format": "mp4",
                    "mime_type": "video/mp4",
                    "duration": duration_seconds
                },
                "prompt": prompt,
                "model": "veo-3.0",
                "generation_time": wait_time
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "video": None,
                "prompt": prompt,
                "model": "veo-3.0"
            }


# Singleton instance
_ai_service: Optional[GeminiAIService] = None


def get_ai_service() -> GeminiAIService:
    """
    Get or create singleton AI service instance

    Returns:
        Initialized GeminiAIService instance
    """
    global _ai_service
    if _ai_service is None:
        _ai_service = GeminiAIService()
    return _ai_service
