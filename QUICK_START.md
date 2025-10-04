# Quick Start - Reservations Feature

## What Changed

✅ **Backend-first architecture**: All sensitive operations (SMS, tokens) now in Python backend  
✅ **Removed Next.js API routes**: 7 API route files deleted  
✅ **Removed frontend server dependencies**: Cleaned up package.json  
✅ **UI updates**: Removed "Yummy" header from profile/friends, added to Discover page  
✅ **Removed Messages tab** from sidebar navigation  

---

## Run the App

### 1. Start Backend (Terminal 1)
```bash
cd dashboard/backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### 2. Start Frontend (Terminal 2)  
```bash
cd dashboard/frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### 3. Configure Environment (You'll do this)

**Backend**: `dashboard/backend/.env`
```bash
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_MESSAGING_SERVICE_SID=MGxxx...
APP_BASE_URL=http://localhost:3000
JWT_SECRET=your-32-char-secret
```

**Frontend**: `dashboard/frontend/.env.local`
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_RESERVATIONS_ENABLED=true
```

### 4. Run SQL Migration (You'll do this)

Execute the SQL file in Supabase:
```
dashboard/frontend/prisma/migrations/20250104_add_reservations_feature/migration.sql
```

---

## Test the Feature

1. **Create Reservation**: http://localhost:3000/reservations/new
2. **Invitee gets SMS** with YES/NO + link
3. **Confirm via link** or SMS reply
4. **View reservation**: http://localhost:3000/reservations/{id}
5. **Download calendar** file

---

## Architecture

```
┌─────────────┐      API Calls       ┌─────────────┐
│   Frontend  │ ──────────────────> │   Backend   │
│   Next.js   │   (HTTP/JSON)       │  FastAPI    │
│  Port 3000  │ <────────────────── │  Port 8000  │
└─────────────┘                      └─────────────┘
                                            │
                                            ├──> Twilio (SMS)
                                            ├──> JWT Tokens
                                            └──> Supabase DB
```

**Frontend**: UI only, no secrets  
**Backend**: All business logic, SMS, auth  
**Database**: Supabase Postgres (via backend)

---

## API Endpoints

Base URL: `http://localhost:8000`

- `POST /api/reservations/send` - Create & send invites
- `POST /api/reservations/confirm` - Confirm reservation  
- `POST /api/reservations/owner-cancel` - Cancel reservation
- `GET /api/reservations/{id}` - Get details
- `GET /api/reservations/{id}/ics` - Download calendar
- `POST /api/twilio/inbound` - Handle SMS replies
- `POST /api/twilio/status` - Track delivery

Docs: http://localhost:8000/docs

---

## Troubleshooting

**Backend won't start**:
- Install deps: `pip install -r requirements.txt`
- Check Python version: `python --version` (need 3.8+)

**Frontend errors**:
- Install deps: `npm install`
- Check backend is running: `curl http://localhost:8000/health`

**SMS not sending**:
- Verify Twilio credentials in backend `.env`
- Check phone format: must be E.164 (`+1234567890`)

**"Table doesn't exist"**:
- Run SQL migration in Supabase dashboard

---

## What's Next

✅ You set up SQL migration  
✅ You configure environment variables  
✅ Test end-to-end flow  
✅ Configure Twilio webhooks (production only)

See **RESERVATIONS_SETUP.md** for detailed guide.

