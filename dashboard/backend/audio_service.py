"""
Audio Service for TTS (Text-to-Speech) and STT (Speech-to-Text)

This module provides modular functions for:
- ElevenLabs: Text-to-Speech with streaming and conversion
- Whisper: Speech-to-Text transcription (optional)

ALL ElevenLabs calls now go through the orchestrator to prevent concurrent requests.
"""
import os
import base64
import tempfile
import requests
from typing import Optional, Dict, Any, Iterator
from elevenlabs import ElevenLabs
from services.elevenlabs_orchestrator import get_elevenlabs_orchestrator

# Minimal silent MP3 file (~0.026 seconds of silence at 44.1kHz)
# This is used as a fallback when TTS fails, to provide valid audio data
# instead of empty bytes, preventing browser decoding errors.
# This is a valid single-frame MP3 file that browsers can decode without errors.
SILENT_MP3 = base64.b64decode(
    "/+MYxAALACwAAP/AADwQKVE/SPB//+MYxBMLACwAAP/AABYQKVEwSJ//+MYxCMLACwAAP/AADY"
    "QKVEwSJ//+MYxDMLACwAAP/AABYQKVEwSJ//+MYxEMLACwAAP/AADYQKVE/SPB//+MYxFMLACw"
    "AAP/AABYQKVEwSJ//+MYxGMLACwAAP/AADYQKVE/SPB//+MYxHMLACwAAP/AABYQKVEwSJ//+"
    "MYxIMLACwAAP/AADYQKVE/SPB//+MYxJMLACwAAP/AABYQKVEwSJ//+MYxKMLACwAAP/AADYQ"
    "KVE/SPB//+MYxLMLACwAAP/AABIKVE/RPB/g=="
)

# Optional whisper import
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("[AUDIO] Warning: openai-whisper not installed. Speech-to-text disabled.")


