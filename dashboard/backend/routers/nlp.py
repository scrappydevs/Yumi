"""
NLP API router for natural language processing tasks

Provides endpoints for:
- Friend mention detection in transcribed text
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from utils.auth import get_user_id_from_token
from services.gemini_service import get_gemini_service
import json

router = APIRouter(prefix="/api/nlp", tags=["nlp"])


# ==================== Request/Response Models ====================

class FriendInfo(BaseModel):
    """Friend information for mention detection"""
    id: str = Field(..., description="Friend's user ID")
    username: str = Field(..., description="Friend's username")
    display_name: str = Field(None, description="Friend's display name")


class DetectMentionsRequest(BaseModel):
    """Request model for friend mention detection"""
    text: str = Field(..., description="Transcribed text to analyze")
    friends: List[FriendInfo] = Field(...,
                                      description="List of user's friends")


class DetectedMention(BaseModel):
    """Detected friend mention"""
    id: str = Field(..., description="Friend's user ID")
    username: str = Field(..., description="Friend's username")
    display_name: str = Field(None, description="Friend's display name")
    confidence: str = Field(...,
                            description="Confidence level: high, medium, low")


class DetectMentionsResponse(BaseModel):
    """Response model for friend mention detection"""
    detected_mentions: List[DetectedMention] = Field(
        ..., description="List of detected friend mentions")
    original_text: str = Field(..., description="Original input text")


# ==================== Endpoints ====================

@router.post("/detect-friend-mentions", response_model=DetectMentionsResponse)
async def detect_friend_mentions(
    request: DetectMentionsRequest,
    user_id: str = Depends(get_user_id_from_token)
):
    """
    Detect friend mentions in natural language text using LLM.

    Analyzes transcribed text to identify which friends are mentioned
    in a dining/restaurant context (e.g., "sushi date night with Julian").

    Args:
        request: DetectMentionsRequest with text and friends list
        user_id: Authenticated user ID from JWT token

    Returns:
        DetectMentionsResponse with detected mentions

    Raises:
        HTTPException: If LLM processing fails
    """
    try:
        print(f"\n{'='*80}")
        print(f"[NLP] 🔍 FRIEND MENTION DETECTION")
        print(f"[NLP] User: {user_id}")
        print(f"[NLP] Text: '{request.text}'")
        print(f"[NLP] Available friends: {len(request.friends)}")

        # Handle edge cases
        if not request.text.strip():
            print("[NLP] ⚠️  Empty text, returning no mentions")
            return DetectMentionsResponse(
                detected_mentions=[],
                original_text=request.text
            )

        if not request.friends:
            print("[NLP] ⚠️  No friends provided, returning no mentions")
            return DetectMentionsResponse(
                detected_mentions=[],
                original_text=request.text
            )

        # Prepare friends list for LLM (with both username and display name)
        friends_list = []
        for friend in request.friends:
            friend_str = f"- ID: {friend.id}, Username: @{friend.username}"
            if friend.display_name:
                friend_str += f", Display Name: {friend.display_name}"
            friends_list.append(friend_str)

        friends_text = "\n".join(friends_list)

        # Create LLM prompt for friend detection
        prompt = f"""You are analyzing text to detect friend mentions in a dining/restaurant context.

USER'S TEXT:
"{request.text}"

AVAILABLE FRIENDS:
{friends_text}

TASK:
Identify which friends (if any) are mentioned in the text in a dining context (eating out, restaurant plans, meals together, etc.).

RULES:
1. Only match if there's clear dining/restaurant context (e.g., "lunch with", "dinner date with", "sushi with")
2. Match both usernames and display names (case-insensitive, partial matches OK)
3. Be lenient with name variations (e.g., "Julian" matches "jul", "julian", "Julian")
4. Return confidence: "high" (exact match), "medium" (partial match), "low" (uncertain)
5. DO NOT match if it's just mentioning a person without dining context
6. DO NOT match if the person is not in the friends list

Return ONLY valid JSON (no markdown, no explanations):
{{
  "matches": [
    {{
      "id": "friend_user_id",
      "username": "friend_username",
      "display_name": "Friend Display Name",
      "confidence": "high|medium|low",
      "reason": "brief explanation"
    }}
  ]
}}

If no friends are mentioned in a dining context, return: {{"matches": []}}"""

        print(f"[NLP] 🤖 Sending to Gemini for analysis...")

        # Call Gemini service
        gemini_service = get_gemini_service()
        response = gemini_service.model.generate_content(prompt)
        response_text = response.text.strip()

        print(f"[NLP] ✅ Gemini response received")
        print(f"[NLP] Response length: {len(response_text)} chars")

        # Clean markdown formatting if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse JSON response
        try:
            result = json.loads(response_text)
            matches = result.get('matches', [])

            print(f"[NLP] 📊 Found {len(matches)} potential matches")

            # Convert to response format
            detected_mentions = []
            for match in matches:
                print(
                    f"[NLP]   ✓ Matched: {match.get('username')} ({match.get('confidence')}) - {match.get('reason')}")
                detected_mentions.append(DetectedMention(
                    id=match['id'],
                    username=match['username'],
                    display_name=match.get('display_name'),
                    confidence=match.get('confidence', 'medium')
                ))

            print(
                f"[NLP] ✅ Returning {len(detected_mentions)} detected mentions")

            return DetectMentionsResponse(
                detected_mentions=detected_mentions,
                original_text=request.text
            )

        except json.JSONDecodeError as e:
            print(f"[NLP] ❌ JSON parse error: {str(e)}")
            print(f"[NLP] Response text: {response_text[:200]}...")
            # Return empty mentions on parse error (graceful degradation)
            return DetectMentionsResponse(
                detected_mentions=[],
                original_text=request.text
            )

    except Exception as e:
        print(f"[NLP] ❌ Error detecting mentions: {str(e)}")
        # Return empty mentions on error (graceful degradation)
        # This ensures transcription still works even if mention detection fails
        return DetectMentionsResponse(
            detected_mentions=[],
            original_text=request.text
        )
