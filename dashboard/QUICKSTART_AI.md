# AI Assistant Quick Start

## 🚀 Get Started in 3 Steps

### 1. Set Your API Key

```bash
# Add to backend/.env
GEMINI_API_KEY=your_api_key_here
```

Get your key from: https://aistudio.google.com/app/apikey

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Start Both Servers

```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 💡 Usage

1. Open `http://localhost:3000`
2. Click **"AI Assistant"** button (top right)
3. Select model: **Flash** (fast) | **Pro** (smart) | **Lite** (efficient)
4. Type and press Enter!

**Keyboard Shortcut:** `Cmd+K` or `Ctrl+K`

## 📊 Models Comparison

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| **Flash** | ⚡️⚡️⚡️ | ⭐️⭐️ | Quick queries |
| **Pro** | ⚡️ | ⭐️⭐️⭐️ | Complex analysis |
| **Lite** | ⚡️⚡️ | ⭐️ | Simple tasks |

## 🔧 Files Created

### Backend
```
backend/
├── ai_service.py           # AI logic (Flash, Pro, Lite functions)
├── routers/ai.py           # API endpoints
├── main.py                 # Updated with AI router
└── requirements.txt        # Updated with google-genai
```

### Frontend
```
frontend/
├── components/ai-panel.tsx     # Chat interface
└── app/(dashboard)/layout.tsx  # Updated with AI panel
```

## 🧪 Test It

```bash
# Test backend health
curl http://localhost:8000/api/ai/health

# Test AI generation
curl -X POST http://localhost:8000/api/ai/generate/flash \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Say hello!"}'
```

## 📚 Full Documentation

See [AI_SETUP.md](./AI_SETUP.md) for complete guide.

## ⚡️ API Endpoints

- `POST /api/ai/generate/flash` - Fast model
- `POST /api/ai/generate/pro` - Smart model
- `POST /api/ai/generate/lite` - Efficient model
- `GET /api/ai/models` - List all models
- `GET /api/ai/health` - Health check

Full docs: http://localhost:8000/docs


