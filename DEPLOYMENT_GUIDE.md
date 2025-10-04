# 🚀 Yummy Deployment Guide

This guide will walk you through deploying your Yummy application to **Render** (backend) and **Netlify** (frontend).

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ A [Render](https://render.com/) account (free tier available)
2. ✅ A [Netlify](https://netlify.com/) account (free tier available)
3. ✅ A GitHub repository with your code pushed
4. ✅ All API keys and credentials ready (see Environment Variables section)

---

## 🔧 Part 1: Backend Deployment (Render)

### Step 1: Connect Your Repository

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `Yummy` repository

### Step 2: Configure Service Settings

Render will detect your `render.yaml` configuration file. Verify these settings:

- **Name**: `yummy-backend`
- **Region**: Choose closest to your users (Oregon, Ohio, Virginia, Frankfurt, Singapore)
- **Branch**: `main` (or your default branch)
- **Runtime**: Python
- **Build Command**: 
  ```bash
  cd dashboard/backend && pip install --upgrade pip && pip install -r requirements.txt && pip install gunicorn
  ```
- **Start Command**: 
  ```bash
  cd dashboard/backend && gunicorn -c gunicorn.conf.py main:app
  ```

### Step 3: Set Environment Variables

In the Render dashboard, add these environment variables:

#### Required Variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# AI Services
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-claude-api-key

# Google Services
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Twilio (for SMS/reservations)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Security
JWT_SECRET=generate-a-secure-random-string-here

# Environment
ENVIRONMENT=production
PORT=8000
```

#### Optional Variables:

```bash
# OpenAI (if using)
OPENAI_API_KEY=your-openai-key

# ElevenLabs (for text-to-speech)
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete (5-10 minutes)
3. Your backend will be live at: `https://yummy-backend.onrender.com`

### Step 5: Test Your Backend

Visit these endpoints to verify:

- Health Check: `https://yummy-backend.onrender.com/health`
- API Docs: `https://yummy-backend.onrender.com/docs`
- Root: `https://yummy-backend.onrender.com/`

---

## 🌐 Part 2: Frontend Deployment (Netlify)

### Step 1: Connect Your Repository

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Select the `Yummy` repository

### Step 2: Configure Build Settings

Netlify will detect your `netlify.toml` configuration. Verify:

- **Base directory**: `dashboard/frontend`
- **Build command**: `npm run build`
- **Publish directory**: `dashboard/frontend/.next`
- **Node version**: 20

### Step 3: Set Environment Variables

In Netlify dashboard, go to **Site settings** → **Environment variables**:

```bash
# Supabase (Public keys - safe for frontend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Backend API
NEXT_PUBLIC_API_URL=https://yummy-backend.onrender.com

# Google Maps (Public - restrict by domain in Google Console)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Environment
NEXT_PUBLIC_ENVIRONMENT=production
```

### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait for the build to complete (3-5 minutes)
3. Your frontend will be live at: `https://your-app-name.netlify.app`

### Step 5: Update Backend CORS

Go back to **Render** and update the `FRONTEND_URL` environment variable:

```bash
FRONTEND_URL=https://your-app-name.netlify.app
```

This ensures your backend accepts requests from your frontend domain.

---

## 🔐 Security Best Practices

### 1. API Keys

- ✅ **Never** commit API keys to your repository
- ✅ Use environment variables for all secrets
- ✅ Restrict API keys by domain/IP in provider dashboards
- ✅ Rotate keys periodically

### 2. Google Maps API

Restrict your Google Maps API key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Credentials**
3. Edit your API key
4. Add **HTTP referrers (websites)** restrictions:
   - `https://your-app-name.netlify.app/*`
   - `http://localhost:3000/*` (for development)

### 3. Supabase

- Use **anon key** for frontend (public-safe)
- Use **service role key** for backend only (keep private)
- Enable Row Level Security (RLS) on all tables
- Regularly review database access logs

### 4. JWT Secret

Generate a strong JWT secret:

```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use Python:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📊 Monitoring & Debugging

### Render Logs

View real-time logs:
1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. Monitor for errors or warnings

### Netlify Logs

View build and function logs:
1. Go to your site in Netlify dashboard
2. Click **"Deploys"** tab
3. Select a deploy to view logs

### Health Checks

Render automatically monitors your `/health` endpoint. If it fails, Render will restart your service.

---

## 🔄 Continuous Deployment

Both Render and Netlify support automatic deployments:

- **Push to `main` branch** → Automatic deployment
- **Create a PR** → Preview deployment (Netlify only)
- **Merge PR** → Production deployment

To disable auto-deploy:
- **Render**: Turn off "Auto-Deploy" in service settings
- **Netlify**: Turn off "Auto publishing" in deploy settings

---

## 🛠️ Troubleshooting

### Backend Issues

**Problem**: Service won't start
- ✅ Check Render logs for Python errors
- ✅ Verify all required environment variables are set
- ✅ Test locally with production-like environment

**Problem**: CORS errors
- ✅ Verify `FRONTEND_URL` matches your Netlify domain exactly
- ✅ Include `https://` protocol
- ✅ No trailing slash

**Problem**: Database connection fails
- ✅ Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- ✅ Check Supabase dashboard for connection issues
- ✅ Ensure RLS policies allow backend access

### Frontend Issues

**Problem**: Build fails
- ✅ Check Netlify build logs
- ✅ Verify all `NEXT_PUBLIC_*` variables are set
- ✅ Test build locally: `cd dashboard/frontend && npm run build`

**Problem**: API calls fail
- ✅ Verify `NEXT_PUBLIC_API_URL` is correct
- ✅ Check browser console for CORS errors
- ✅ Ensure backend is running and healthy

**Problem**: 404 on page refresh
- ✅ Netlify config should handle this (check `netlify.toml`)
- ✅ Verify redirects are configured correctly

---

## 📈 Performance Optimization

### Backend (Render)

1. **Upgrade to paid plan** for:
   - No cold starts (free tier sleeps after 15 minutes)
   - More CPU/RAM
   - Persistent storage

2. **Optimize Gunicorn workers**:
   - Adjust `WEB_CONCURRENCY` env var
   - Default: `(CPU cores * 2) + 1`

3. **Enable caching**:
   - Use Redis for session storage
   - Cache AI responses

### Frontend (Netlify)

1. **Image optimization**:
   - Use Next.js Image component
   - Enable automatic WebP conversion

2. **Code splitting**:
   - Already configured with Next.js
   - Lazy load heavy components

3. **CDN caching**:
   - Netlify automatically serves from CDN
   - Configure cache headers if needed

---

## 💰 Cost Estimates

### Free Tier (Good for MVP/Testing)

- **Render Free**: 750 hours/month, sleeps after 15 min inactivity
- **Netlify Free**: 100GB bandwidth, 300 build minutes/month
- **Total**: $0/month

### Paid Tier (Production Ready)

- **Render Starter**: $7/month (no sleep, 512MB RAM)
- **Netlify Pro**: $19/month (more bandwidth, build minutes)
- **Total**: ~$26/month

### API Costs (Variable)

- **Google Maps API**: $200 free credit/month, then pay-as-you-go
- **Gemini API**: Free tier available, then pay-as-you-go
- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Twilio**: Pay-as-you-go ($0.0075/SMS)

---

## 🎯 Post-Deployment Checklist

- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] User authentication works
- [ ] Image upload works
- [ ] AI analysis completes
- [ ] Restaurant search works
- [ ] SMS notifications send (if using Twilio)
- [ ] All environment variables are set
- [ ] CORS is properly configured
- [ ] API keys are restricted by domain
- [ ] Database RLS policies are enabled
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS is working
- [ ] Error monitoring is set up (optional: Sentry)

---

## 🆘 Support

If you run into issues:

1. Check the logs first (Render + Netlify dashboards)
2. Review this guide carefully
3. Test locally with production environment variables
4. Check your API key restrictions and quotas
5. Review Supabase database logs

---

## 🎉 You're Live!

Once everything is deployed:

1. Share your Netlify URL: `https://your-app-name.netlify.app`
2. Test all features thoroughly
3. Monitor logs for any issues
4. Consider setting up custom domain
5. Add analytics (Google Analytics, Plausible, etc.)

**Backend URL**: `https://yummy-backend.onrender.com`  
**Frontend URL**: `https://your-app-name.netlify.app`  
**API Docs**: `https://yummy-backend.onrender.com/docs`

Happy deploying! 🚀

