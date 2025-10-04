# iMessage Reservations - Setup Guide

## 🎯 Overview

The reservation system now uses **iMessage deep links** instead of Twilio SMS. When you create a reservation, the app generates invitation links that you manually send via iMessage to your friends.

---

## 🔄 How It Works

### **1. Create Reservation**
1. User clicks "Send Reservation" on a friend's profile (or "New Reservation" from calendar)
2. **Step 1 (Intro)**: Shows friend's profile picture and invitation preview
3. **Step 2 (Form)**: Fill out restaurant, date/time, party size, invitees
4. **Step 3 (Invite Sheet)**: Shows iMessage prompts for each invitee

### **2. Send Invitations** 
1. Organizer sees an **Invite Sheet** with:
   - Each friend's phone number
   - Pre-written invitation message
   - "Open iMessage" button (platform-specific deep link)
   - Copy/Share buttons
2. Organizer clicks "Open iMessage" for each friend
3. iMessage opens with pre-filled message
4. Organizer sends the message

### **3. Friend Accepts**
1. Friend receives iMessage with invitation link
2. Taps link → Opens Yummy app
3. If not logged in → Redirects to login → Returns to invitation
4. Sees reservation details (restaurant, date/time, party size)
5. Clicks "Accept Invitation"
6. System:
   - Links their profile to the invite
   - Sets RSVP status to "yes"
   - Creates a calendar event for them
   - Auto-confirms reservation if everyone accepted

### **4. Organizer Views Status**
1. Go to Reservations page
2. See all reservations with invite statuses:
   - ✅ **Accepted** (green)
   - ⏳ **Pending** (yellow)
   - ❌ **Declined** (red)
3. Download calendar file when confirmed

---

## 📦 What Was Built

### **Backend (Python/FastAPI)**

#### New Files:
- `routers/invites.py` - Accept/decline API routes
- `services/voice_call_service.py` - Auto-call restaurant (future feature)
- `routers/voice.py` - Voice call endpoints (future feature)

#### Updated Files:
- `routers/reservations.py` - Returns iMessage links instead of sending SMS
- `services/token_service.py` - Supports invite tokens
- `main.py` - Registered invites router

### **Frontend (Next.js/React)**

#### New Files:
- `lib/tokens.ts` - Token utilities (decode, check expiry)
- `lib/imessage.ts` - iMessage deep link helpers
- `lib/time.ts` - Time formatting utilities
- `components/invite-row.tsx` - Single invite UI with copy/open buttons
- `components/invite-sheet.tsx` - All invites with bulk actions
- `components/ui/calendar.tsx` - Calendar component for reservations page
- `components/ui/label.tsx` - Form label component
- `app/r/invite/page.tsx` - Invitation landing page
- `app/(dashboard)/reservations/page.tsx` - Calendar view of all reservations

#### Updated Files:
- `components/reservation-modal.tsx` - Multi-step modal (intro → form → invite sheet)
- `components/send-reservation-card.tsx` - Opens modal instead of page navigation
- `app/(dashboard)/profile/[id]/page.tsx` - Uses modal, shows followers count
- `components/aegis-sidebar.tsx` - Added Reservations nav, removed Settings, fixed logout button

### **Database**

#### Migration:
- `prisma/migrations/20250104_imessage_multi_calendar/migration.sql`
  - Drops unique constraint on `calendar_events.reservationId`
  - Adds composite unique `(reservationId, userId)`
  - Allows multiple calendar events per reservation (one per accepted invitee)

#### Schema Updates:
- `CalendarEvent`: Changed from one-to-one to one-to-many with Reservation
- Added indexes for performance

---

## 🚀 Setup Steps

### **1. Run Database Migration**

Execute in Supabase SQL Editor:

```sql
-- File: dashboard/frontend/prisma/migrations/20250104_imessage_multi_calendar/migration.sql
```

### **2. Install Frontend Dependencies**

```bash
cd dashboard/frontend
npm install @radix-ui/react-label react-day-picker
```

### **3. Configure Environment Variables**

Backend `.env`:
```bash
APP_BASE_URL=http://localhost:3000
JWT_SECRET=your-random-32-character-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
```

