"""
Claude AI service for analyzing infrastructure issue images.
"""
import anthropic
import base64
import os
from typing import Optional


class ClaudeService:
    """Service for interacting with Claude AI API."""
    
    def __init__(self):
        """Initialize Claude client with API key from environment."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"  # Using the latest stable model

    def analyze_issue_image(self, image_bytes: bytes, mime_type: str) -> str:
        """
        Send image to Claude for analysis of infrastructure issues.
        
        Args:
            image_bytes: Raw image bytes
            mime_type: Image MIME type (image/jpeg or image/png)
            
        Returns:
            AI-generated description of the issue
            
        Raises:
            Exception: If Claude API call fails
        """
        # Convert to base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')

        # Create prompt for infrastructure issue analysis
        prompt = """You are analyzing a photo of a city infrastructure issue. 
Describe the issue concisely in 1-2 sentences, including:
- Type of issue (pothole, broken streetlight, graffiti, litter, damaged road sign, broken sidewalk, etc.)
- Location details visible in the image
- Severity if apparent

Be specific and factual. Focus on what can be observed in the image."""

        try:
            # Call Claude API with vision
            message = self.client.messages.create(
                model=self.model,
                max_tokens=150,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": mime_type,
                                    "data": image_base64
                                }
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            )

            # Extract text from response
            if message.content and len(message.content) > 0:
                return message.content[0].text
            else:
                return "Unable to analyze image - no response from AI"

        except Exception as e:
            print(f"Claude API error: {str(e)}")
            raise Exception(f"Failed to analyze image: {str(e)}")


# Singleton instance
_claude_service: Optional[ClaudeService] = None


def get_claude_service() -> ClaudeService:
    """Get or create Claude service instance."""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService()
    return _claude_service

