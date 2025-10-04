# Aegis Platform Services Overview

## 🎯 Complete Service Architecture

Your Aegis dashboard now includes a comprehensive suite of AI and audio services, all built with modular, production-ready code.

---

## 🤖 AI Services (Gemini)

### Text Generation
- **Flash Model** - Fast responses
- **Pro Model** - Complex reasoning  
- **Lite Model** - Efficient processing

### Image Generation
- **Imagen 4.0** - High-quality images
- Multiple aspect ratios
- Safety controls

### Video Generation
- **Veo 3.0** - 2-10 second videos
- HD quality output
- Multiple formats

**Files:**
- `backend/ai_service.py` - AI logic
- `backend/routers/ai.py` - API endpoints
- `frontend/components/ai-panel.tsx` - Chat UI

**Docs:** [AI_SETUP.md](./AI_SETUP.md) | [IMAGE_VIDEO_GENERATION.md](./IMAGE_VIDEO_GENERATION.md)

---

## 🎤 Audio Services

### Text-to-Speech (ElevenLabs)
- **HTTP Streaming** - Low-latency playback
- **Conversion** - Base64 audio files
- Multiple voices
- Customizable settings

### Speech-to-Text (Whisper)
- **File Upload** - Direct transcription
- **Base64 Audio** - API integration
- Multiple languages
- Translation support

**Files:**
- `backend/audio_service.py` - TTS/STT logic
- `backend/routers/audio.py` - Audio endpoints

**Docs:** [AUDIO_SERVICES.md](./AUDIO_SERVICES.md) | [AUDIO_QUICKSTART.md](./AUDIO_QUICKSTART.md)

---

## 🗄️ Database Services

### Supabase Client
- Connection management
- Raw SQL execution
- Table queries with filters
- Type-safe operations

**Files:**
- `backend/supabase_client.py` - Database client
- `backend/routers/issues.py` - Issues API

---

## 📁 Project Structure

```
dashboard/
├── backend/
│   ├── ai_service.py           # Gemini AI (text, image, video)
│   ├── audio_service.py        # TTS & STT
│   ├── supabase_client.py      # Database client
│   ├── main.py                 # FastAPI app
│   ├── requirements.txt        # Dependencies
│   └── routers/
│       ├── ai.py               # AI endpoints
│       ├── audio.py            # Audio endpoints
│       └── issues.py           # Issues endpoints
│
├── frontend/
│   ├── components/
│   │   └── ai-panel.tsx        # AI chat interface
│   └── app/(dashboard)/
│       └── layout.tsx          # Dashboard with AI panel
│
└── docs/
    ├── AI_SETUP.md
    ├── IMAGE_VIDEO_GENERATION.md
    ├── AUDIO_SERVICES.md
    ├── AUDIO_QUICKSTART.md
    └── README_SERVICES.md (this file)
```

---

## 🚀 Quick Start

### 1. Environment Setup

```bash
# backend/.env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 2. Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 3. Start Services

```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🌐 API Endpoints

### AI Endpoints
```
POST /api/ai/generate/flash      # Fast text generation
POST /api/ai/generate/pro        # Advanced text generation
POST /api/ai/generate/lite       # Efficient text generation
POST /api/ai/generate/images     # Image generation
POST /api/ai/generate/video      # Video generation
GET  /api/ai/models              # List models
GET  /api/ai/health              # Health check
```

### Audio Endpoints
```
GET  /api/audio/tts/stream            # Stream TTS audio
POST /api/audio/tts/convert           # Convert TTS to base64
POST /api/audio/stt/transcribe        # Transcribe base64 audio
POST /api/audio/stt/transcribe-file   # Transcribe uploaded file
GET  /api/audio/voices                # List voices
GET  /api/audio/health                # Health check
```

### Issues Endpoints
```
GET  /api/issues                 # List issues
GET  /api/issues/stats           # Issue statistics
GET  /api/issues/{id}            # Get issue by ID
```

### General
```
GET  /                           # API info
GET  /health                     # System health
GET  /docs                       # API documentation (Swagger)
GET  /redoc                      # API documentation (ReDoc)
```

---

## 🎨 Frontend Features

### AI Panel
- **Toggle:** Click "AI Assistant" or press `Cmd+K`
- **Models:** Select Flash, Pro, or Lite
- **Chat:** Real-time conversation with AI
- **History:** Message persistence in session
- **Responsive:** 400px side panel

### Dashboard Layout
- **Sidebar:** Collapsible navigation
- **Header:** Status and controls
- **Main Content:** Dynamic page content
- **AI Panel:** Slide-in assistant

---

## 💡 Common Use Cases

### AI Text Generation
```javascript
// Quick AI query
const response = await fetch('/api/ai/generate/flash', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Explain this data...' })
});
```