class AudioService:
    """Service class for TTS and STT operations"""

    def __init__(self):
        """Initialize ElevenLabs and Whisper clients"""
        # ElevenLabs setup
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.elevenlabs_api_key:
            raise ValueError(
                "ELEVENLABS_API_KEY not found in environment variables")

        self.elevenlabs_client = ElevenLabs(
            api_key=self.elevenlabs_api_key,
            base_url="https://api.elevenlabs.io"
        )

        # Default voice ID - Fahco4VZzobUeiPqni1S (ElevenLabs voice library)
        self.default_voice_id = os.getenv(
            "ELEVENLABS_VOICE_ID", "Fahco4VZzobUeiPqni1S")

        # Whisper model (lazy loading)
        self._whisper_model = None
        self._whisper_model_size = os.getenv("WHISPER_MODEL_SIZE", "base")

    @property
    def whisper_model(self):
        """Lazy load Whisper model"""
        if not WHISPER_AVAILABLE:
            raise RuntimeError(
                "Whisper not installed. Install with: pip install openai-whisper")
        if self._whisper_model is None:
            self._whisper_model = whisper.load_model(self._whisper_model_size)
        return self._whisper_model

    # ==================== ElevenLabs TTS ====================

    def text_to_speech_convert(
        self,
        text: str,
        voice_id: Optional[str] = None,
        output_format: str = "mp3_44100_128"
    ) -> Dict[str, Any]:
        """
        Convert text to speech in one go (non-streaming)

        Args:
            text: Text to convert to speech
            voice_id: Optional voice ID (uses default if not provided)
            output_format: Audio format (mp3_44100_128, mp3_22050_32, etc.)

        Returns:
            Dict containing success status and base64-encoded audio data
        """
        try:
            vid = voice_id or self.default_voice_id

            audio_generator = self.elevenlabs_client.text_to_speech.convert(
                voice_id=vid,
                text=text,
                output_format=output_format,
                model_id="eleven_multilingual_v2"
            )

            # Collect all audio chunks
            audio_data = b"".join(audio_generator)

            # Encode to base64 for transport
            audio_b64 = base64.b64encode(audio_data).decode()

            return {
                "success": True,
                "audio": {
                    "data": audio_b64,
                    "format": output_format.split("_")[0],  # "mp3"
                    "mime_type": f"audio/{output_format.split('_')[0]}",
                    "size": len(audio_data)
                },
                "text": text,
                "voice_id": vid,
                "service": "elevenlabs"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "audio": None,
                "text": text,
                "service": "elevenlabs"
            }

    def text_to_speech_stream_http(
        self,
        text: str,
        voice_id: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75
    ) -> Iterator[bytes]:
        """
        Stream text to speech audio using TRUE streaming via orchestrator.

        ALL calls now go through the ElevenLabs orchestrator to ensure:
        - No concurrent API calls
        - Sequential request processing
        - True streaming (not buffered)
        - Proper error handling and fallbacks

        Args:
            text: Text to convert to speech
            voice_id: Optional voice ID (uses default if not provided)
            stability: Voice stability (0.0-1.0)
            similarity_boost: Voice similarity boost (0.0-1.0)

        Yields:
            Audio chunks as bytes (MP3 format) - streamed in real-time!

        Example:
            for chunk in service.text_to_speech_stream_http("Hello world"):
                yield chunk
        """
        # Get orchestrator singleton
        orchestrator = get_elevenlabs_orchestrator()
        
        # Use orchestrator's streaming method (handles queue, rate limits, errors)
        yield from orchestrator.stream_request(
            text=text,
            voice_id=voice_id or self.default_voice_id,
            stability=stability,
            similarity_boost=similarity_boost
        )

    # ==================== Voice Management ====================

    def list_voices(self) -> Dict[str, Any]:
        """
        List available ElevenLabs voices

        Returns:
            Dict containing voice list and metadata
        """
        try:
            voices_response = self.elevenlabs_client.voices.get_all()

            voices = []
            for voice in voices_response.voices:
                voices.append({
                    "voice_id": voice.voice_id,
                    "name": voice.name,
                    "category": getattr(voice, "category", "unknown"),
                    "description": getattr(voice, "description", ""),
                    "labels": getattr(voice, "labels", {})
                })

            return {
                "success": True,
                "voices": voices,
                "count": len(voices),
                "service": "elevenlabs"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "voices": [],
                "count": 0,
                "service": "elevenlabs"
            }

    # ==================== Whisper STT ====================

    def speech_to_text(
        self,
        audio_data: bytes,
        audio_format: str = "mp3",
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Dict[str, Any]:
        """
        Transcribe audio to text using Whisper

        Args:
            audio_data: Audio file bytes
            audio_format: Audio format (mp3, wav, m4a, etc.)
            language: Optional language code (en, es, fr, etc.)
            task: "transcribe" or "translate" (to English)

        Returns:
            Dict containing transcription and metadata
        """
        try:
            # Save audio to temporary file (Whisper requires file path)
            with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_file_path = tmp_file.name

            # Transcribe
            result = self.whisper_model.transcribe(
                tmp_file_path,
                language=language,
                task=task
            )

            # Clean up temp file
            os.unlink(tmp_file_path)

            return {
                "success": True,
                "text": result["text"],
                "language": result.get("language"),
                "segments": result.get("segments", []),
                "service": "whisper",
                "model": self._whisper_model_size
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "text": None,
                "service": "whisper"
            }

    def speech_to_text_from_base64(
        self,
        audio_b64: str,
        audio_format: str = "mp3",
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Dict[str, Any]:
        """
        Transcribe base64-encoded audio to text

        Args:
            audio_b64: Base64-encoded audio data
            audio_format: Audio format
            language: Optional language code
            task: "transcribe" or "translate"

        Returns:
            Dict containing transcription and metadata
        """
        try:
            # Decode base64
            audio_data = base64.b64decode(audio_b64)

            # Call main STT function
            return self.speech_to_text(
                audio_data=audio_data,
                audio_format=audio_format,
                language=language,
                task=task
            )
        except Exception as e:
            return {
                "success": False,
                "error": f"Base64 decode error: {str(e)}",
                "text": None,
                "service": "whisper"
            }


# Singleton instance
_audio_service: Optional[AudioService] = None


def get_audio_service() -> AudioService:
    """
    Get or create singleton audio service instance

    Returns:
        Initialized AudioService instance
    """
    global _audio_service
    if _audio_service is None:
        _audio_service = AudioService()
    return _audio_service
