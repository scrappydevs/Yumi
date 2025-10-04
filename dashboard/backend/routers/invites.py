"""
Invitation Accept/Decline Routes
Handles invitees accepting or declining reservation invitations via token
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from supabase_client import get_supabase
from services.token_service import verify_action_token
from typing import Optional

router = APIRouter(prefix="/invites", tags=["invites"])


class InviteActionRequest(BaseModel):
    token: str
    user_id: Optional[str] = None  # Can be passed from frontend


class InviteActionResponse(BaseModel):
    ok: bool
    reservation_id: str


@router.post("/accept", response_model=InviteActionResponse)
async def accept_invite(request: InviteActionRequest):
    """
    Accept a reservation invitation
    
    Flow:
    1. Verify token (single-use via UsedJti)
    2. Get current user (must be logged in)
    3. Update invite: set inviteeProfileId if null, set rsvpStatus='yes'
    4. Create CalendarEvent for this user
    5. Check if all invites accepted → auto-confirm reservation
    """
    try:
        supabase = get_supabase()
        
        # Verify token
        try:
            payload = verify_action_token(request.token)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))
        
        if payload.get('action') != 'invite_accept':
            raise HTTPException(status_code=400, detail="Invalid action token")
        
        resv_id = payload['resvId']
        invite_id = payload.get('inviteId')
        jti = payload['jti']
        
        if not invite_id:
            raise HTTPException(status_code=400, detail="Missing invite ID in token")
        
        # Check if token already used (idempotency)
        existing_jti = supabase.table("used_jtis").select("*").eq("jti", jti).execute()
        if existing_jti.data:
            # Token already used - return success idempotently
            return InviteActionResponse(ok=True, reservation_id=resv_id)
        
        # Mark token as used
        supabase.table("used_jtis").insert({
            "jti": jti,
            "resvId": resv_id,
            "usedAt": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # Get the invite
        invite_result = supabase.table("reservation_invites")\
            .select("*")\
            .eq("id", invite_id)\
            .limit(1)\
            .execute()
        
        if not invite_result.data:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        invite = invite_result.data[0]
        
        print(f"\n{'='*60}")
        print(f"📬 ACCEPT INVITE REQUEST")
        print(f"{'='*60}")
        print(f"🎫 Invite ID: {invite_id}")
        print(f"📋 Full invite data: {invite}")
        
        # Get current user ID from request
        current_user_id = request.user_id
        
        if not current_user_id:
            print(f"❌ No user ID provided in request!")
            raise HTTPException(status_code=401, detail="User ID required. Please log in.")
        
        # Get current user's profile
        user_profile_result = supabase.table("profiles")\
            .select("id, username, display_name, phone")\
            .eq("id", current_user_id)\
            .limit(1)\
            .execute()
        
        current_user_profile = user_profile_result.data[0] if user_profile_result.data else {}
        
        print(f"👤 Current user: {current_user_id}")
        print(f"   Username: {current_user_profile.get('username')}")
        print(f"   Display: {current_user_profile.get('display_name')}")
        print(f"   Phone: {current_user_profile.get('phone')}")
        print(f"\n📨 Invite details:")
        print(f"   Assigned to profile: {invite.get('inviteeProfileId')}")
        print(f"   Assigned to phone: {invite.get('inviteePhoneE164')}")
        print(f"   Current status: {invite.get('rsvpStatus')}")
        
        # DEMO MODE: Skip security checks - anyone with the link can accept
        print(f"🎭 DEMO MODE: Skipping security checks - allowing any logged-in user to accept")
        
        # Update invite: link profile and accept
        update_data = {
            "rsvpStatus": "yes",
            "respondedAt": datetime.now(timezone.utc).isoformat()
        }
        
        # Set inviteeProfileId if not already set
        if not invite.get("inviteeProfileId"):
            update_data["inviteeProfileId"] = current_user_id
        
        supabase.table("reservation_invites").update(update_data).eq("id", invite_id).execute()
        
        # Get reservation details
        reservation = supabase.table("reservations")\
            .select("*")\
            .eq("id", resv_id)\
            .limit(1)\
            .execute()
        
        if not reservation.data:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        resv = reservation.data[0]
        
        # Get restaurant name for calendar event
        restaurant = supabase.table("restaurants")\
            .select("name")\
            .eq("id", resv["restaurantId"])\
            .limit(1)\
            .execute()
        
        restaurant_name = restaurant.data[0]["name"] if restaurant.data else "Restaurant"
        
        # Create calendar event for this user (if not exists)
        # Using composite unique (reservationId, userId) to prevent duplicates
        try:
            calendar_event = {
                "reservationId": resv_id,
                "userId": current_user_id,
                "title": f"Dinner at {restaurant_name}",
                "startsAt": resv["startsAt"],
                "endsAt": (datetime.fromisoformat(resv["startsAt"].replace('Z', '+00:00')) + timedelta(hours=2)).isoformat(),
                "notes": f"Party of {resv['partySize']}"
            }
            
            # Use upsert to handle duplicate key gracefully
            supabase.table("calendar_events").upsert(calendar_event).execute()
            print(f"✅ Calendar event created for user {current_user_id}")
        except Exception as e:
            # Calendar events table may not exist yet - this is optional
            print(f"⚠️ Could not create calendar event (table may not exist): {e}")
        
        # Update reservation to confirmed when invite is accepted
        print(f"🔄 Current reservation status: {resv['status']}")
        if resv["status"] != "confirmed":
            print(f"🔄 Updating reservation {resv_id} to confirmed...")
            update_result = supabase.table("reservations").update({
                "status": "confirmed"
            }).eq("id", resv_id).execute()
            print(f"🎉 Update result: {update_result.data}")
            print(f"✅ Reservation confirmed!")
        else:
            print(f"ℹ️ Reservation already confirmed")
        
        print(f"\n✅ INVITE ACCEPTED SUCCESSFULLY")
        print(f"   Reservation ID: {resv_id}")
        print(f"   User: {current_user_profile.get('display_name')}")
        print(f"   Status: confirmed")
        print(f"{'='*60}\n")
        
        return InviteActionResponse(ok=True, reservation_id=resv_id)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error accepting invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/decline", response_model=InviteActionResponse)
async def decline_invite(request: InviteActionRequest):
    """
    Decline a reservation invitation
    """
    try:
        supabase = get_supabase()
        
        # Verify token
        try:
            payload = verify_action_token(request.token)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))
        
        if payload.get('action') not in ['invite_accept', 'invite_decline']:
            raise HTTPException(status_code=400, detail="Invalid action token")
        
        resv_id = payload['resvId']
        invite_id = payload.get('inviteId')
        jti = payload['jti']
        
        if not invite_id:
            raise HTTPException(status_code=400, detail="Missing invite ID in token")
        
        # Check if token already used
        existing_jti = supabase.table("used_jtis").select("*").eq("jti", jti).execute()
        if existing_jti.data:
            return InviteActionResponse(ok=True, reservation_id=resv_id)
        
        # Mark token as used
        supabase.table("used_jtis").insert({
            "jti": jti,
            "resvId": resv_id,
            "usedAt": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # Update invite to declined
        supabase.table("reservation_invites").update({
            "rsvpStatus": "no",
            "respondedAt": datetime.now(timezone.utc).isoformat()
        }).eq("id", invite_id).execute()
        
        # Check all invites to determine reservation status
        print(f"🔄 Checking all invites for reservation {resv_id}...")
        all_invites = supabase.table("reservation_invites")\
            .select("*")\
            .eq("reservationId", resv_id)\
            .execute()
        
        total_invites = len(all_invites.data)
        accepted_count = sum(1 for inv in all_invites.data if inv.get("rsvpStatus") == "yes")
        declined_count = sum(1 for inv in all_invites.data if inv.get("rsvpStatus") == "no")
        
        print(f"📊 Invite stats: {accepted_count} accepted, {declined_count} declined, {total_invites} total")
        
        # Get current reservation to check status
        reservation = supabase.table("reservations")\
            .select("*")\
            .eq("id", resv_id)\
            .limit(1)\
            .execute()
        
        if reservation.data:
            resv = reservation.data[0]
            
            if declined_count == total_invites and total_invites > 0:
                # All invites declined - cancel reservation
                print(f"❌ All {total_invites} invites declined! Canceling reservation.")
                if resv["status"] != "canceled":
                    print(f"🔄 Updating reservation from '{resv['status']}' to 'canceled'...")
                    update_result = supabase.table("reservations").update({
                        "status": "canceled"
                    }).eq("id", resv_id).execute()
                    print(f"🎉 Update result: {update_result.data}")
            else:
                print(f"📊 Invite declined. Stats: {accepted_count} accepted, {declined_count} declined, {total_invites} total")
                print(f"ℹ️ Reservation remains in current status (at least one invite pending or accepted)")
        
        return InviteActionResponse(ok=True, reservation_id=resv_id)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error declining invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))

