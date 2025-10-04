# Audio Services Quick Start

## 🚀 Setup (3 steps)

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Add API Key
```bash
# Add to backend/.env
ELEVENLABS_API_KEY=your_api_key_here
```

Get your key: https://elevenlabs.io/app/settings/api-keys

### 3. Start Server
```bash
python main.py
```

---

## 🎤 Text-to-Speech

### Browser (Simple)
```javascript
// Play text as speech
const audio = new Audio('/api/audio/tts/stream?text=Hello+world');
audio.play();
```

### cURL
```bash
# Stream to file
curl "http://localhost:8000/api/audio/tts/stream?text=Hello" > output.mp3

# Play directly (macOS)
curl "http://localhost:8000/api/audio/tts/stream?text=Hello" | afplay -
```

---

## 🎙️ Speech-to-Text

### Upload File
```bash
curl -X POST http://localhost:8000/api/audio/stt/transcribe-file \
  -F "file=@recording.mp3"
```

### JavaScript
```javascript
async function transcribe(audioFile) {
  const formData = new FormData();
  formData.append('file', audioFile);
  
  const res = await fetch('/api/audio/stt/transcribe-file', {
    method: 'POST',
    body: formData
  });
  
  const data = await res.json();
  return data.text;
}
```

---

## 📋 Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/audio/tts/stream` | Stream TTS audio |
| `POST /api/audio/tts/convert` | Get base64 audio |
| `POST /api/audio/stt/transcribe-file` | Transcribe file |
| `GET /api/audio/voices` | List voices |

---

## 🎯 Quick Examples

### React TTS Button
```jsx
function SpeakButton({ text }) {
  const speak = () => {
    const url = `/api/audio/tts/stream?text=${encodeURIComponent(text)}`;
    new Audio(url).play();
  };
  
  return <button onClick={speak}>🔊 Speak</button>;
}
```

### Voice Recorder Component
```jsx
function VoiceRecorder() {
  const [text, setText] = useState('');
  
  const handleFile = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/audio/stt/transcribe-file', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    setText(data.text);
  };
  
  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFile} />
      <p>{text}</p>
    </div>
  );
}
```

---

## 📚 Full Documentation

- **Detailed Guide:** [AUDIO_SERVICES.md](./AUDIO_SERVICES.md)
- **API Docs:** http://localhost:8000/docs
- **ElevenLabs:** https://elevenlabs.io/docs

---

## ⚡ Tips

- **TTS**: Use streaming for real-time, conversion for storage
- **STT**: Specify language for better accuracy
- **Voices**: List available voices with `GET /api/audio/voices`
- **Quality**: Higher audio quality = better transcription

