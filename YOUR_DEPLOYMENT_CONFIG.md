# 🎯 Your Specific Deployment Configuration

## 🔗 Your URLs

- **Frontend (Netlify)**: https://findwithyummy.netlify.app
- **Backend (Render)**: https://yummy-wehd.onrender.com
- **API Docs**: https://yummy-wehd.onrender.com/docs

---

## 🌐 Netlify Settings - COPY THESE EXACTLY

### Build Settings
```
Runtime: Not set (auto-detected)
Base directory: dashboard/frontend
Package directory: Not set
Build command: npm run build
Publish directory: .next
Functions directory: dashboard/frontend/netlify/functions
Deploy log visibility: Logs are public
Build status: Active
```

### Environment Variables (Site Configuration > Environment Variables)

Go to: https://app.netlify.com/sites/findwithyummy/configuration/env

Add these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_API_URL=https://yummy-wehd.onrender.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 🔧 Render Settings - COPY THESE EXACTLY

Go to: https://dashboard.render.com/web/srv-XXXXX/settings (your Yummy service)

### General Settings
```
Name: Yummy
Region: Oregon (US West)
Instance Type: Starter (0.5 CPU, 512 MB)
```

### Build & Deploy Settings
```
Repository: https://github.com/scrappydevs/Yummy
Branch: main
Root Directory: dashboard/backend
Build Command: pip install --upgrade pip && pip install -r requirements.txt
Pre-Deploy Command: (leave empty)
Start Command: gunicorn -c gunicorn.conf.py main:app
Auto-Deploy: On Commit ✓
```

### Environment Variables (Environment tab)

Add these variables:

```bash
# Supabase
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_KEY=<your-supabase-service-role-key>

# AI Services
GEMINI_API_KEY=<your-gemini-api-key>
ANTHROPIC_API_KEY=<your-claude-api-key>

# Google Services
GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>

# Twilio
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone>

# Security
JWT_SECRET=<generate-with: openssl rand -base64 32>

# Configuration
ENVIRONMENT=production
FRONTEND_URL=https://findwithyummy.netlify.app
PORT=8000
```

---

## ✅ CORS Configuration

**Already configured!** The backend now automatically allows:
- ✅ https://findwithyummy.netlify.app
- ✅ https://yummy-wehd.onrender.com
- ✅ http://localhost:3000 (development only)

No additional CORS setup needed! 🎉

---

## 🚀 Deployment Steps

### Step 1: Push Your Code
```bash
cd /Users/vini/yummy/Yummy
git add .
git commit -m "Configure for production deployment"
git push origin main
```

### Step 2: Update Render Settings
1. Go to: https://dashboard.render.com/web/srv-XXXXX
2. Click **"Settings"** in the left sidebar
3. Scroll to **"Build & Deploy"**
4. Update these fields:
   - **Root Directory**: `dashboard/backend`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `gunicorn -c gunicorn.conf.py main:app`
5. Click **"Save Changes"**
6. Go to **"Environment"** tab
7. Add all environment variables listed above
8. Click **"Manual Deploy"** > **"Deploy latest commit"**

### Step 3: Update Netlify Settings
1. Go to: https://app.netlify.com/sites/findwithyummy
2. Click **"Site configuration"** > **"Build & deploy"**
3. Update these fields:
   - **Publish directory**: `.next`
4. Click **"Site configuration"** > **"Environment variables"**
5. Add all environment variables listed above
6. Click **"Deploys"** > **"Trigger deploy"**

---

## 🧪 Testing Your Deployment

### Test Backend (Run in Terminal)

```bash
# Health check
curl https://yummy-wehd.onrender.com/health

# Expected response:
# {"status":"healthy","services":{"gemini":"configured","supabase":"configured"}}
```

### Test Frontend

1. Visit: https://findwithyummy.netlify.app
2. Open browser console (F12)
3. Check for errors
4. Test image upload feature
5. Verify API calls work

### Test CORS

```bash
# This should work without CORS errors
curl -H "Origin: https://findwithyummy.netlify.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://yummy-wehd.onrender.com/health -v
```

---

## 🔍 Monitoring & Logs

### Render Logs
- Live logs: https://dashboard.render.com/web/srv-XXXXX/logs
- Monitor for startup errors
- Check CORS configuration logs

### Netlify Logs
- Deploy logs: https://app.netlify.com/sites/findwithyummy/deploys
- Function logs: https://app.netlify.com/sites/findwithyummy/functions
- Check for build errors

---

## 🐛 Troubleshooting

### If Backend Won't Start

1. Check Render logs for errors
2. Verify `gunicorn.conf.py` exists in `dashboard/backend/`
3. Ensure all environment variables are set
4. Try manual deploy: **"Manual Deploy"** > **"Clear build cache & deploy"**

### If Frontend Build Fails

1. Check Netlify deploy logs
2. Verify `Publish directory` is set to `.next`
3. Ensure all `NEXT_PUBLIC_*` variables are set
4. Try: **"Deploys"** > **"Clear cache and retry deploy"**

### If CORS Errors Occur

1. The code now hard-codes your domains, so CORS should work
2. Verify backend logs show: `✅ Production mode: CORS restricted to ['https://findwithyummy.netlify.app', ...]`
3. Make sure you set `ENVIRONMENT=production` in Render
4. Redeploy backend after any changes

---

## 📋 Quick Checklist

**Before Deploying:**
- [ ] Pushed latest code to GitHub
- [ ] Have all API keys ready
- [ ] Generated JWT secret

**Render Setup:**
- [ ] Root directory: `dashboard/backend`
- [ ] Build command updated
- [ ] Start command: `gunicorn -c gunicorn.conf.py main:app`
- [ ] All 11 environment variables added
- [ ] ENVIRONMENT=production
- [ ] FRONTEND_URL=https://findwithyummy.netlify.app

**Netlify Setup:**
- [ ] Publish directory: `.next`
- [ ] All 5 environment variables added
- [ ] NEXT_PUBLIC_API_URL=https://yummy-wehd.onrender.com

**After Deploying:**
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] No CORS errors in console
- [ ] Image upload works
- [ ] API calls succeed

---

## 🎉 You're All Set!

Your configuration is now complete and CORS is enabled for your specific domains!

After you push to GitHub and trigger deployments:
1. Wait ~5 minutes for Render backend
2. Wait ~3 minutes for Netlify frontend
3. Test at: https://findwithyummy.netlify.app

Good luck! 🚀

