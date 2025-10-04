# Reservations Feature - Complete Setup & Testing Guide

## Architecture Overview

The reservations feature uses a **backend-first architecture**:
- **Backend (Python/FastAPI)**: Handles all sensitive operations (Twilio SMS, JWT tokens, database)
- **Frontend (Next.js)**: UI only, calls backend API endpoints
- **Database (Supabase/Postgres)**: Stores reservation data

---

## 1. Database Setup (SQL Migration)

Run this SQL in your Supabase SQL Editor:

```sql
-- Located at: dashboard/frontend/prisma/migrations/20250104_add_reservations_feature/migration.sql
```

This creates:
- `reservations` table
- `reservation_invites` table  
- `calendar_events` table
- `outbound_messages` table
- `used_jtis` table (for token idempotency)
- Required enums: `ReservationStatus`, `RsvpStatus`

---

## 2. Backend Setup

### Install Dependencies

```bash
cd dashboard/backend
pip install -r requirements.txt
```

New packages installed:
- `twilio==9.3.7` - SMS messaging
- `ics==0.7.2` - Calendar file generation
- `python-dateutil==2.9.0` - Date/time utilities

### Configure Environment Variables

Copy `.env.example` and fill in:

```bash
cp .env.example .env
```

Required variables:

```bash
# Twilio (get from https://console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# OR use direct number: TWILIO_FROM=+1234567890

# App configuration
APP_BASE_URL=https://your-domain.com  # or http://localhost:3000 for dev
JWT_SECRET=generate_random_32_char_secret_here

# Existing Supabase vars (should already be set)
SUPABASE_URL=...
SUPABASE_KEY=...
```

### Start Backend Server

```bash
cd dashboard/backend
python main.py
```

Server runs on: `http://localhost:8000`

API docs available at: `http://localhost:8000/docs`

---

## 3. Frontend Setup

### Configure Environment

```bash
cd dashboard/frontend
cp .env.local.example .env.local
```

Set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_RESERVATIONS_ENABLED=true
```

### Install Dependencies

```bash
npm install
```

Note: We've removed server-side packages (Prisma, Twilio, etc.) from frontend.

### Start Frontend

```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 4. Twilio Configuration

### Setup Webhook URLs

In Twilio Console → Messaging → Services → Your Service:

1. **Inbound Messages Webhook**:
   ```
   https://your-domain.com/api/twilio/inbound
   Method: POST
   ```

2. **Status Callback URL** (set per message, already configured in code)

### Test Phone Numbers

For development, add test phone numbers in Twilio Console → Phone Numbers → Verified Caller IDs

---

## 5. End-to-End Testing

### Test 1: Create Reservation

1. **Navigate**: `http://localhost:3000/reservations/new`

2. **Fill form**:
   - Select restaurant
   - Choose date/time (future)
   - Set party size
   - Add invitee phone number(s) in E.164 format: `+1234567890`

3. **Submit** → Should see success message

4. **Verify**:
   - Check backend logs for "✅ Twilio client initialized"
   - Invitees receive SMS with YES/NO options + link
   - Database has new `reservations` row

### Test 2: Confirm via Link (GET/POST Pattern)

1. **Click link** in SMS: `http://localhost:3000/r/confirm?token=...`

2. **Verify**:
   - Page loads (GET - no side effects)
   - Shows "Confirm Reservation" button
   - Click button (POST) → Success message
   - Database: `status='confirmed'`
   - Calendar event created

### Test 3: Confirm via SMS Reply

1. **Reply "YES"** to invitation SMS

2. **Verify**:
   - Backend logs show "Inbound SMS from..."
   - Receive "✅ Confirmed!" reply
   - Database: `rsvp_status='yes'`
   - Reservation auto-confirmed

### Test 4: Decline & Organizer Notification

1. **Reply "NO"** to invitation SMS

2. **Verify**:
   - Receive "Thanks for the heads-up" reply
   - Database: `rsvp_status='no'`
   - Organizer receives cancel prompt (if phone configured)

### Test 5: Cancel Reservation

1. **Open cancel link** (from SMS or generate server-side)

