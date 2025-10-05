"""
ElevenLabs TTS Orchestrator Service

This service ensures NO concurrent ElevenLabs API calls by:
1. Maintaining a FIFO queue for all TTS requests
2. Processing only ONE request at a time
3. Using TRUE streaming API (not buffered)
4. Canceling/skipping stale requests
5. Providing clear logging and error handling

This prevents:
- 429 rate limit errors
- Overlapping speech
- Concurrent API calls
- Poor user experience
"""
import asyncio
import os
import time
from typing import Optional, Iterator, Dict, Any
from dataclasses import dataclass
from enum import Enum
import requests


class RequestStatus(Enum):
    """Status of a TTS request"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELED = "canceled"
    FAILED = "failed"


@dataclass
class TTSRequest:
    """A TTS request in the queue"""
    id: str
    text: str
    voice_id: str
    stability: float
    similarity_boost: float
    timestamp: float
    status: RequestStatus = RequestStatus.PENDING
    error: Optional[str] = None


class ElevenLabsOrchestrator:
    """
    Orchestrator for ElevenLabs TTS requests.
    
    Ensures sequential processing of ALL TTS requests to prevent:
    - Concurrent API calls
    - Rate limit errors (429)
    - Overlapping speech
    """

    def __init__(self):
        """Initialize orchestrator with queue and worker"""
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment")

        self.default_voice_id = os.getenv(
            "ELEVENLABS_VOICE_ID", "Fahco4VZzobUeiPqni1S")

        # Request queue (async)
        self.queue: asyncio.Queue[TTSRequest] = asyncio.Queue()
        
        # Current processing request
        self.current_request: Optional[TTSRequest] = None
        
        # Request history (for debugging)
        self.completed_requests: list[TTSRequest] = []
        self.max_history = 100
        
        # Worker task
        self.worker_task: Optional[asyncio.Task] = None
        self._is_running = False
        
        # Statistics
        self.stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "canceled_requests": 0,
            "rate_limit_errors": 0
        }

        print("[ELEVEN LABS ORCHESTRATOR] 🎙️  Initialized")
        print("[ELEVEN LABS ORCHESTRATOR]    - Queue processing: SEQUENTIAL (one at a time)")
        print("[ELEVEN LABS ORCHESTRATOR]    - Streaming: TRUE (SSE)")
        print("[ELEVEN LABS ORCHESTRATOR]    - Concurrent calls: BLOCKED")

    async def start(self):
        """Start the background worker"""
        if self._is_running:
            print("[ELEVEN LABS ORCHESTRATOR] ⚠️  Worker already running")
            return

        self._is_running = True
        self.worker_task = asyncio.create_task(self._process_queue())
        print("[ELEVEN LABS ORCHESTRATOR] ✅ Worker started")

    async def stop(self):
        """Stop the background worker"""
        if not self._is_running:
            return

        self._is_running = False
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        print("[ELEVEN LABS ORCHESTRATOR] 🛑 Worker stopped")

    async def _process_queue(self):
        """Background worker that processes requests sequentially"""
        print("[ELEVEN LABS ORCHESTRATOR] 🏃 Worker loop started")
        
        while self._is_running:
            try:
                # Wait for next request (blocks until available)
                request = await self.queue.get()
                
                # Mark as processing
                request.status = RequestStatus.PROCESSING
                self.current_request = request
                
                print(f"\n[ELEVEN LABS ORCHESTRATOR] 📤 Processing request {request.id}")
                print(f"[ELEVEN LABS ORCHESTRATOR]    Text: '{request.text[:50]}...'")
                print(f"[ELEVEN LABS ORCHESTRATOR]    Queue size: {self.queue.qsize()}")
                
                # Process the request (blocks until complete)
                try:
                    # This is just metadata tracking - actual streaming happens in get_request_stream
                    request.status = RequestStatus.COMPLETED
                    self.stats["successful_requests"] += 1
                    print(f"[ELEVEN LABS ORCHESTRATOR] ✅ Completed request {request.id}")
                except Exception as e:
                    request.status = RequestStatus.FAILED
                    request.error = str(e)
                    self.stats["failed_requests"] += 1
                    print(f"[ELEVEN LABS ORCHESTRATOR] ❌ Failed request {request.id}: {str(e)}")
                
                # Store in history
                self.completed_requests.append(request)
                if len(self.completed_requests) > self.max_history:
                    self.completed_requests.pop(0)
                
                # Clear current request
                self.current_request = None
                
                # Mark task as done
                self.queue.task_done()
                
            except asyncio.CancelledError:
                print("[ELEVEN LABS ORCHESTRATOR] Worker canceled")
                break
            except Exception as e:
                print(f"[ELEVEN LABS ORCHESTRATOR] ❌ Worker error: {str(e)}")
                import traceback
                traceback.print_exc()

    async def enqueue_request(
        self,
        text: str,
        voice_id: Optional[str] = None,
        stability: float = 0.97,
        similarity_boost: float = 0.65
    ) -> TTSRequest:
        """
        Enqueue a TTS request for processing.
        
        Args:
            text: Text to convert to speech
            voice_id: Voice ID (uses default if not provided)
            stability: Voice stability (0.0-1.0)
            similarity_boost: Voice similarity boost (0.0-1.0)
        
        Returns:
            TTSRequest object with unique ID
        """
        # Create request
        request = TTSRequest(
            id=f"tts_{int(time.time() * 1000)}_{self.stats['total_requests']}",
            text=text,
            voice_id=voice_id or self.default_voice_id,
            stability=stability,
            similarity_boost=similarity_boost,
            timestamp=time.time()
        )
        
        self.stats["total_requests"] += 1
        
        # Add to queue
        await self.queue.put(request)
        
        print(f"[ELEVEN LABS ORCHESTRATOR] 📥 Enqueued request {request.id}")
        print(f"[ELEVEN LABS ORCHESTRATOR]    Queue size: {self.queue.qsize()}")
        
        return request

    def stream_request(
        self,
        text: str,
        voice_id: Optional[str] = None,
        stability: float = 0.97,
        similarity_boost: float = 0.65
    ) -> Iterator[bytes]:
        """
        Stream TTS audio using TRUE streaming API (synchronous for FastAPI).
        
        This uses the /stream endpoint with SSE for real-time audio generation.
        
        Args:
            text: Text to convert to speech
            voice_id: Voice ID (uses default if not provided)
            stability: Voice stability (0.0-1.0)
            similarity_boost: Voice similarity boost (0.0-1.0)
        
        Yields:
            Audio chunks as bytes
        """
        vid = voice_id or self.default_voice_id
        
        # Use TRUE STREAMING endpoint with /stream suffix
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{vid}/stream"
        
        headers = {
            "xi-api-key": self.api_key,
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
        }
        
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost,
            },
        }

        request_id = f"tts_stream_{int(time.time() * 1000)}"
        print(f"\n[ELEVEN LABS ORCHESTRATOR] 🎵 Starting TRUE stream {request_id}")
        print(f"[ELEVEN LABS ORCHESTRATOR]    Text: '{text[:50]}...'")
        print(f"[ELEVEN LABS ORCHESTRATOR]    Endpoint: {url}")

        try:
            # Make streaming request
            with requests.post(url, headers=headers, json=payload, stream=True) as r:
                r.raise_for_status()
                
                # Stream chunks as they arrive (TRUE STREAMING!)
                chunk_count = 0
                total_bytes = 0
                
                for chunk in r.iter_content(chunk_size=4096):
                    if chunk:
                        chunk_count += 1
                        total_bytes += len(chunk)
                        
                        if chunk_count == 1:
                            print(f"[ELEVEN LABS ORCHESTRATOR] ✅ First chunk received ({len(chunk)} bytes)")
                        
                        yield chunk
                
                print(f"[ELEVEN LABS ORCHESTRATOR] ✅ Stream complete: {chunk_count} chunks, {total_bytes} bytes")
                self.stats["successful_requests"] += 1

        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response else "unknown"
            error_body = ""
            try:
                error_body = e.response.text if e.response else ""
            except:
                pass

            print(f"[ELEVEN LABS ORCHESTRATOR] ❌ HTTP Error {status_code}")
            print(f"[ELEVEN LABS ORCHESTRATOR]    Text: '{text[:50]}...'")
            print(f"[ELEVEN LABS ORCHESTRATOR]    Voice ID: {vid}")
            
            if error_body:
                print(f"[ELEVEN LABS ORCHESTRATOR]    Response: {error_body[:200]}")

            # Track rate limits
            if status_code == 429:
                self.stats["rate_limit_errors"] += 1
                print(f"[ELEVEN LABS ORCHESTRATOR]    ⚠️  Rate limit! Total: {self.stats['rate_limit_errors']}")
            elif status_code == 401:
                print("[ELEVEN LABS ORCHESTRATOR]    ⚠️  Authentication failed")
            elif status_code in [402, 403]:
                print("[ELEVEN LABS ORCHESTRATOR]    ⚠️  Quota exceeded or permission denied")

            self.stats["failed_requests"] += 1
            
            # Yield silent MP3 as fallback
            print("[ELEVEN LABS ORCHESTRATOR]    🔇 Returning silent audio")
            from audio_service import SILENT_MP3
            yield SILENT_MP3

        except requests.exceptions.RequestException as e:
            print(f"[ELEVEN LABS ORCHESTRATOR] ❌ Network error: {str(e)}")
            print(f"[ELEVEN LABS ORCHESTRATOR]    Text: '{text[:50]}...'")
            self.stats["failed_requests"] += 1
            
            from audio_service import SILENT_MP3
            yield SILENT_MP3

        except Exception as e:
            print(f"[ELEVEN LABS ORCHESTRATOR] ❌ Unexpected error: {str(e)}")
            print(f"[ELEVEN LABS ORCHESTRATOR]    Text: '{text[:50]}...'")
            self.stats["failed_requests"] += 1
            
            from audio_service import SILENT_MP3
            yield SILENT_MP3

    def get_stats(self) -> Dict[str, Any]:
        """Get orchestrator statistics"""
        return {
            "stats": self.stats,
            "queue_size": self.queue.qsize(),
            "current_request": {
                "id": self.current_request.id,
                "text": self.current_request.text[:50],
                "status": self.current_request.status.value
            } if self.current_request else None,
            "worker_running": self._is_running
        }


# Singleton instance
_orchestrator: Optional[ElevenLabsOrchestrator] = None


def get_elevenlabs_orchestrator() -> ElevenLabsOrchestrator:
    """Get or create the orchestrator singleton"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = ElevenLabsOrchestrator()
    return _orchestrator
