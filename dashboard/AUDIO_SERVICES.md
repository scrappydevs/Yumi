# Audio Services: TTS & STT

## Overview

Your Aegis platform now includes comprehensive audio capabilities:
- **Text-to-Speech (TTS)** via ElevenLabs with HTTP streaming
- **Speech-to-Text (STT)** via OpenAI Whisper
- Voice management and selection

All implemented with modular, production-ready code.

---

## 🎤 Text-to-Speech (TTS)

### Streaming Endpoint (Recommended)

**Low-latency HTTP streaming** - audio plays as it's generated!

```
GET /api/audio/tts/stream?text=Hello+world
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | **required** | Text to convert to speech |
| `voice_id` | string | env default | Optional voice ID |
| `stability` | float | 0.5 | Voice stability (0.0-1.0) |
| `similarity_boost` | float | 0.75 | Voice clarity (0.0-1.0) |

#### Browser Usage

```javascript
// Simple playback
const audio = new Audio('/api/audio/tts/stream?text=Hello+world');
audio.play();

// With custom voice
const audio = new Audio('/api/audio/tts/stream?text=Welcome&voice_id=pNInz6obpgDQGcFmaJgB');
audio.play();

// React component example
function TTSPlayer({ text }) {
  const playAudio = () => {
    const url = `/api/audio/tts/stream?text=${encodeURIComponent(text)}`;
    const audio = new Audio(url);
    audio.play();
  };
  
  return <button onClick={playAudio}>🔊 Play</button>;
}
```

#### cURL Example

```bash
# Stream to file
curl "http://localhost:8000/api/audio/tts/stream?text=Hello+world" > output.mp3

# Play directly (macOS)
curl "http://localhost:8000/api/audio/tts/stream?text=Testing+audio" | afplay -

# Play directly (Linux)
curl "http://localhost:8000/api/audio/tts/stream?text=Testing+audio" | mpg123 -
```

---

### Conversion Endpoint (Base64)

**Complete audio file** - returns base64-encoded audio

```
POST /api/audio/tts/convert
```

#### Request

```json
{
  "text": "Hello, how are you today?",
  "voice_id": "JBFqnCBsd6RMkjVDRZzb",
  "output_format": "mp3_44100_128"
}
```

#### Response

```json
{
  "success": true,
  "audio": {
    "data": "base64_encoded_mp3_data...",
    "format": "mp3",
    "mime_type": "audio/mp3",
    "size": 45231
  },
  "text": "Hello, how are you today?",
  "voice_id": "JBFqnCBsd6RMkjVDRZzb",
  "service": "elevenlabs"
}
```

#### JavaScript Usage

```javascript
// Convert and play
async function textToSpeech(text) {
  const response = await fetch('http://localhost:8000/api/audio/tts/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Create audio from base64
    const audioBlob = base64ToBlob(data.audio.data, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  }
}

function base64ToBlob(base64, mimeType) {
  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    array[i] = bytes.charCodeAt(i);
  }
  return new Blob([array], { type: mimeType });
}
```

---

## 🎙️ Speech-to-Text (STT)

### Base64 Audio Endpoint

```
POST /api/audio/stt/transcribe
```

#### Request

```json
{
  "audio_b64": "base64_encoded_audio_data...",
  "audio_format": "mp3",
  "language": "en",
  "task": "transcribe"
}
```

#### Response

```json
{
  "success": true,
  "text": "This is the transcribed text from the audio.",
  "language": "en",
  "service": "whisper",
  "model": "base"
}
```

---

### File Upload Endpoint

```
POST /api/audio/stt/transcribe-file
```

#### Form Data

- `file`: Audio file (mp3, wav, m4a, ogg, flac)
- `language`: Optional language code
- `task`: "transcribe" or "translate"

#### cURL Example

```bash
curl -X POST http://localhost:8000/api/audio/stt/transcribe-file \
  -F "file=@recording.mp3" \
  -F "language=en" \
  -F "task=transcribe"
