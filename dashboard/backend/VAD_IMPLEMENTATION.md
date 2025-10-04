# Voice Activity Detection (VAD) Implementation

## Overview

This document describes the complete implementation of Voice Activity Detection (VAD) using the Silero VAD model, integrated with Whisper speech-to-text transcription.

## Architecture

### Backend Components

#### 1. VAD Service (`services/vad_service.py`)
- **Purpose**: Provides voice activity detection using the Silero VAD ONNX model
- **Model**: `resources/models/silero_vad.onnx` (286KB)
- **Features**:
  - Real-time audio analysis
  - Speech vs. silence detection
  - Rolling average score tracking
  - Base64 audio input support
  - Multiple audio format support (webm, mp3, wav, etc.)

**Key Methods**:
```python
- analyze_audio_chunk(audio_data, audio_format, reset_state)
- analyze_audio_base64(audio_b64, audio_format, reset_state)
- reset() - Reset VAD state for new recording session
```

**VAD Score**:
- Range: 0.0 (silence) to 1.0 (strong speech)
- Threshold: 0.5 (configurable)
- Uses rolling average for smoothness

#### 2. Audio Router Endpoints (`routers/audio.py`)

**New Endpoints**:

1. **`POST /api/audio/vad/analyze`**
   - Analyze audio chunk for voice activity
   - Input: base64-encoded audio + format
   - Output: VAD score, average score, is_speech flag
   - Use case: Real-time silence detection

2. **`POST /api/audio/vad/reset`**
   - Reset VAD state
   - Use case: Start of new recording session

**Updated Health Check**:
- `GET /api/audio/health` now includes VAD service status

### Frontend Components

#### 1. VAD Recording Hook (`hooks/use-vad-recording.ts`)

**Purpose**: Custom React hook for VAD-enabled audio recording with auto-stop on silence.

**Features**:
- MediaRecorder API for audio capture
- Real-time VAD analysis via backend
- Automatic silence detection and recording stop
- Whisper transcription integration
- Configurable thresholds and intervals

**Configuration Options**:
```typescript
{
  silenceThreshold: 2500,      // ms of silence before auto-stop
  checkInterval: 1000,          // ms between VAD checks
  speechThreshold: 0.5,         // VAD score threshold for speech
  onTranscriptionComplete: fn,  // Callback with transcribed text
  onError: fn                   // Error callback
}
```

**State**:
```typescript
{
  isRecording: boolean,
  isTranscribing: boolean,
  transcription: string,
  error: string | null,
  vadScore: number,
  isSpeechDetected: boolean
}
```

**Methods**:
- `startRecording()` - Begin recording with VAD
- `stopRecording()` - Manually stop recording
- `toggleRecording()` - Toggle recording on/off

#### 2. Integration in Overview Page (`app/(dashboard)/overview/page.tsx`)

**Changes**:
- Removed old Web Speech API (SpeechRecognition)
- Replaced with `useVADRecording` hook
- Auto-populate prompt field after transcription
- Visual feedback for recording and transcription states

## Recording Flow

### User Workflow

1. **Start Recording**:
   - User clicks microphone button
   - Frontend requests microphone access
   - Backend VAD state is reset
   - MediaRecorder starts capturing audio chunks (1 second intervals)

2. **Real-time VAD Analysis**:
   - Every 1 second, latest audio chunk sent to backend
   - Backend analyzes with Silero VAD model
   - Returns VAD score and rolling average
   - Frontend tracks speech detection

3. **Auto-Stop on Silence**:
   - When speech detected: reset silence timer
   - When silence detected (VAD score < 0.5):
     - Start silence timer
     - If silence continues for 2.5 seconds: auto-stop
   - **Important**: Only starts counting silence AFTER speech is detected (prevents premature stops)

4. **Transcription**:
   - Recording stops (auto or manual)
   - Complete audio sent to Whisper backend
   - Transcribed text populates search field
   - User can edit or submit

### Technical Flow

```
┌─────────────────┐
│  User clicks    │
│  mic button     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request mic     │
│ access          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Reset VAD state │◄─────────────┐
│ (backend)       │              │
└────────┬────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│ Start recording │              │
│ (1s chunks)     │              │
└────────┬────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│ Analyze chunk   │──────────────┤
│ with VAD        │   Every 1s   │
└────────┬────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│ Speech detected?│              │
└────────┬────────┘              │
         │                       │
    ┌────┴────┐                  │
    │         │                  │
   YES        NO                 │
    │         │                  │
    │         ▼                  │
    │    ┌─────────────────┐    │
    │    │ Start/continue  │    │
    │    │ silence timer   │    │
    │    └────────┬────────┘    │
    │             │              │
    │             ▼              │
    │    ┌─────────────────┐    │
    │    │ > 2.5s silence? │    │
    │    └────────┬────────┘    │
    │             │              │
    │        ┌────┴────┐         │
    │        │         │         │
    │       YES        NO        │
    │        │         │         │
    ▼        ▼         └─────────┘
┌─────────────────┐
│ Stop recording  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Transcribe with │
│ Whisper         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Populate prompt │
│ field           │
└─────────────────┘
```

## Model Details

### Silero VAD Model