**Note:** No Twilio variables needed!

### **4. Restart Backend**

```bash
cd dashboard/backend
python main.py
```

### **5. Test the Flow**

1. Go to friend's profile
2. Click "Send Reservation" button (message icon)
3. Fill out the form
4. See invite sheet with iMessage links
5. Click "Open iMessage" for each friend
6. Send the message
7. Friend clicks link → Accepts → Calendar event created

---

## 📱 Platform Support

### **macOS**
- Uses `messages://` protocol
- Opens Messages app with pre-filled text ✅
- Works in Safari, Chrome, Firefox

### **iOS**
- Uses `sms:` protocol
- Opens Messages app
- ⚠️ iOS may ignore `body=` parameter (user must copy text manually)
- Always show copyable text as fallback

### **Android/Windows**
- `sms:` protocol opens default messaging app
- May not support body parameter
- Copy button provided as fallback

---

## 🔐 Security Features

### **Token-Based Authentication**
- ✅ JWT tokens with expiration (1 hour for invites)
- ✅ Single-use enforcement via `used_jtis` table
- ✅ Action-specific tokens (invite_accept, invite_decline, owner_cancel)

### **Authorization**
- ✅ Only invitee can accept their own invitation
- ✅ Profile ID linked on first acceptance
- ✅ Prevents duplicate calendar events (composite unique)

### **Idempotency**
- ✅ Accepting same token twice returns success (no error)
- ✅ JTI tracking prevents replay attacks

---

## 🎨 UI/UX Highlights

### **Multi-Step Modal**
- Step 1: Intro with friend's profile picture
- Step 2: Reservation form
- Step 3: Invite sheet with iMessage prompts
- Smooth transitions with Framer Motion
- Single modal (no modal-on-modal)

### **Liquid Glass Aesthetic**
- White backgrounds with glass-layer-1
- Specular highlights
- Soft shadows
- Black text for readability

### **Smart Invite Sheet**
- Individual "Open iMessage" buttons
- Copy/Share buttons per invite
- "Open All" bulk action (tries to open all sequentially)
- "Copy All" bulk action
- Platform detection for optimal deep links

---

## ⚡ Future Enhancements

### **Auto-Call Restaurant** (Already Built!)
When all invites are accepted, automatically call the restaurant using Twilio Programmable Voice:

```python
# Already implemented in:
# - services/voice_call_service.py
# - routers/voice.py
# - routers/twilio_webhooks.py (lines 113-162)
```

To enable: Set `TWILIO_FROM` in `.env` and add restaurant phone numbers to database.

---

## 🐛 Troubleshooting

### **iMessage doesn't open**
- Check browser console for deep link errors
- Use Copy button as fallback
- Some browsers block `messages://` protocol

### **"Invalid token" error**
- Token expired (1 hour TTL)
- Token already used
- Organizer should resend invitation

### **Calendar event not created**
- Check user is logged in when accepting
- Verify JWT_SECRET is set
- Check backend logs for errors

### **Followers/Following not updating**
- ✅ Fixed! Now queries database for accurate counts
- Updates in real-time when follow/unfollow

---

## 📊 Database Schema

```
reservations (1) ←→ (many) reservation_invites
reservations (1) ←→ (many) calendar_events

Composite Unique: (reservationId, userId) in calendar_events
- Organizer gets 1 calendar event
- Each accepted invitee gets 1 calendar event
```

---

## ✅ What's Different from Twilio Version

| Feature | Twilio (Old) | iMessage (New) |
|---------|-------------|----------------|
| **Sending** | Automatic SMS | Manual iMessage prompts |
| **Cost** | $$$ per SMS | Free (uses Apple Messages) |
| **Delivery** | Guaranteed | User must manually send |
| **Setup** | Complex (phone number, verification) | Simple (just JWT secret) |
| **International** | Works worldwide | Works on Apple devices |
| **User Control** | Automated | User reviews before sending |

---

## 🎉 Ready to Test!

1. Run the migration
2. Restart backend
3. Create a reservation
4. Use the invite sheet to send messages
5. Friend clicks link and accepts
6. View updated status in reservations page

No Twilio configuration needed! 🚀

