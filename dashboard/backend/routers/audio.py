"""
Audio API router for TTS and STT

Provides endpoints for:
- Text-to-Speech (ElevenLabs) - both streaming and conversion
- Speech-to-Text (Whisper)
- Voice management
"""
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List

from audio_service import get_audio_service
from services.vad_service import get_vad_service

router = APIRouter(prefix="/api/audio", tags=["audio"])


# ==================== Request/Response Models ====================

class TTSRequest(BaseModel):
    """Request model for TTS conversion (non-streaming)"""
    text: str = Field(..., description="Text to convert to speech")
    voice_id: Optional[str] = Field(None, description="Optional voice ID")
    output_format: str = Field("mp3_44100_128", description="Audio format")


class TTSResponse(BaseModel):
    """Response model for TTS conversion"""
    success: bool
    audio: Optional[dict] = None
    text: str
    voice_id: Optional[str] = None
    service: str
    error: Optional[str] = None


class STTRequest(BaseModel):
    """Request model for STT (base64 audio)"""
    audio_b64: str = Field(..., description="Base64-encoded audio data")
    audio_format: str = Field(
        "mp3", description="Audio format (mp3, wav, m4a)")
    language: Optional[str] = Field(
        None, description="Language code (en, es, fr, etc.)")
    task: str = Field("transcribe", description="transcribe or translate")


class STTResponse(BaseModel):
    """Response model for STT"""
    success: bool
    text: Optional[str] = None
    language: Optional[str] = None
    service: str
    model: Optional[str] = None
    error: Optional[str] = None


class Voice(BaseModel):
    """Voice information model"""
    voice_id: str
    name: str
    category: str
    description: str
    labels: dict


class VoicesResponse(BaseModel):
    """Response model for voice listing"""
    success: bool
    voices: List[Voice]
    count: int
    service: str
    error: Optional[str] = None


class VADRequest(BaseModel):
    """Request model for VAD analysis"""
    audio_b64: str = Field(..., description="Base64-encoded audio data")
    audio_format: str = Field("webm", description="Audio format (webm, mp3, wav)")
    reset_state: bool = Field(False, description="Reset VAD state before analysis")


class VADResponse(BaseModel):
    """Response model for VAD analysis"""
    success: bool
    vad_score: float = Field(..., description="Current VAD score (0.0-1.0)")
    average_score: float = Field(..., description="Rolling average VAD score")
    is_speech: bool = Field(..., description="Whether speech is detected")
    buffer_size: Optional[int] = None
    audio_duration_ms: Optional[int] = None
    error: Optional[str] = None


# ==================== TTS Endpoints ====================

@router.get("/tts/stream")
async def tts_stream(
    text: str = Query(..., min_length=1,
                      description="Text to convert to speech"),
    voice_id: Optional[str] = Query(None, description="Optional voice ID"),
    stability: float = Query(
        0.5, ge=0.0, le=1.0, description="Voice stability"),
    similarity_boost: float = Query(
        0.75, ge=0.0, le=1.0, description="Voice similarity")
):
    """
    Stream text-to-speech audio using HTTP chunked transfer

    This endpoint streams MP3 audio chunks as they are generated for low-latency playback.
    Perfect for real-time TTS applications.

    - **text**: Text to convert to speech
    - **voice_id**: Optional ElevenLabs voice ID (uses default if not provided)
    - **stability**: Voice stability (0.0-1.0, default: 0.5)
    - **similarity_boost**: Voice clarity (0.0-1.0, default: 0.75)

    Returns: Streaming MP3 audio

    Usage in browser:
    ```javascript
    const audio = new Audio('/api/audio/tts/stream?text=Hello+world');
    audio.play();
    ```
    """
    try:
        audio_service = get_audio_service()

        return StreamingResponse(
            audio_service.text_to_speech_stream_http(
                text=text,
                voice_id=voice_id,
                stability=stability,
                similarity_boost=similarity_boost
            ),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"TTS streaming failed: {str(e)}")


@router.post("/tts/convert", response_model=TTSResponse)
async def tts_convert(request: TTSRequest):
    """
    Convert text to speech (non-streaming, returns base64 audio)

    This endpoint generates the complete audio file and returns it as base64.
    Use this when you need the full audio file at once.

    - **text**: Text to convert to speech
    - **voice_id**: Optional voice ID (uses default if not provided)
    - **output_format**: Audio format (mp3_44100_128, mp3_22050_32, etc.)

    Returns: JSON with base64-encoded audio data

    Example response:
    ```json
    {
      "success": true,
      "audio": {
        "data": "base64_audio_data...",
        "format": "mp3",
        "mime_type": "audio/mp3",
        "size": 12345
      }
    }
    ```
    """
    try:
        audio_service = get_audio_service()
        result = audio_service.text_to_speech_convert(
            text=request.text,
            voice_id=request.voice_id,
            output_format=request.output_format
        )
        return TTSResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"TTS conversion failed: {str(e)}")


