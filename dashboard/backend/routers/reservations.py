"""
Reservations router for managing restaurant reservations via SMS
"""
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal
from datetime import datetime, timedelta, timezone
import os
from urllib.parse import parse_qs

from supabase_client import get_supabase
from services.twilio_service import TwilioService
from services.token_service import sign_action_token, verify_action_token
from services.sms_templates import (
    reservation_hold,
    organizer_cancel_prompt,
    confirmed_reply,
    canceled_reply,
    declined_reply,
    help_reply,
    not_found_reply,
    expired_reply
)

router = APIRouter(prefix="/reservations", tags=["reservations"])

# ============================================================================
# Request/Response Models
# ============================================================================

class InviteeInput(BaseModel):
    phone_e164: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$')
    profile_id: Optional[str] = None


class SendReservationRequest(BaseModel):
    organizer_id: str
    restaurant_id: str
    starts_at_iso: str
    party_size: int = Field(..., ge=1, le=50)
    invitees: List[InviteeInput] = Field(..., min_items=1)


class SendReservationResponse(BaseModel):
    ok: bool
    reservation_id: str
    invites_sent: int


class ConfirmReservationRequest(BaseModel):
    token: str


class CancelReservationRequest(BaseModel):
    token: str


# ============================================================================
# Helper Functions
# ============================================================================

def format_time_for_sms(dt: datetime) -> str:
    """Format datetime for SMS display in ET timezone"""
    # Convert to ET (simplified - in production use pytz)
    return dt.strftime('%a, %b %d, %I:%M %p ET')


# ============================================================================
# API Routes
# ============================================================================

@router.post("/send", response_model=SendReservationResponse)
async def send_reservation(request: SendReservationRequest):
    """
    Create a reservation and send SMS invitations
    """
    try:
        supabase = get_supabase()
        app_base_url = os.getenv("APP_BASE_URL")
        
        if not app_base_url:
            raise HTTPException(status_code=500, detail="APP_BASE_URL not configured")
        
        # Validate organizer exists
        organizer_result = supabase.table("profiles").select("id").eq("id", request.organizer_id).limit(1).execute()
        if not organizer_result.data:
            raise HTTPException(status_code=404, detail="Organizer not found")
        
        # Validate restaurant exists
        print(f"🔍 Looking for restaurant with ID: {request.restaurant_id}")
        restaurant_result = supabase.table("restaurants").select("id, name").eq("id", request.restaurant_id).execute()
        print(f"🔍 Restaurant query returned: {len(restaurant_result.data) if restaurant_result.data else 0} results")
        
        if not restaurant_result.data or len(restaurant_result.data) == 0:
            # Let's check if ANY restaurants exist
            all_restaurants = supabase.table("restaurants").select("id, name").limit(5).execute()
            print(f"⚠️ Restaurant {request.restaurant_id} not found!")
            print(f"📋 Available restaurants (first 5): {all_restaurants.data}")
            raise HTTPException(status_code=404, detail=f"Restaurant not found: {request.restaurant_id}")
        
        restaurant_name = restaurant_result.data[0]["name"]
        print(f"✅ Found restaurant: {restaurant_name}")
        
        # Parse datetime
        starts_at = datetime.fromisoformat(request.starts_at_iso.replace('Z', '+00:00'))
        
        # Validate future time
        if starts_at <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Reservation time must be in the future")
        
        # Create reservation (use camelCase to match database schema)
        reservation_data = {
            "organizerId": request.organizer_id,
            "restaurantId": request.restaurant_id,
            "startsAt": starts_at.isoformat(),
            "partySize": request.party_size,
            "status": "pending",
        }
        
        print(f"Creating reservation with data: {reservation_data}")
        
        try:
            reservation_result = supabase.table("reservations").insert(reservation_data).execute()
        except Exception as insert_error:
            print(f"Error inserting reservation: {insert_error}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(insert_error)}")
        
        if not reservation_result.data:
            raise HTTPException(status_code=500, detail="Failed to create reservation")
        
        reservation_id = reservation_result.data[0]["id"]
        
        # Create invites (use camelCase to match database schema)
        invites_data = []
        for invitee in request.invitees:
            invites_data.append({
                "reservationId": reservation_id,
                "inviteeProfileId": invitee.profile_id,
                "inviteePhoneE164": invitee.phone_e164,
                "rsvpStatus": "pending"
            })
        
        supabase.table("reservation_invites").insert(invites_data).execute()
        
        # Send SMS to each invitee
        # Only use status callback if not localhost (Twilio can't reach localhost)
        status_callback_url = None
        if "localhost" not in app_base_url and "127.0.0.1" not in app_base_url:
            status_callback_url = f"{app_base_url}/api/twilio/status"
        
        time_str = format_time_for_sms(starts_at)
        sent_count = 0
        
        for invitee in request.invitees:
            try:
                # Generate confirm token (15 min expiry)
                token = sign_action_token(reservation_id, request.organizer_id, "confirm", 900)
                confirm_url = f"{app_base_url}/r/confirm?token={token}"
                
                message_body = reservation_hold(restaurant_name, time_str, confirm_url)
                
                result = TwilioService.send_sms(
                    to=invitee.phone_e164,
                    body=message_body,
                    status_callback=status_callback_url
                )
                
                sent_count += 1
            except Exception as e:
                print(f"Failed to send SMS to {invitee.phone_e164}: {e}")
        
        return SendReservationResponse(
            ok=True,
            reservation_id=reservation_id,
            invites_sent=sent_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating reservation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/confirm")
async def confirm_reservation(request: ConfirmReservationRequest):
    """
    Confirm a reservation using a token
    """
    try:
        # Verify token
        try:
            payload = verify_action_token(request.token)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))
        
        resv_id = payload["resvId"]
        user_id = payload["userId"]
        jti = payload["jti"]
        action = payload["action"]
        
        if action != "confirm":
            raise HTTPException(status_code=400, detail="Invalid action for this endpoint")
        
        supabase = get_supabase()
        
        # Check idempotency
        existing_jti = supabase.table("used_jtis").select("jti").eq("jti", jti).limit(1).execute()
        if existing_jti.data:
            return {"ok": True, "idempotent": True, "message": "Already confirmed"}
        
        # Load reservation
        reservation = supabase.table("reservations").select("*").eq("id", resv_id).limit(1).execute()
        if not reservation.data:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        resv = reservation.data[0]
        
        # Check status
        if resv["status"] != "pending":
            raise HTTPException(status_code=400, detail=f"Reservation is already {resv['status']}")
        
        # Check if reservation time has passed
        starts_at = datetime.fromisoformat(resv["startsAt"].replace('Z', '+00:00'))
        if starts_at < datetime.now(timezone.utc):
            # Mark as expired
            supabase.table("reservations").update({"status": "expired"}).eq("id", resv_id).execute()
            raise HTTPException(status_code=400, detail="Reservation has expired")
        
        # Mark as confirmed
        supabase.table("reservations").update({"status": "confirmed"}).eq("id", resv_id).execute()
        
        # Calendar event will be generated on-demand from reservations table
        pass
        # Mark JTI as used
        supabase.table("used_jtis").insert({"jti": jti, "resv_id": resv_id}).execute()
        
        return {"ok": True}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error confirming reservation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/owner-cancel")