### Image Generation
```javascript
// Generate visualization
const response = await fetch('/api/ai/generate/images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Modern city infrastructure diagram',
    number_of_images: 1,
    aspect_ratio: '16:9'
  })
});
```

### TTS Streaming
```javascript
// Speak text
const audio = new Audio('/api/audio/tts/stream?text=Alert+message');
audio.play();
```

### STT Transcription
```javascript
// Transcribe audio
const formData = new FormData();
formData.append('file', audioFile);
const response = await fetch('/api/audio/stt/transcribe-file', {
  method: 'POST',
  body: formData
});
```

---

## 📦 Dependencies

### Backend
```
fastapi==0.115.0              # Web framework
uvicorn==0.31.0               # ASGI server
supabase==2.9.0               # Database client
google-genai==0.2.2           # Gemini API
elevenlabs==1.15.0            # TTS
openai-whisper==20240930      # STT
Pillow==11.0.0                # Image processing
requests==2.32.3              # HTTP client
python-dotenv==1.0.1          # Environment variables
pydantic==2.9.2               # Data validation
infisical-python==2.1.6       # Secrets management
```

### Frontend
```
next.js                       # React framework
tailwindcss                   # Styling
shadcn/ui                     # UI components
lucide-react                  # Icons
```

---

## 🔐 Security Best Practices

1. **Environment Variables**
   - Store all API keys in `.env` or Infisical
   - Never commit secrets to git
   - Use different keys for dev/prod

2. **API Keys**
   - Rotate keys regularly
   - Monitor usage in provider dashboards
   - Set up rate limiting

3. **CORS**
   - Configured for localhost development
   - Update for production domains
   - Enable credentials carefully

4. **File Uploads**
   - Validate file types
   - Limit file sizes
   - Sanitize filenames

---

## 🧪 Testing

### Backend API
```bash
# Test health
curl http://localhost:8000/health

# Test AI
curl -X POST http://localhost:8000/api/ai/generate/flash \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'

# Test TTS
curl "http://localhost:8000/api/audio/tts/stream?text=Test" > test.mp3

# Test STT
curl -X POST http://localhost:8000/api/audio/stt/transcribe-file \
  -F "file=@audio.mp3"
```

### Interactive API Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📊 Performance Metrics

| Service | Latency | Notes |
|---------|---------|-------|
| Text Gen (Flash) | ~500ms | Fast responses |
| Text Gen (Pro) | ~2s | Higher quality |
| Image Gen | ~5-10s | Per image |
| Video Gen | ~2-10min | Async recommended |
| TTS Streaming | ~100ms | First chunk |
| TTS Convert | ~1-3s | Full audio |
| STT (base) | ~0.5x RT | 30s audio = 15s |

---

## 🆘 Troubleshooting

### Backend Won't Start
- Check all API keys are set
- Verify Python dependencies installed
- Check port 8000 is available

### Frontend Can't Connect
- Ensure backend is running
- Check CORS settings
- Verify API URLs

### AI Errors
- Validate API key
- Check quota limits
- Review error messages in logs

### Audio Issues
- Check audio format support
- Verify ElevenLabs API key
- Test with small files first

---

## 🔮 Future Enhancements

- [ ] WebSocket support for real-time streaming
- [ ] Background job processing
- [ ] Caching layer (Redis)
- [ ] Rate limiting middleware
- [ ] User authentication
- [ ] Usage analytics
- [ ] File storage (S3)
- [ ] Multi-language support
- [ ] Mobile app API
- [ ] Webhook integrations

---

## 📚 Documentation Index

- **[AI_SETUP.md](./AI_SETUP.md)** - Complete AI setup guide
- **[QUICKSTART_AI.md](./QUICKSTART_AI.md)** - AI quick reference
- **[IMAGE_VIDEO_GENERATION.md](./IMAGE_VIDEO_GENERATION.md)** - Media generation
- **[AUDIO_SERVICES.md](./AUDIO_SERVICES.md)** - TTS/STT guide
- **[AUDIO_QUICKSTART.md](./AUDIO_QUICKSTART.md)** - Audio quick reference
- **[README_SERVICES.md](./README_SERVICES.md)** - This file

---

## 🤝 Contributing

When adding new services:
1. Create service module in `backend/`
2. Create router in `backend/routers/`
3. Register router in `backend/main.py`
4. Add dependencies to `requirements.txt`
5. Document in markdown file
6. Add tests

---

## 📞 Support

- API Documentation: http://localhost:8000/docs
- Gemini Docs: https://ai.google.dev/
- ElevenLabs Docs: https://elevenlabs.io/docs
- Whisper Docs: https://github.com/openai/whisper
- Supabase Docs: https://supabase.com/docs

