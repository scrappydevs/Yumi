# ⚡ Deployment Quick Reference

## 🔥 Backend (Render)

### Build Command
```bash
cd dashboard/backend && pip install --upgrade pip && pip install -r requirements.txt && pip install gunicorn
```

### Start Command
```bash
cd dashboard/backend && gunicorn -c gunicorn.conf.py main:app
```

### Directory
- **Root**: `/Users/vini/yummy/Yummy`
- **Backend**: `dashboard/backend`

### Health Check Path
```
/health
```

### Required Environment Variables
```bash
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_MAPS_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
JWT_SECRET=
ENVIRONMENT=production
FRONTEND_URL=https://your-app.netlify.app
PORT=8000
```

---

## 🌐 Frontend (Netlify)

### Build Command
```bash
npm run build
```

### Publish Directory
```
.next
```

### Base Directory
```
dashboard/frontend
```

### Node Version
```
20
```

### Required Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 📝 Test Endpoints

### Backend
- Root: `https://your-backend.onrender.com/`
- Health: `https://your-backend.onrender.com/health`
- Docs: `https://your-backend.onrender.com/docs`

### Frontend
- Home: `https://your-app.netlify.app/`

---

## 🔧 Common Commands

### Generate JWT Secret
```bash
openssl rand -base64 32
```

### Test Backend Locally
```bash
cd dashboard/backend
python main.py
```

### Test Frontend Locally
```bash
cd dashboard/frontend
npm run dev
```

### Build Frontend Locally
```bash
cd dashboard/frontend
npm run build
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Update `FRONTEND_URL` in Render to match Netlify domain |
| Backend won't start | Check all env vars are set in Render |
| Frontend build fails | Verify all `NEXT_PUBLIC_*` vars in Netlify |
| Database errors | Check Supabase keys and RLS policies |
| API calls fail | Verify `NEXT_PUBLIC_API_URL` matches Render URL |

---

## 📦 Files Created

- `/render.yaml` - Render configuration
- `/dashboard/frontend/netlify.toml` - Netlify configuration  
- `/dashboard/backend/gunicorn.conf.py` - Gunicorn production config
- `/DEPLOYMENT_GUIDE.md` - Full deployment guide
- `/DEPLOYMENT_QUICK_REFERENCE.md` - This file

---

## ✅ Deployment Checklist

**Before Deploying:**
- [ ] Push all code to GitHub
- [ ] Get all API keys ready
- [ ] Generate JWT secret

**Render Setup:**
- [ ] Create web service
- [ ] Connect GitHub repo
- [ ] Set all environment variables
- [ ] Deploy and verify health check

**Netlify Setup:**
- [ ] Create new site
- [ ] Connect GitHub repo
- [ ] Set all environment variables
- [ ] Deploy and test

**After Deploying:**
- [ ] Update `FRONTEND_URL` in Render
- [ ] Test all features
- [ ] Restrict API keys by domain
- [ ] Enable database RLS

---

## 🎯 URLs to Update

After deployment, you'll need these URLs:

1. **Netlify URL** (frontend): Update in Render's `FRONTEND_URL`
2. **Render URL** (backend): Update in Netlify's `NEXT_PUBLIC_API_URL`

Example:
- Frontend: `https://yummy-foodapp.netlify.app`
- Backend: `https://yummy-backend.onrender.com`