# ==================== STT Endpoints ====================

@router.post("/stt/transcribe", response_model=STTResponse)
async def stt_transcribe(request: STTRequest):
    """
    Transcribe speech to text from base64-encoded audio

    Uses OpenAI Whisper for accurate speech recognition.

    - **audio_b64**: Base64-encoded audio data
    - **audio_format**: Audio format (mp3, wav, m4a, etc.)
    - **language**: Optional language code for better accuracy
    - **task**: "transcribe" (maintain language) or "translate" (to English)

    Returns: Transcribed text with metadata

    Example:
    ```json
    {
      "audio_b64": "base64_audio_data...",
      "audio_format": "mp3",
      "language": "en",
      "task": "transcribe"
    }
    ```
    """
    try:
        audio_service = get_audio_service()
        result = audio_service.speech_to_text_from_base64(
            audio_b64=request.audio_b64,
            audio_format=request.audio_format,
            language=request.language,
            task=request.task
        )
        return STTResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"STT transcription failed: {str(e)}")


@router.post("/stt/transcribe-file")
async def stt_transcribe_file(
    file: UploadFile = File(...),
    language: Optional[str] = Query(None, description="Language code"),
    task: str = Query("transcribe", description="transcribe or translate")
):
    """
    Transcribe speech to text from uploaded audio file

    Upload an audio file and get back the transcription.
    Supports: mp3, wav, m4a, ogg, flac, and more.

    - **file**: Audio file to transcribe
    - **language**: Optional language code
    - **task**: "transcribe" or "translate"

    Returns: Transcribed text
    """
    try:
        # Read file content
        audio_data = await file.read()

        # Get file extension
        filename = file.filename or "audio.mp3"
        audio_format = filename.split(".")[-1]

        audio_service = get_audio_service()
        result = audio_service.speech_to_text(
            audio_data=audio_data,
            audio_format=audio_format,
            language=language,
            task=task
        )

        return STTResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"File transcription failed: {str(e)}")


# ==================== Voice Management ====================

@router.get("/voices", response_model=VoicesResponse)
async def list_voices():
    """
    List available ElevenLabs voices

    Returns all voices available in your ElevenLabs account.
    Use the voice_id from this list in TTS requests.

    Returns: List of available voices with metadata
    """
    try:
        audio_service = get_audio_service()
        result = audio_service.list_voices()
        return VoicesResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to list voices: {str(e)}")


# ==================== VAD Endpoints ====================

@router.post("/vad/analyze", response_model=VADResponse)
async def vad_analyze(request: VADRequest):
    """
    Analyze audio chunk for voice activity detection
    
    Uses Silero VAD model to detect speech vs silence in real-time.
    Useful for automatic silence detection in voice recording applications.
    
    - **audio_b64**: Base64-encoded audio data (chunk or complete recording)
    - **audio_format**: Audio format (webm, mp3, wav, etc.)
    - **reset_state**: Reset VAD state before analysis (use True for first chunk)
    
    Returns: VAD score and speech detection status
    
    Example:
    ```json
    {
      "audio_b64": "base64_audio_data...",
      "audio_format": "webm",
      "reset_state": false
    }
    ```
    
    Response:
    - vad_score: Current frame score (0.0 = silence, 1.0 = strong speech)
    - average_score: Rolling average over recent chunks
    - is_speech: True if vad_score > 0.5
    """
    try:
        vad_service = get_vad_service()
        result = vad_service.analyze_audio_base64(
            audio_b64=request.audio_b64,
            audio_format=request.audio_format,
            reset_state=request.reset_state
        )
        return VADResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"VAD analysis failed: {str(e)}")


@router.post("/vad/reset")
async def vad_reset():
    """
    Reset VAD state and buffer
    
    Call this endpoint to reset the VAD model state.
    Useful when starting a new recording session.
    """
    try:
        vad_service = get_vad_service()
        vad_service.reset()
        return {
            "success": True,
            "message": "VAD state reset successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"VAD reset failed: {str(e)}")


# ==================== Health Check ====================

@router.get("/health")
async def audio_health_check():
    """Check if audio services are properly configured"""
    try:
        audio_service = get_audio_service()
        vad_service = get_vad_service()
        return {
            "status": "healthy",
            "services": {
                "elevenlabs": "configured",
                "whisper": "ready",
                "vad": "ready"
            },
            "default_voice": audio_service.default_voice_id,
            "whisper_model": audio_service._whisper_model_size
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
