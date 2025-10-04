# Aegis Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd dashboard/backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `dashboard/backend` directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://ocwyjzrgxgpfwruobjfh.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Storage Configuration
SUPABASE_STORAGE_BUCKET=issue-images

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development
```

**Important:** 
- Use your **Supabase Service Role Key** (not the anon key) from the Supabase dashboard
- Get your **Anthropic API key** from https://console.anthropic.com/

### 3. Create Supabase Storage Bucket

1. Go to your Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `issue-images`
4. Public bucket: **Yes**
5. Allowed MIME types: `image/jpeg`, `image/png`
6. File size limit: 10MB
7. Click Save

### 4. Run the Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --port 8000
```

The server will start at: http://localhost:8000

### 5. Test the API

#### Health Check
```bash
curl http://localhost:8000/health
```

#### API Documentation
Open in browser: http://localhost:8000/docs

## API Endpoints

### 1. POST /api/analyze-image
Analyze an image with Claude AI

**Request:**
- Headers: `Authorization: Bearer <supabase_jwt_token>`
- Body (multipart/form-data):
  - `image`: file
  - `geolocation`: string (e.g., "40.7128,-74.0060")
  - `timestamp`: string (ISO8601)

**Response:**
```json
{
  "description": "Large pothole approximately 2 feet wide..."
}
```

### 2. POST /api/issues/submit
Submit an issue (upload image and create database entry)

**Request:**
- Headers: `Authorization: Bearer <supabase_jwt_token>`
- Body (multipart/form-data):
  - `image`: file
  - `description`: string
  - `geolocation`: string
  - `timestamp`: string (ISO8601)

**Response:**
```json
{
  "id": "uuid",
  "image_id": "https://...",
  "description": "...",
  "geolocation": "...",
  "timestamp": "...",
  "status": "incomplete",
  "uid": "user-uuid"
}
```

### 3. GET /api/issues
Get all issues for authenticated user

**Request:**
- Headers: `Authorization: Bearer <supabase_jwt_token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "image_id": "https://...",
    "description": "...",
    ...
  }
]
```

### 4. GET /api/issues/all
Get all issues (for dashboard, no auth required)

**Response:**
```json
[
  {
    "id": "uuid",
    "image_id": "https://...",
    "description": "...",
    ...
  }
]
```

## Testing with iOS App

### Get Your Mac's Local IP

```bash
# On Mac
ipconfig getifaddr en0

# Example output: 192.168.1.123
```

### Update iOS App

In your iOS app's `NetworkService.swift`:

```swift
private let baseURL = "http://192.168.1.123:8000"
```

Replace `192.168.1.123` with your actual IP address.

### Test Flow

1. Start backend: `python main.py`
2. Run iOS app in simulator
3. Sign up/login in the app
4. Take a photo and submit
5. Watch backend terminal for logs

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY environment variable not set"
- Make sure your `.env` file exists in the `dashboard/backend` directory
- Verify the API key is correct

### Issue: "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set"
- Check your `.env` file has both variables
- Make sure you're using the **Service Role Key**, not the anon key

### Issue: "Failed to upload image"
- Ensure the storage bucket `issue-images` exists
- Verify the bucket is set to **public**
- Check your Supabase service role key has storage permissions

### Issue: "Connection Refused" from iOS
- Backend not running: Start with `python main.py`
- Wrong IP address: Get your Mac's IP with `ipconfig getifaddr en0`
- Firewall blocking: Check macOS firewall settings

### Issue: "Invalid token"
- Make sure iOS app is sending JWT token in Authorization header
- Token format should be: `Bearer <token>`
- Check that user is logged in via Supabase auth

## Development Tips

### View Logs
The backend prints detailed logs for each request:
- `[ANALYZE]` - Image analysis requests
- `[SUBMIT]` - Issue submission requests
- `[GET_ISSUES]` - Fetching user issues

### Test Authentication
Use the `/health` endpoint to verify services are configured:
```bash
curl http://localhost:8000/health
```

### Database Schema
See `database info.md` in the project root for the complete database schema.

