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


class InviteLink(BaseModel):
    inviteId: str
    phoneE164: str
    text: str
    url: str

class SendReservationResponse(BaseModel):
    ok: bool
    reservationId: str
    invites: list[InviteLink]


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
        
        # Validate organizer exists and has phone number
        organizer_result = supabase.table("profiles").select("id, phone").eq("id", request.organizer_id).limit(1).execute()
        if not organizer_result.data:
            raise HTTPException(status_code=404, detail="Organizer not found")
        
        organizer = organizer_result.data[0]
        if not organizer.get("phone"):
            raise HTTPException(status_code=400, detail="Phone number required. Please update your profile with a phone number to create reservations.")
        
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
        
        invites_result = supabase.table("reservation_invites").insert(invites_data).execute()
        inserted_invites = invites_result.data if invites_result.data else []
        
        # Generate iMessage invites (no SMS sending)
        invite_links = []
        
        # Format time for display
        time_str = starts_at.strftime("%A, %B %d at %I:%M %p")
        
        for inserted_invite in inserted_invites:
            invite_id = inserted_invite["id"]
            phone = inserted_invite["inviteePhoneE164"]
            
            # Generate invite token (1 hour expiry)
            token = sign_action_token(
                resv_id=reservation_id,
                action="invite_accept",
                invite_id=invite_id,
                ttl_seconds=3600
            )
            
            invite_url = f"{app_base_url}/r/invite?token={token}"
            
            # Build iMessage text
            message_text = f"🍽️ Join me at {restaurant_name} on {time_str}! Tap to accept: {invite_url}"
            
            invite_links.append({
                "inviteId": invite_id,
                "phoneE164": phone,
                "text": message_text,
                "url": invite_url
            })
        
        return {
            "ok": True,
            "reservationId": reservation_id,
            "invites": invite_links
        }
    
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
            
            # Get invitee details
            invites = resv.get("reservation_invites", [])
            invitee_list = []
            for inv in invites:
                invitee_info = {"phone": inv["inviteePhoneE164"], "status": inv["rsvpStatus"]}
                # Try to get profile info if linked
                if inv.get("inviteeProfileId"):
                    profile = supabase.table("profiles").select("display_name, username").eq("id", inv["inviteeProfileId"]).limit(1).execute()
                    if profile.data:
                        invitee_info["name"] = profile.data[0].get("display_name") or profile.data[0].get("username")
                invitee_list.append(invitee_info)
            
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
                "invite_count": len(invites),
                "invitees": invitee_list
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
        restaurant = supabase.table("restaurants").select("name, formatted_address, phone_number, website, google_maps_url, rating_avg, user_ratings_total, price_level, description").eq("id", resv["restaurantId"]).limit(1).execute()
        restaurant_data = restaurant.data[0] if restaurant.data else None
        restaurant_name = restaurant_data.get("name") if restaurant_data else "Unknown Restaurant"
        restaurant_address = restaurant_data.get("formatted_address") if restaurant_data else None
        
        # Get restaurant images
        restaurant_images = []
        if restaurant_data:
            images = supabase.table("images").select("id, image_url, description, dish").eq("restaurant_id", resv["restaurantId"]).limit(10).execute()
            if images.data:
                restaurant_images = [{"id": img["id"], "url": img["image_url"], "description": img.get("description"), "dish": img.get("dish")} for img in images.data]
        
        # Enrich invites with profile names
        invites = resv.get("reservation_invites", [])
        enriched_invites = []
        for inv in invites:
            invite_data = {
                "id": inv["id"],
                "inviteePhoneE164": inv["inviteePhoneE164"],
                "rsvpStatus": inv["rsvpStatus"],
                "respondedAt": inv.get("respondedAt"),
                "inviteeName": None
            }
            # Try to get profile info if linked
            if inv.get("inviteeProfileId"):
                profile = supabase.table("profiles").select("display_name, username").eq("id", inv["inviteeProfileId"]).limit(1).execute()
                if profile.data:
                    invite_data["inviteeName"] = profile.data[0].get("display_name") or profile.data[0].get("username")
            enriched_invites.append(invite_data)
        
        return {
            "id": resv["id"],
            "organizer_id": resv["organizerId"],
            "restaurant_id": resv["restaurantId"],
            "restaurant_name": restaurant_name,
            "restaurant_address": restaurant_address,
            "restaurant": {
                "name": restaurant_name,
                "address": restaurant_address,
                "phone": restaurant_data.get("phone_number") if restaurant_data else None,
                "website": restaurant_data.get("website") if restaurant_data else None,
                "google_maps_url": restaurant_data.get("google_maps_url") if restaurant_data else None,
                "rating": restaurant_data.get("rating_avg") if restaurant_data else None,
                "user_ratings_total": restaurant_data.get("user_ratings_total") if restaurant_data else None,
                "price_level": restaurant_data.get("price_level") if restaurant_data else None,
                "description": restaurant_data.get("description") if restaurant_data else None,
                "images": restaurant_images
            },
            "starts_at": resv["startsAt"],
            "party_size": resv["partySize"],
            "status": resv["status"],
            "created_at": resv["createdAt"],
            "invites": enriched_invites,
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


@router.delete("/{reservation_id}")
async def delete_reservation(reservation_id: str):
    """
    Delete/cancel a reservation (organizer only)
    """
    try:
        supabase = get_supabase()
        
        # First check if reservation exists and get organizer info
        reservation_result = supabase.table("reservations").select("*").eq("id", reservation_id).single().execute()
        
        if not reservation_result.data:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        reservation = reservation_result.data
        
        # Delete the reservation (cascade will delete related invites)
        delete_result = supabase.table("reservations").delete().eq("id", reservation_id).execute()
        
        if not delete_result.data:
            raise HTTPException(status_code=500, detail="Failed to delete reservation")
        
        print(f"✅ Deleted reservation {reservation_id}")
        
        return {
            "success": True,
            "message": "Reservation deleted successfully",
            "reservation_id": reservation_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting reservation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