2. **Click "Cancel Reservation"**

3. **Verify**:
   - Database: `status='canceled'`
   - All invitees notified via SMS

### Test 6: Download Calendar Event

1. **Navigate**: `http://localhost:3000/reservations/{id}`

2. **Click "📅 Add to Calendar"**

3. **Verify**:
   - `.ics` file downloads
   - Opens in calendar app
   - Event details correct

---

## 6. API Endpoints Reference

All endpoints require backend to be running on `http://localhost:8000`

### Reservation Management

```
POST   /api/reservations/send
Body: { organizer_id, restaurant_id, starts_at_iso, party_size, invitees[] }
Returns: { ok, reservation_id, invites_sent }

POST   /api/reservations/confirm
Body: { token }
Returns: { ok }

POST   /api/reservations/owner-cancel
Body: { token }
Returns: { ok }

GET    /api/reservations/{id}
Returns: { id, status, invites[], ... }

GET    /api/reservations/{id}/ics
Returns: .ics calendar file
```

### Twilio Webhooks

```
POST   /api/twilio/inbound
Headers: X-Twilio-Signature
Form: From, Body
Returns: TwiML response

POST   /api/twilio/status
Headers: X-Twilio-Signature
Form: MessageSid, MessageStatus
Returns: { ok }
```

---

## 7. Security Checklist

✅ All sensitive env vars in backend only  
✅ JWT tokens signed & verified server-side  
✅ Single-use tokens (JTI stored in `used_jtis`)  
✅ Twilio signature validation on webhooks  
✅ No GET side-effects (confirm/cancel require POST)  
✅ Phone numbers validated (E.164 format)  
✅ Times stored in UTC, displayed in ET  
✅ STOP/HELP replies handled  

---

## 8. Feature Flag

To disable the feature without removing code:

Frontend:
```bash
NEXT_PUBLIC_RESERVATIONS_ENABLED=false
```

All UI entry points check this flag.

---

## 9. Troubleshooting

### SMS not sending

- Check Twilio console logs
- Verify `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM`
- Check phone number format (must be E.164)
- Verify backend logs for errors

### Token expired errors

- Tokens expire in 15 minutes
- Generate new link from backend
- Check system time sync

### Webhook signature invalid

- Verify `APP_BASE_URL` matches your domain
- Use HTTPS in production
- Check Twilio webhook URL config

### Database connection issues

- Verify `SUPABASE_URL` and `SUPABASE_KEY`
- Check migration ran successfully
- Confirm tables exist: `\dt` in psql

---

## 10. Production Deployment

1. **Run SQL migration** in production database
2. **Set production env vars** in backend
3. **Update Twilio webhooks** to production URLs
4. **Set `APP_BASE_URL`** to production domain
5. **Enable CORS** for your frontend domain in `main.py`
6. **Test with real phone numbers**

---

## Files Changed/Created

### Backend (Python)
- ✅ `services/twilio_service.py` - New
- ✅ `services/token_service.py` - New
- ✅ `services/sms_templates.py` - New
- ✅ `routers/reservations.py` - New
- ✅ `routers/twilio_webhooks.py` - New
- ✅ `main.py` - Updated (added routers)
- ✅ `requirements.txt` - Updated

### Frontend (Next.js)
- ✅ `lib/api-config.ts` - New (API client)
- ✅ `app/reservations/new/page.tsx` - New
- ✅ `app/reservations/[id]/page.tsx` - New
- ✅ `app/r/confirm/page.tsx` - New
- ✅ `app/r/cancel/page.tsx` - New
- ✅ `package.json` - Updated (removed server deps)
- ✅ Removed old Next.js API routes (7 files)
- ✅ Removed server-side libs (6 files)

### Database
- ✅ `prisma/migrations/20250104_add_reservations_feature/migration.sql` - New

---

## Support

For issues:
1. Check backend logs: `tail -f dashboard/backend/logs/*.log`
2. Check Twilio console for SMS delivery
3. Verify database records in Supabase dashboard
4. Test API endpoints directly: `http://localhost:8000/docs`

