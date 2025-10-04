"""
Voice Call Router for Restaurant Reservations
Handles TwiML generation and call status callbacks
"""
from fastapi import APIRouter, Query, Request, Response
from fastapi.responses import Response as FastAPIResponse
from services.voice_call_service import VoiceCallService

router = APIRouter(prefix="/voice", tags=["voice"])


@router.get("/reservation-script")
async def reservation_script(
    restaurant_name: str = Query(...),
    party_size: int = Query(...),
    time: str = Query(...),
    customer_name: str = Query(...),
    customer_phone: str = Query(...)
):
    """
    Generate TwiML script for automated restaurant reservation call
    This is what Twilio will use to speak when calling the restaurant
    """
    
    twiml = VoiceCallService.generate_reservation_twiml(
        restaurant_name=restaurant_name,
        party_size=party_size,
        time_str=time,
        customer_name=customer_name,
        customer_phone=customer_phone
    )
    
    return FastAPIResponse(content=twiml, media_type="text/xml")


@router.post("/call-status")
async def call_status_callback(request: Request):
    """
    Handle call status updates from Twilio
    """
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    call_status = form_data.get("CallStatus")
    duration = form_data.get("CallDuration", "0")
    
    print(f"📞 Call {call_sid} status: {call_status}, duration: {duration}s")
    
    # TODO: Update reservation in database with call status
    # You can add logic here to update the reservation record
    
    return {"ok": True}


@router.get("/call-status/{call_sid}")
async def get_call_status(call_sid: str):
    """
    Get the status of a specific call
    """
    status = VoiceCallService.check_call_status(call_sid)
    return status

