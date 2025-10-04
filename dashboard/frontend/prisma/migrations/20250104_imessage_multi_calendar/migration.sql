-- ============================================================================
-- Migration: Update CalendarEvent to support multiple events per reservation
-- Date: 2025-01-04
-- ============================================================================
-- This migration allows one calendar event per user per reservation
-- (organizer + each accepted invitee can have their own calendar event)

BEGIN;

-- Step 1: Drop the old unique constraint on reservationId
ALTER TABLE calendar_events 
DROP CONSTRAINT IF EXISTS calendar_events_reservationId_key;

-- Step 2: Add composite unique constraint (reservationId, userId)
-- This allows multiple calendar events per reservation (one per user)
ALTER TABLE calendar_events 
ADD CONSTRAINT calendar_events_reservationId_userId_key 
UNIQUE (reservationId, userId);

-- Step 3: Add index on userId for faster lookups
CREATE INDEX IF NOT EXISTS calendar_events_userId_idx 
ON calendar_events(userId);

-- Step 4: Add index on inviteeProfileId for faster joins
CREATE INDEX IF NOT EXISTS reservation_invites_inviteeProfileId_idx 
ON reservation_invites(inviteeProfileId);

COMMIT;

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. This migration is NON-DESTRUCTIVE - no data is lost
-- 2. Existing calendar events remain intact
-- 3. Now supports: organizer + multiple invitees each having their own calendar event
-- 4. The composite unique ensures no duplicate events per user per reservation

