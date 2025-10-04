# AI Assistant Setup Guide

## Overview

This AI assistant integration uses Google's Gemini API with three different model tiers for optimal performance and flexibility:

- **Flash** (gemini-2.0-flash-exp): Fast responses for quick queries
- **Pro** (gemini-1.5-pro): Balanced performance for complex reasoning
- **Lite** (gemini-1.5-flash-8b): Lightweight model for efficiency

## Architecture

### Backend Structure

```
backend/
├── ai_service.py          # AI logic and model customization
├── routers/
│   └── ai.py             # API endpoints for AI requests
└── main.py               # Router registration
```

**Modular Design:**
- `ai_service.py`: Contains `GeminiAIService` class with separate methods for each model
- `routers/ai.py`: Defines FastAPI endpoints that route to appropriate model functions
- `main.py`: Registers the AI router with the main FastAPI app

### Frontend Structure

```
frontend/
├── components/
│   └── ai-panel.tsx      # AI chat interface component
└── app/(dashboard)/
    └── layout.tsx        # Dashboard layout with AI panel integration
```

## Setup Instructions

### 1. Backend Setup

#### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables

Add your Gemini API key to your environment configuration:

**Option A: Using Infisical (recommended)**
```bash
# Add to Infisical dashboard
GEMINI_API_KEY=your_gemini_api_key_here
```

**Option B: Using .env file**
```bash
# Create/edit backend/.env
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env
```

#### Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your environment

#### Start Backend Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

### 2. Frontend Setup

The frontend is already configured. Just ensure your Next.js app is running:

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Base URL
`http://localhost:8000/api/ai`

### Endpoints

#### 1. Generate with Flash Model
```http
POST /api/ai/generate/flash
Content-Type: application/json

{
  "prompt": "Explain AI in simple terms",
  "system_instruction": "You are a helpful assistant",
  "temperature": 1.0
}
```

#### 2. Generate with Pro Model
```http
POST /api/ai/generate/pro
Content-Type: application/json

{
  "prompt": "Analyze this complex scenario...",
  "system_instruction": "You are an expert analyst",
  "temperature": 1.0,
  "max_tokens": 2048
}
```

#### 3. Generate with Lite Model
```http
POST /api/ai/generate/lite
Content-Type: application/json

{
  "prompt": "Quick summary needed",
  "system_instruction": "Be concise",
  "temperature": 0.5
}
```

#### 4. List Available Models
```http
GET /api/ai/models
```

#### 5. Health Check
```http
GET /api/ai/health
```

## Usage

### Frontend Usage

1. **Open AI Panel**: Click "AI Assistant" button in the header (or press `Cmd+K` / `Ctrl+K`)
2. **Select Model**: Choose from Flash, Pro, or Lite in the dropdown
3. **Send Message**: Type your query and press Enter (Shift+Enter for new line)
4. **View Response**: AI responses appear in the chat with model info and timestamp

### Keyboard Shortcuts

- `Cmd+K` / `Ctrl+K`: Toggle AI panel
- `Cmd+B` / `Ctrl+B`: Toggle sidebar
- `Enter`: Send message
- `Shift+Enter`: New line in message

### Model Selection Guide

**Use Flash when:**
- You need quick responses
- Query is straightforward
- Real-time interaction is important

**Use Pro when:**
- Complex reasoning required
- Detailed analysis needed
- Quality over speed

**Use Lite when:**
- Simple tasks only
- Cost efficiency is priority
- Low latency required

## Customization

### Backend Customization

#### Add New Model

Edit `backend/ai_service.py`:

```python
def generate_with_custom(
    self, 
    prompt: str,
    system_instruction: Optional[str] = None,
    temperature: float = 1.0
) -> Dict[str, Any]:
    """Custom model implementation"""
    return self._generate_content(
        model="gemini-custom-model",
        prompt=prompt,
        system_instruction=system_instruction,
        temperature=temperature
    )
```

Then add endpoint in `backend/routers/ai.py`:

```python
@router.post("/generate/custom", response_model=AIResponse)
async def generate_with_custom(request: AIRequest):
    """Custom model endpoint"""
    ai_service = get_ai_service()
    result = ai_service.generate_with_custom(
        prompt=request.prompt,
        system_instruction=request.system_instruction,
        temperature=request.temperature
    )
    return AIResponse(**result)
```

#### Modify System Instructions

Edit the default system instruction in `frontend/components/ai-panel.tsx`:

```typescript
system_instruction: 'Your custom instruction here',
```

### Frontend Customization

#### Change Panel Width

Edit `frontend/app/(dashboard)/layout.tsx`:

```tsx
<div className="w-[500px] h-full flex-shrink-0">  {/* Change from 400px */}
  <AIPanel onClose={() => setAiPanelOpen(false)} />
</div>
```

#### Customize Appearance

Edit `frontend/components/ai-panel.tsx` to modify colors, styles, or layout.

## Testing

### Test Backend

```bash
# Test health endpoint
curl http://localhost:8000/api/ai/health

# Test models list
curl http://localhost:8000/api/ai/models

# Test Flash generation
curl -X POST http://localhost:8000/api/ai/generate/flash \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how are you?"}'
```

### Test Frontend

1. Open `http://localhost:3000` in your browser
2. Click "AI Assistant" button
3. Select a model
4. Send a test message
5. Verify response appears correctly

## Troubleshooting

### Common Issues

**Issue: "GEMINI_API_KEY not found in environment variables"**
- Solution: Ensure API key is properly set in environment (see Setup Instructions)
- Verify: Check `backend/.env` file or Infisical configuration

**Issue: API requests fail with 403/401**
- Solution: Verify API key is valid and has proper permissions
- Generate new key if needed from Google AI Studio

**Issue: Frontend can't connect to backend**
- Solution: Ensure backend is running on `http://localhost:8000`
- Check CORS settings in `backend/main.py`

**Issue: Model responses are slow**
- Try using Flash model for faster responses
- Check internet connection
- Verify API quota limits

## API Documentation

Full interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Security Notes

- Never commit `.env` files with API keys
- Use environment variables or secret managers (Infisical)
- Rotate API keys regularly
- Monitor API usage in Google Cloud Console

## Performance Tips

1. **Use appropriate models**: Don't use Pro for simple queries
2. **Set temperature wisely**: Lower temperature (0.0-0.5) for factual responses
3. **Limit max_tokens**: Prevent unnecessarily long responses
4. **Cache common queries**: Consider implementing response caching

## Future Enhancements

Potential improvements:
- Conversation history persistence
- Multi-modal support (images, files)
- Streaming responses for real-time output
- Rate limiting and usage tracking
- Fine-tuned models for domain-specific tasks
- Context window management for long conversations