```

#### JavaScript Usage

```javascript
async function transcribeAudio(audioFile) {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('language', 'en');
  
  const response = await fetch('http://localhost:8000/api/audio/stt/transcribe-file', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return data.text;
}

// Usage with file input
document.getElementById('audioFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const text = await transcribeAudio(file);
  console.log('Transcription:', text);
});
```

---

## 🎭 Voice Management

### List Available Voices

```
GET /api/audio/voices
```

#### Response

```json
{
  "success": true,
  "voices": [
    {
      "voice_id": "JBFqnCBsd6RMkjVDRZzb",
      "name": "George",
      "category": "generated",
      "description": "Warm and friendly voice",
      "labels": {}
    },
    {
      "voice_id": "pNInz6obpgDQGcFmaJgB",
      "name": "Adam",
      "category": "premade",
      "description": "Deep and authoritative",
      "labels": {}
    }
  ],
  "count": 2,
  "service": "elevenlabs"
}
```

---

## 🔧 Backend Architecture

### Service Layer (`backend/audio_service.py`)

```python
class AudioService:
    # TTS Methods
    def text_to_speech_convert(self, text: str, voice_id: Optional[str] = None) -> Dict
    def text_to_speech_stream_http(self, text: str, voice_id: Optional[str] = None) -> Iterator[bytes]
    
    # STT Methods
    def speech_to_text(self, audio_data: bytes, audio_format: str) -> Dict
    def speech_to_text_from_base64(self, audio_b64: str, audio_format: str) -> Dict
    
    # Voice Management
    def list_voices(self) -> Dict
```

### Router Layer (`backend/routers/audio.py`)

```python
# TTS Endpoints
@router.get("/tts/stream")           # HTTP streaming
@router.post("/tts/convert")         # Base64 conversion

# STT Endpoints
@router.post("/stt/transcribe")      # Base64 audio
@router.post("/stt/transcribe-file") # File upload

# Voice Management
@router.get("/voices")               # List voices
@router.get("/health")               # Health check
```

---

## 🚀 Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies:
- `elevenlabs==1.15.0` - ElevenLabs TTS
- `openai-whisper==20240930` - OpenAI Whisper STT
- `requests==2.32.3` - HTTP streaming

### 2. Environment Variables

```bash
# Add to backend/.env or Infisical
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb  # Optional, default voice

# Optional Whisper config
WHISPER_MODEL_SIZE=base  # tiny, base, small, medium, large
```

Get your ElevenLabs API key: https://elevenlabs.io/app/settings/api-keys

### 3. Start Server

```bash
python main.py
```

API available at: `http://localhost:8000`

---

## 💡 Use Cases

### TTS Applications

✅ **Voice Notifications**
- Alert users with spoken messages
- Status updates
- Error announcements

✅ **Content Accessibility**
- Read articles/reports aloud
- Audio versions of text content
- Accessibility features

✅ **Interactive Features**
- Voice responses in chatbots
- Audio feedback
- Guided tours

### STT Applications

✅ **Voice Commands**
- Voice-controlled interfaces
- Hands-free operation
- Quick data entry

✅ **Transcription Services**
- Meeting transcriptions
- Voice notes to text
- Interview transcriptions

✅ **Accessibility**
- Voice input for text fields
- Dictation features
- Audio search

---

## 🎯 Best Practices

### TTS Optimization

1. **Use Streaming for Real-time**
   - Streaming endpoint for immediate playback
   - Lower latency, better UX
   - Perfect for interactive apps

2. **Use Conversion for Storage**
   - Convert endpoint when you need the file
   - Cache results for repeated playback
   - Store for offline use

3. **Voice Selection**
   - Test different voices for your use case
   - Consider language and accent
   - Match voice to content tone

4. **Stability Settings**
   - Lower (0.0-0.3): More expressive, variable
   - Medium (0.4-0.6): Balanced
   - Higher (0.7-1.0): More consistent, stable