async def owner_cancel_reservation(request: CancelReservationRequest):
    """
    Cancel a reservation (organizer only)
    """
    try:
        # Verify token
        try:
            payload = verify_action_token(request.token)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))
        
        resv_id = payload["resvId"]
        user_id = payload["userId"]
        jti = payload["jti"]
        action = payload["action"]
        
        if action != "owner_cancel":
            raise HTTPException(status_code=400, detail="Invalid action for this endpoint")
        
        supabase = get_supabase()
        
        # Check idempotency
        existing_jti = supabase.table("used_jtis").select("jti").eq("jti", jti).limit(1).execute()
        if existing_jti.data:
            return {"ok": True, "idempotent": True, "message": "Already canceled"}
        
        # Load reservation with invites
        reservation = supabase.table("reservations").select("*, reservation_invites(*)").eq("id", resv_id).limit(1).execute()
        if not reservation.data:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        resv = reservation.data[0]
        
        # Check if already canceled
        if resv["status"] == "canceled":
            supabase.table("used_jtis").insert({"jti": jti, "resv_id": resv_id}).execute()
            return {"ok": True, "message": "Already canceled"}
        
        if resv["status"] == "expired":
            raise HTTPException(status_code=400, detail="Reservation has expired")
        
        # Verify user is organizer
        if resv["organizer_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only the organizer can cancel this reservation")
        
        # Cancel the reservation
        supabase.table("reservations").update({"status": "canceled"}).eq("id", resv_id).execute()
        
        # Mark JTI as used
        supabase.table("used_jtis").insert({"jti": jti, "resv_id": resv_id}).execute()
        
        # Notify invitees
        invites = resv.get("reservation_invites", [])
        for invite in invites:
            try:
                TwilioService.send_sms(
                    to=invite["inviteePhoneE164"],
                    body=f"Your reservation has been canceled by the organizer. {canceled_reply()}"
                )
            except Exception as e:
                print(f"Failed to notify {invite['invitee_phone_e164']}: {e}")
        
        return {"ok": True}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error canceling reservation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}")
