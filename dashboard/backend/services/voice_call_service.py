"""
Voice Call Service for Restaurant Reservations
Uses Twilio Programmable Voice to automatically call restaurants
"""
import os
from twilio.rest import Client
from datetime import datetime
from typing import Dict, Any


class VoiceCallService:
    """Service for making automated voice calls to restaurants"""
    
    @classmethod
    def make_reservation_call(
        cls,
        restaurant_name: str,
        restaurant_phone: str,
        party_size: int,
        reservation_time: datetime,
        customer_name: str,
        customer_phone: str,
        callback_url: str
    ) -> Dict[str, Any]:
        """
        Make an automated call to restaurant to book a reservation
        
        Args:
            restaurant_name: Name of the restaurant
            restaurant_phone: Restaurant's phone number (E.164 format)
            party_size: Number of people
            reservation_time: When the reservation is for
            customer_name: Name for the reservation
            customer_phone: Customer's callback number
            callback_url: URL for call status updates
            
        Returns:
            dict with call_sid and status
        """
        from services.twilio_service import TwilioService
        
        client = TwilioService.get_client()
        
        # Format the time in a natural way
        time_str = reservation_time.strftime("%A, %B %d at %I:%M %p")
        
        # Create TwiML for the call
        # This will use Twilio's AI voice assistant
        twiml_url = cls._generate_twiml_url(
            restaurant_name=restaurant_name,
            party_size=party_size,
            time_str=time_str,
            customer_name=customer_name,
            customer_phone=customer_phone,
            callback_url=callback_url
        )
        
        # Get from number
        twilio_from = os.getenv("TWILIO_FROM")
        messaging_service_sid = os.getenv("TWILIO_MESSAGING_SERVICE_SID")
        
        if not twilio_from and not messaging_service_sid:
            raise ValueError("No TWILIO_FROM or TWILIO_MESSAGING_SERVICE_SID configured")
        
        # Make the call
        call_params = {
            'to': restaurant_phone,
            'url': twiml_url,
            'status_callback': callback_url,
            'status_callback_event': ['initiated', 'ringing', 'answered', 'completed'],
            'machine_detection': 'Enable',  # Detect if answering machine
            'record': True  # Record the call for verification
        }
        
        if twilio_from:
            call_params['from_'] = twilio_from
        elif messaging_service_sid:
            # Note: Voice calls need a phone number, not messaging service
            # Fall back to getting a number from the messaging service
            raise ValueError("Voice calls require TWILIO_FROM phone number, not messaging service")
        
        try:
            call = client.calls.create(**call_params)
            
            return {
                'success': True,
                'call_sid': call.sid,
                'status': call.status,
                'to': restaurant_phone
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @classmethod
    def _generate_twiml_url(
        cls,
        restaurant_name: str,
        party_size: int,
        time_str: str,
        customer_name: str,
        customer_phone: str,
        callback_url: str
    ) -> str:
        """
        Generate the TwiML URL for the automated call
        This will be a dynamic endpoint that generates TwiML
        """
        app_base_url = os.getenv("APP_BASE_URL", "http://localhost:8000")
        
        # Create query params for the TwiML endpoint
        from urllib.parse import urlencode
        
        params = urlencode({
            'restaurant_name': restaurant_name,
            'party_size': party_size,
            'time': time_str,
            'customer_name': customer_name,
            'customer_phone': customer_phone
        })
        
        return f"{app_base_url}/api/voice/reservation-script?{params}"
    
    @classmethod
    def generate_reservation_twiml(
        cls,
        restaurant_name: str,
        party_size: int,
        time_str: str,
        customer_name: str,
        customer_phone: str
    ) -> str:
        """
        Generate TwiML script for making reservation
        Uses Twilio's text-to-speech with natural voice
        """
        
        # Script for the AI to speak
        script = f"""
        <Response>
            <Say voice="Polly.Matthew-Neural">
                Hello, I'm calling to make a reservation at {restaurant_name}. 
                I'd like to book a table for {party_size} people on {time_str}. 
                The reservation is under the name {customer_name}. 
                You can reach me at {customer_phone} to confirm. 
                Thank you!
            </Say>
            <Pause length="2"/>
            <Say voice="Polly.Matthew-Neural">
                If you need to confirm or have questions, please call {customer_phone}. 
                Thank you, goodbye!
            </Say>
        </Response>
        """
        
        return script.strip()
    
    @classmethod
    def check_call_status(cls, call_sid: str) -> Dict[str, Any]:
        """Check the status of a call"""
        from services.twilio_service import TwilioService
        
        client = TwilioService.get_client()
        
        try:
            call = client.calls(call_sid).fetch()
            
            return {
                'call_sid': call.sid,
                'status': call.status,
                'duration': call.duration,
                'to': call.to,
                'from': call.from_,
                'answered_by': call.answered_by
            }
        except Exception as e:
            return {
                'error': str(e)
            }

