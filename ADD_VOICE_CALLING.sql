-- ============================================================================
-- Add Voice Calling Support for Auto-Reservation
-- ============================================================================
-- Run this in your Supabase SQL Editor to enable automatic restaurant calling

-- 1. Add phone field to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

COMMENT ON COLUMN restaurants.phone IS 'Restaurant phone number in E.164 format (e.g., +14155551234) for automated calls';

-- 2. Add callSid field to reservations table to track voice calls
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS "callSid" VARCHAR(100);

COMMENT ON COLUMN reservations."callSid" IS 'Twilio Call SID for the automated restaurant booking call';

-- 3. Add call status field
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS call_status VARCHAR(50);

COMMENT ON COLUMN reservations.call_status IS 'Status of the automated call (initiated, ringing, answered, completed, failed)';

-- ============================================================================
-- Sample Data: Add phone numbers to existing restaurants
-- ============================================================================
-- You'll need to manually add real restaurant phone numbers
-- These are just examples:

-- UPDATE restaurants 
-- SET phone = '+14157551234' 
-- WHERE name = 'Nobu Downtown';

-- UPDATE restaurants 
-- SET phone = '+14155551234' 
-- WHERE name = 'Le Bernardin';

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. Phone numbers MUST be in E.164 format: +[country code][number]
-- 2. Example US number: +14155551234 (not +1-415-555-1234)
-- 3. Twilio needs a verified phone number (TWILIO_FROM) to make calls
-- 4. Calls will only trigger when ALL invites say "YES"