**Source**: [snakers4/silero-vad](https://github.com/snakers4/silero-vad)

**License**: MIT License (see headers in `vad_service.py`)

**Requirements**:
- Sample rate: 16 kHz
- Format: 16-bit PCM
- Frame size: 480 samples (30ms) - recommended default
- Input shape: [1, frame_size]

**Performance**:
- Model size: 286KB
- Inference time: ~1-2ms per frame
- CPU-only (ONNX Runtime)

## Dependencies

### Backend (`requirements.txt`)
```
onnxruntime==1.20.1  # ONNX model inference
pydub==0.25.1        # Audio format conversion
numpy==1.26.4        # Already present
```

### Frontend
```typescript
// Built-in Web APIs
- MediaRecorder API
- MediaDevices (getUserMedia)
- Blob/ArrayBuffer
- fetch API
```

## Configuration

### Backend Configuration

No additional environment variables needed. VAD model is bundled.

**Model Path** (auto-detected):
```python
backend/resources/models/silero_vad.onnx
```

### Frontend Configuration

**In `use-vad-recording.ts`**:
```typescript
const defaultConfig = {
  silenceThreshold: 2500,    // 2.5 seconds
  checkInterval: 1000,       // Check every 1 second
  speechThreshold: 0.5,      // VAD score threshold
};
```

**Adjustable per-use**:
```typescript
const { isRecording, toggleRecording } = useVADRecording({
  silenceThreshold: 3000,  // More patient (3 seconds)
  speechThreshold: 0.6,    // More aggressive (requires higher confidence)
});
```

## Testing

### Manual Testing

1. **Start Backend**:
   ```bash
   cd dashboard/backend
   python3 -m uvicorn main:app --reload
   ```

2. **Test VAD Endpoint**:
   ```bash
   # Check health
   curl http://localhost:8000/api/audio/health
   
   # Should return: { "services": { "vad": "ready", ... } }
   ```

3. **Test Frontend**:
   ```bash
   cd dashboard/frontend
   npm run dev
   ```
   
   - Navigate to overview page
   - Click microphone button
   - Speak for a few seconds
   - Stop speaking
   - Recording should auto-stop after 2.5s silence
   - Transcription should appear in search field

### Automated Testing

**Backend Unit Tests** (TODO):
```python
# test_vad_service.py
def test_vad_initialization():
    service = get_vad_service()
    assert service is not None

def test_vad_silence_detection():
    # Test with silent audio
    pass

def test_vad_speech_detection():
    # Test with speech audio
    pass
```

**Frontend Tests** (TODO):
```typescript
// use-vad-recording.test.ts
describe('useVADRecording', () => {
  it('starts recording on toggle', async () => { ... });
  it('stops on silence threshold', async () => { ... });
  it('transcribes audio after stop', async () => { ... });
});
```

## Troubleshooting

### Common Issues

**1. "Model file not found"**
- Ensure `resources/models/silero_vad.onnx` exists
- Re-download: `curl -L https://github.com/snakers4/silero-vad/raw/master/files/silero_vad.onnx -o resources/models/silero_vad.onnx`

**2. "Microphone access denied"**
- Browser requires HTTPS for getUserMedia (except localhost)
- Check browser permissions

**3. "Recording stops too early"**
- Increase `silenceThreshold` (e.g., 3000ms)
- Lower `speechThreshold` (e.g., 0.3)

**4. "Recording doesn't auto-stop"**
- Check backend VAD endpoint is responding
- Check browser console for errors
- Verify audio chunks are being sent

**5. "Transcription fails"**
- Ensure Whisper is properly configured
- Check audio format compatibility
- Verify backend audio service is initialized

## Performance Considerations

### Backend
- VAD inference: ~1-2ms per chunk
- Audio format conversion: ~10-50ms per chunk
- Negligible CPU impact

### Frontend
- Audio recording: Native MediaRecorder (hardware accelerated)
- Network: ~1 request/second during recording
- Bandwidth: ~10-50KB per request (1s audio chunk)

### Optimizations

**Reduce Network Traffic**:
```typescript
// Increase check interval
checkInterval: 2000  // Check every 2 seconds instead of 1
```

**Faster Response**:
```typescript
// Decrease silence threshold
silenceThreshold: 1500  // Stop after 1.5s silence
```

**More Accurate Speech Detection**:
```typescript
// Adjust speech threshold
speechThreshold: 0.6  // Require higher confidence for speech
```

## Future Enhancements

1. **Client-side VAD** (optional):
   - Use WebAssembly version of Silero VAD
   - Eliminates network latency
   - Reduces backend load

2. **Visual Feedback**:
   - Real-time waveform visualization
   - VAD score indicator
   - Speech/silence status badge

3. **Advanced Features**:
   - Multi-language detection
   - Speaker diarization
   - Noise cancellation
   - Echo removal

4. **Analytics**:
   - Track average recording duration
   - Silence detection accuracy
   - User recording patterns

## References

- [Silero VAD GitHub](https://github.com/snakers4/silero-vad)
- [ONNX Runtime Docs](https://onnxruntime.ai/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [OpenAI Whisper](https://github.com/openai/whisper)

## License

- **Silero VAD**: MIT License (Copyright © 2020-present Silero Team)
- **Integration Code**: Apache License 2.0 (Copyright © 2022 David Scripka)