### STT Optimization

1. **Audio Quality**
   - Higher quality = better accuracy
   - Minimize background noise
   - Clear speech, moderate pace

2. **Language Specification**
   - Specify language when known
   - Improves accuracy significantly
   - Faster processing

3. **Model Selection**
   - `tiny`: Fastest, least accurate
   - `base`: Good balance (default)
   - `small`: Better accuracy
   - `medium`: High accuracy
   - `large`: Best accuracy, slowest

---

## 🧪 Testing

### Test TTS Streaming

```bash
# Test in browser
open "http://localhost:8000/api/audio/tts/stream?text=Testing+audio+streaming"

# Save to file
curl "http://localhost:8000/api/audio/tts/stream?text=Hello+world" > test.mp3
```

### Test TTS Conversion

```bash
curl -X POST http://localhost:8000/api/audio/tts/convert \
  -H "Content-Type: application/json" \
  -d '{"text": "Testing audio conversion"}' \
  | jq '.success'
```

### Test STT

```bash
# Record audio and transcribe (requires audio file)
curl -X POST http://localhost:8000/api/audio/stt/transcribe-file \
  -F "file=@recording.mp3" \
  | jq '.text'
```

### Test Voice Listing

```bash
curl http://localhost:8000/api/audio/voices | jq '.voices[] | .name'
```

---

## ⚠️ Important Notes

### Performance Considerations

**TTS:**
- Streaming is near real-time
- Conversion may take 1-3 seconds depending on text length
- Cache frequently used phrases

**STT:**
- Processing time depends on audio length and model size
- `base` model: ~0.5x real-time (30s audio = ~15s processing)
- `large` model: ~2x real-time (30s audio = ~60s processing)

### Resource Usage

**Whisper Models:**
- `tiny`: ~1 GB RAM
- `base`: ~1 GB RAM (default)
- `small`: ~2 GB RAM
- `medium`: ~5 GB RAM
- `large`: ~10 GB RAM

### Rate Limits

- Check ElevenLabs plan limits
- Implement rate limiting for production
- Monitor API usage in dashboard

---

## 🔐 Security

- Store API keys in environment variables
- Never expose keys in frontend
- All audio processing through backend
- Implement authentication in production
- Sanitize file uploads (size, type)

---

## 🆘 Troubleshooting

### Issue: "ELEVENLABS_API_KEY not found"
**Solution:** Add API key to `.env` or Infisical

### Issue: Streaming audio doesn't play
**Solution:** 
- Check browser console for errors
- Verify CORS settings
- Ensure API is running

### Issue: Whisper model download slow
**Solution:**
- First run downloads model (~140MB for base)
- Subsequent runs use cached model
- Use smaller model for faster startup

### Issue: Poor transcription quality
**Solution:**
- Use higher quality audio
- Specify language parameter
- Try larger Whisper model
- Reduce background noise

---

## 📊 API Endpoints Summary

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/audio/tts/stream` | GET | Stream TTS audio | Audio stream |
| `/api/audio/tts/convert` | POST | Convert TTS to base64 | JSON + base64 |
| `/api/audio/stt/transcribe` | POST | Transcribe base64 audio | JSON + text |
| `/api/audio/stt/transcribe-file` | POST | Transcribe uploaded file | JSON + text |
| `/api/audio/voices` | GET | List available voices | JSON + voices |
| `/api/audio/health` | GET | Health check | JSON + status |

---

## 🔮 Future Enhancements

Potential improvements:
- Real-time bidirectional streaming
- Voice cloning
- Custom voice training
- Batch processing
- Audio effects/filters
- Multi-language support
- Emotion control in TTS
- Speaker diarization in STT

---

## 📚 Resources

- [ElevenLabs API Docs](https://elevenlabs.io/docs/api-reference)
- [Whisper GitHub](https://github.com/openai/whisper)
- [API Documentation](http://localhost:8000/docs)
- [Voice Library](https://elevenlabs.io/voice-library)

