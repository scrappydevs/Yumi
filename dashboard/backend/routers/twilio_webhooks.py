"""
Twilio webhook handlers for inbound SMS and status callbacks
"""
from fastapi import APIRouter, HTTPException, Request, Form
from fastapi.responses import Response
import os
from datetime import datetime, timedelta, timezone

from supabase_client import get_supabase
from services.twilio_service import TwilioService
from services.token_service import sign_action_token
from services.sms_templates import (
    confirmed_reply,
    declined_reply,
    canceled_reply,
    help_reply,
    not_found_reply,
    organizer_cancel_prompt
)

router = APIRouter(prefix="/twilio", tags=["twilio"])


def twiml_response(message: str) -> Response:
    """Generate TwiML XML response"""
    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{message}</Message></Response>'
    return Response(content=twiml, media_type="text/xml")


@router.post("/inbound")
async def inbound_sms(request: Request, From: str = Form(...), Body: str = Form(...)):
    """
    Handle inbound SMS from Twilio
    Validates signature and processes YES/NO/CANCEL responses
    """
    try:
        app_base_url = os.getenv("APP_BASE_URL")
        if not app_base_url:
            return twiml_response(help_reply())
        
        # Get signature for validation
        signature = request.headers.get("x-twilio-signature", "")
        
        # Parse form data for signature validation
        form_data = await request.form()
        params = dict(form_data)
        
        # Validate Twilio signature
        full_url = f"{app_base_url}/api/twilio/inbound"
        is_valid = TwilioService.validate_signature(signature, full_url, params)
        
        if not is_valid:
            print("Invalid Twilio signature")
            return Response(content="Forbidden", status_code=403)
        
        # Normalize phone and body
        phone_e164 = From if From.startswith('+') else f'+{From}'
        body_upper = Body.strip().upper()
        
        print(f"Inbound SMS from {phone_e164}: {body_upper}")
        
        # Handle HELP
        if body_upper == "HELP":
            return twiml_response(help_reply())
        
        supabase = get_supabase()
        now = datetime.now(timezone.utc).isoformat()
        
        # Find most recent pending invite for an active reservation
        invite_result = supabase.table("reservation_invites") \
            .select("*, reservations(*)") \
            .eq("inviteePhoneE164", phone_e164) \
            .eq("rsvpStatus", "pending") \
            .order("createdAt", desc=True) \
            .limit(1) \
            .execute()
        
        # Filter for reservations that haven't started yet
        if invite_result.data:
            resv = invite_result.data[0]["reservations"]
            starts_at = datetime.fromisoformat(resv["startsAt"].replace('Z', '+00:00'))
            if starts_at < datetime.now(timezone.utc):
                # Reservation has already passed
                invite_result.data = []
        
        if not invite_result.data:
            return twiml_response(not_found_reply())
        
        invite = invite_result.data[0]
        reservation = invite["reservations"]
        
        # Handle YES
        if body_upper in ["YES", "Y", "CONFIRM"]:
            # Update invite
            supabase.table("reservation_invites").update({
                "rsvpStatus": "yes",
                "respondedAt": now
            }).eq("id", invite["id"]).execute()
            
            # Check if we should confirm the reservation
            all_invites = supabase.table("reservation_invites") \
                .select("rsvpStatus") \
                .eq("reservationId", reservation["id"]) \
                .execute()
            
            has_yes = any(inv["rsvpStatus"] == "yes" for inv in all_invites.data)
            
            if has_yes and reservation["status"] == "pending":
                # Confirm reservation
                supabase.table("reservations").update({"status": "confirmed"}).eq("id", reservation["id"]).execute()
                
                # Calendar event will be generated on-demand
                pass
            
            return twiml_response(confirmed_reply())
        
        # Handle NO
        if body_upper in ["NO", "N", "DECLINE", "CANT"]:
            # Update invite
            supabase.table("reservation_invites").update({
                "rsvpStatus": "no",
                "respondedAt": now
            }).eq("id", invite["id"]).execute()
            
            # Generate cancel token for organizer
            try:
                cancel_token = sign_action_token(
                    reservation["id"],
                    reservation["organizer_id"],
                    "owner_cancel",
                    900  # 15 minutes
                )
                
                cancel_url = f"{app_base_url}/r/cancel?token={cancel_token}"
                
                # TODO: Send to organizer when we have their phone
                # For now just log it
                cancel_message = organizer_cancel_prompt(phone_e164, cancel_url)
                print(f"Would send to organizer: {cancel_message}")
                
            except Exception as e:
                print(f"Error notifying organizer: {e}")
            
            return twiml_response(declined_reply())
        
        # Handle CANCEL (from organizer)
        if body_upper == "CANCEL":
            # Allow cancel if reservation is not already canceled/expired
            if reservation["status"] not in ["canceled", "expired"]:
                supabase.table("reservations").update({"status": "canceled"}).eq("id", reservation["id"]).execute()
                return twiml_response(canceled_reply())
        
        # Default: help message
        return twiml_response(help_reply())
    
    except Exception as e:
        print(f"Error processing inbound SMS: {e}")
        return twiml_response(help_reply())


@router.post("/status")
async def status_callback(request: Request, MessageSid: str = Form(None), SmsSid: str = Form(None), 
                          MessageStatus: str = Form(None), SmsStatus: str = Form(None)):
    """
    Handle Twilio message status callbacks (logging only - no database storage)
    """
    try:
        app_base_url = os.getenv("APP_BASE_URL")
        if not app_base_url:
            return {"ok": False, "error": "APP_BASE_URL not configured"}
        
        # Get signature for validation
        signature = request.headers.get("x-twilio-signature", "")
        
        # Parse form data
        form_data = await request.form()
        params = dict(form_data)
        
        # Validate signature
        full_url = f"{app_base_url}/api/twilio/status"
        is_valid = TwilioService.validate_signature(signature, full_url, params)
        
        if not is_valid:
            print("Invalid Twilio signature on status callback")
            return Response(content="Forbidden", status_code=403)
        
        # Extract status info
        message_sid = MessageSid or SmsSid or ""
        message_status = MessageStatus or SmsStatus or "unknown"
        
        # Just log it (no database storage)
        print(f"✅ SMS Status: {message_sid} -> {message_status}")
        
        return {"ok": True}
    
    except Exception as e:
        print(f"Error processing status callback: {e}")
        return {"ok": False, "error": str(e)}

