# Image & Video Generation with Gemini

## Overview

Your Aegis AI assistant now supports:
- **Image Generation** via Imagen 4.0
- **Video Generation** via Veo 3.0

Both capabilities are fully integrated into the backend API with modular, easy-to-use functions.

---

## 🎨 Image Generation

### API Endpoint
```
POST /api/ai/generate/images
```

### Request Example
```json
{
  "prompt": "A futuristic city with flying cars at sunset",
  "number_of_images": 2,
  "aspect_ratio": "16:9",
  "safety_filter_level": "block_some",
  "person_generation": "allow_all"
}
```

### Response Example
```json
{
  "success": true,
  "images": [
    {
      "data": "base64_encoded_image_data...",
      "format": "png",
      "mime_type": "image/png"
    }
  ],
  "count": 2,
  "prompt": "A futuristic city...",
  "model": "imagen-4.0"
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | **required** | Description of image to generate |
| `number_of_images` | int | 1 | Number of images (1-4) |
| `aspect_ratio` | string | "1:1" | Options: "1:1", "16:9", "9:16", "4:3", "3:4" |
| `safety_filter_level` | string | "block_some" | Options: "block_most", "block_some", "block_few" |
| `person_generation` | string | "allow_all" | Options: "allow_all", "allow_adult", "block_all" |

### Python Example
```python
from ai_service import get_ai_service

ai = get_ai_service()

result = ai.generate_images(
    prompt="Robot holding a red skateboard",
    number_of_images=4,
    aspect_ratio="1:1"
)

if result['success']:
    for img in result['images']:
        # img['data'] is base64 encoded PNG
        print(f"Generated image: {len(img['data'])} bytes")
```

### cURL Example
```bash
curl -X POST http://localhost:8000/api/ai/generate/images \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Beautiful mountain landscape",
    "number_of_images": 1,
    "aspect_ratio": "16:9"
  }'