async def get_user_reservations(user_id: str, status: str = None):
    """
    Get all reservations for a user (as organizer or invitee)
    """
    try:
        supabase = get_supabase()
        
        # Get reservations where user is organizer
        organizer_query = supabase.table("reservations")\
            .select("*, reservation_invites(*)")\
            .eq("organizerId", user_id)\
            .order("startsAt", desc=False)
        
        if status:
            organizer_query = organizer_query.eq("status", status)
        
        organizer_reservations = organizer_query.execute()
        
        # Get reservations where user is invitee
        invitee_reservations_result = supabase.table("reservation_invites")\
            .select("*, reservations(*)")\
            .eq("inviteeProfileId", user_id)\
            .execute()
        
        # Combine and format
        all_reservations = []
        
        # Add organizer reservations
        for resv in organizer_reservations.data:
            restaurant = supabase.table("restaurants").select("name, formatted_address").eq("id", resv["restaurantId"]).limit(1).execute()
            restaurant_name = restaurant.data[0]["name"] if restaurant.data else "Unknown Restaurant"
            restaurant_address = restaurant.data[0].get("formatted_address") if restaurant.data else None
            
            all_reservations.append({
                "id": resv["id"],
                "organizer_id": resv["organizerId"],
                "restaurant_id": resv["restaurantId"],
                "restaurant_name": restaurant_name,
                "restaurant_address": restaurant_address,
                "starts_at": resv["startsAt"],
                "party_size": resv["partySize"],
                "status": resv["status"],
                "created_at": resv["createdAt"],
                "is_organizer": True,
                "invite_count": len(resv.get("reservation_invites", []))
            })
        
        # Add invitee reservations
        for invite in invitee_reservations_result.data:
            resv = invite["reservations"]
            if status and resv["status"] != status:
                continue
                
            restaurant = supabase.table("restaurants").select("name, formatted_address").eq("id", resv["restaurantId"]).limit(1).execute()
            restaurant_name = restaurant.data[0]["name"] if restaurant.data else "Unknown Restaurant"
            restaurant_address = restaurant.data[0].get("formatted_address") if restaurant.data else None
            
            all_reservations.append({
                "id": resv["id"],
                "organizer_id": resv["organizerId"],
                "restaurant_id": resv["restaurantId"],
                "restaurant_name": restaurant_name,
                "restaurant_address": restaurant_address,
                "starts_at": resv["startsAt"],
                "party_size": resv["partySize"],
                "status": resv["status"],
                "created_at": resv["createdAt"],
                "is_organizer": False,
                "rsvp_status": invite["rsvpStatus"]
            })
        
        # Sort by start time
        all_reservations.sort(key=lambda x: x["starts_at"])
        
        return {"reservations": all_reservations}
    
    except Exception as e:
        print(f"Error fetching user reservations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{reservation_id}")
async def get_reservation(reservation_id: str):
    """
    Get reservation details
    """
    try:
        supabase = get_supabase()
        
        # Load reservation with invites
        reservation = supabase.table("reservations").select("*, reservation_invites(*)").eq("id", reservation_id).limit(1).execute()
        if not reservation.data:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        resv = reservation.data[0]
        
        # Get restaurant details
        restaurant = supabase.table("restaurants").select("name, formatted_address").eq("id", resv["restaurantId"]).limit(1).execute()
        restaurant_name = restaurant.data[0]["name"] if restaurant.data else "Unknown Restaurant"
        restaurant_address = restaurant.data[0].get("formatted_address") if restaurant.data else None
        
        return {
            "id": resv["id"],
            "organizer_id": resv["organizerId"],
            "restaurant_id": resv["restaurantId"],
            "restaurant_name": restaurant_name,
            "restaurant_address": restaurant_address,
            "starts_at": resv["startsAt"],
            "party_size": resv["partySize"],
            "status": resv["status"],
            "created_at": resv["createdAt"],
            "invites": resv.get("reservation_invites", []),
            "has_calendar_event": resv["status"] == "confirmed"  # Show calendar if confirmed
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching reservation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{reservation_id}/ics")
async def download_ics(reservation_id: str):
    """
    Download reservation as ICS calendar file (generated on-the-fly)
    """
    try:
        from ics import Calendar, Event as IcsEvent
        
        supabase = get_supabase()
        
        # Load reservation directly
        reservation = supabase.table("reservations").select("*").eq("id", reservation_id).limit(1).execute()
        if not reservation.data:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        resv = reservation.data[0]
        
        # Get restaurant details
        restaurant = supabase.table("restaurants").select("name, formatted_address").eq("id", resv["restaurantId"]).limit(1).execute()
        restaurant_name = restaurant.data[0]["name"] if restaurant.data else "Restaurant"
        location = restaurant.data[0].get("formatted_address", "") if restaurant.data else ""
        
        # Calculate times
        starts_at = datetime.fromisoformat(resv["startsAt"].replace('Z', '+00:00'))
        ends_at = starts_at + timedelta(hours=1)
        
        # Create ICS event
        calendar = Calendar()
        ics_event = IcsEvent()
        ics_event.name = f"Reservation at {restaurant_name}"
        ics_event.begin = starts_at
        ics_event.end = ends_at
        ics_event.description = f"Reservation for {resv['partySize']} people"
        ics_event.location = location
        
        calendar.events.add(ics_event)
        
        # Return as file
        ics_content = str(calendar)
        
        return Response(
            content=ics_content,
            media_type="text/calendar",
            headers={
                "Content-Disposition": f"attachment; filename=reservation-{reservation_id}.ics"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating ICS file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