```

---

## 🎬 Video Generation

### API Endpoint
```
POST /api/ai/generate/video
```

⚠️ **Important**: Video generation takes **2-10 minutes** to complete. The endpoint will wait until the video is ready or timeout occurs.

### Request Example
```json
{
  "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering",
  "aspect_ratio": "16:9",
  "duration_seconds": 5,
  "poll_interval": 10,
  "max_wait_time": 600
}
```

### Response Example
```json
{
  "success": true,
  "video": {
    "data": "base64_encoded_video_data...",
    "format": "mp4",
    "mime_type": "video/mp4",
    "duration": 5
  },
  "prompt": "A close up of two people...",
  "model": "veo-3.0",
  "generation_time": 127
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | **required** | Description of video to generate |
| `aspect_ratio` | string | "16:9" | Options: "16:9", "9:16", "1:1" |
| `duration_seconds` | int | 5 | Video duration (2-10 seconds) |
| `poll_interval` | int | 10 | Seconds between status checks (5-30) |
| `max_wait_time` | int | 600 | Max wait time in seconds (60-1800) |

### Python Example
```python
from ai_service import get_ai_service

ai = get_ai_service()

result = ai.generate_video(
    prompt="A man walks through a foggy forest at dawn",
    duration_seconds=7,
    aspect_ratio="16:9"
)

if result['success']:
    video_data = result['video']['data']
    # Decode and save
    import base64
    with open('output.mp4', 'wb') as f:
        f.write(base64.b64decode(video_data))
    print(f"Video generated in {result['generation_time']}s")
```

### cURL Example
```bash
curl -X POST http://localhost:8000/api/ai/generate/video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Sunset over ocean waves",
    "duration_seconds": 5,
    "aspect_ratio": "16:9"
  }'
```

---

## 📝 Backend Code Structure

### Service Layer (`backend/ai_service.py`)

```python
class GeminiAIService:
    def generate_images(
        self,
        prompt: str,
        number_of_images: int = 1,
        aspect_ratio: str = "1:1",
        safety_filter_level: str = "block_some",
        person_generation: str = "allow_all"
    ) -> Dict[str, Any]:
        """Generate images using Imagen 4.0"""
        
    def generate_video(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
        duration_seconds: int = 5,
        poll_interval: int = 10,
        max_wait_time: int = 600
    ) -> Dict[str, Any]:
        """Generate video using Veo 3.0"""
```

### Router Layer (`backend/routers/ai.py`)

```python
@router.post("/generate/images", response_model=ImageGenerationResponse)
async def generate_images(request: ImageGenerationRequest):
    """API endpoint for image generation"""
    
@router.post("/generate/video", response_model=VideoGenerationResponse)
async def generate_video(request: VideoGenerationRequest):
    """API endpoint for video generation"""
```

---

## 🎯 Use Cases

### Image Generation

✅ **Infrastructure Visualization**
- Generate concept images of proposed projects
- Create visual documentation
- Produce marketing materials

✅ **Report Enhancement**
- Add illustrations to reports
- Create infographics
- Generate diagrams

### Video Generation

✅ **Project Demonstrations**
- Create video walkthroughs
- Generate animation previews
- Produce promotional content

✅ **Concept Presentations**
- Visualize infrastructure changes
- Show before/after scenarios
- Create presentation materials

---

## 🔧 Installation

```bash
cd backend
pip install -r requirements.txt
```

Dependencies added:
- `google-genai==0.2.2` - Gemini API client
- `Pillow==11.0.0` - Image processing

---

## 💡 Tips & Best Practices

### Image Generation

1. **Be Specific**: Detailed prompts yield better results
   - ❌ "a building"
   - ✅ "modern glass skyscraper at sunset with reflective windows"

2. **Aspect Ratio Selection**:
   - `1:1` - Social media, profile images
   - `16:9` - Presentations, displays
   - `9:16` - Mobile vertical content
   - `4:3` / `3:4` - Print materials

3. **Multiple Images**: Generate 2-4 variations to choose the best one

4. **Safety Filters**: 
   - Use `block_most` for public-facing content
   - Use `block_few` for internal concept work

### Video Generation

1. **Keep It Short**: 5 seconds is usually sufficient for most clips

2. **Detailed Descriptions**: Include:
   - Scene setting
   - Action/movement
   - Mood/atmosphere
   - Time of day/lighting

3. **Plan for Wait Time**: 
   - Set realistic timeouts (300-600 seconds)
   - Consider async processing for production
   - Display progress indicators to users

4. **Aspect Ratios**:
   - `16:9` - Standard video, presentations
   - `9:16` - Mobile stories, TikTok
   - `1:1` - Instagram posts

---

## 🚀 Testing

### Test Image Generation
```bash
curl -X POST http://localhost:8000/api/ai/generate/images \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test image", "number_of_images": 1}' \
  | jq '.success'
```

### Test Video Generation
```bash
curl -X POST http://localhost:8000/api/ai/generate/video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "waves crashing on beach",
    "duration_seconds": 3,
    "max_wait_time": 300
  }' \
  | jq '.success'
```

### View API Docs
```
http://localhost:8000/docs
```

---

## ⚠️ Important Notes

### Video Generation Considerations

1. **Long Processing Time**: Videos take 2-10 minutes to generate
2. **Resource Intensive**: Use appropriate timeouts
3. **Production Usage**: Consider:
   - Async task queues (Celery, RQ)
   - Background jobs
   - Status webhooks
   - Progress tracking

### Rate Limits

- Check your Google Cloud quotas
- Implement rate limiting for production
- Monitor API usage in Google Cloud Console

### Data Size

- **Images**: ~1-3 MB each (base64-encoded)
- **Videos**: ~5-20 MB (base64-encoded)
- Consider file storage for large-scale usage

---

## 🔐 Security

- API key stored in environment variables
- Never expose API keys in frontend
- All generation goes through backend
- Implement user authentication for production
- Monitor API usage for abuse

---

## 📊 Model Information

| Model | Type | Speed | Quality | Cost |
|-------|------|-------|---------|------|
| Imagen 4.0 | Image | ⚡️⚡️⚡️ | ⭐️⭐️⭐️⭐️ | $$ |
| Veo 3.0 | Video | ⚡️ | ⭐️⭐️⭐️⭐️⭐️ | $$$$ |

---

## 🆘 Troubleshooting

### Issue: "Import could not be resolved"
- **Solution**: Run `pip install -r requirements.txt`

### Issue: Image generation fails
- **Solution**: Check API key, verify Imagen is enabled in Google Cloud

### Issue: Video generation times out
- **Solution**: Increase `max_wait_time` parameter (up to 1800 seconds)

### Issue: Large payload errors
- **Solution**: 
  - Generate fewer images
  - Use shorter video durations
  - Implement file storage instead of base64 transfer

---

## 🔮 Future Enhancements

Potential improvements:
- Streaming video progress updates
- Image editing/variation generation
- Video-to-video transformation
- Batch processing
- File storage integration
- Progress webhooks
- Caching generated content

---

## 📚 Resources

- [Imagen Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)
- [Veo Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview)
- [Google AI Studio](https://aistudio.google.com/)
- [API Documentation](http://localhost:8000/docs)

