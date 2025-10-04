"""
Twilio SMS service for sending reservation notifications
"""
import os
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from typing import Optional

class TwilioService:
    _client: Optional[Client] = None
    _validator: Optional[RequestValidator] = None
    
    @classmethod
    def initialize(cls):
        """Initialize Twilio client"""
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        
        if not account_sid or not auth_token:
            raise ValueError("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set")
        
        cls._client = Client(account_sid, auth_token)
        cls._validator = RequestValidator(auth_token)
        print(f"✅ Twilio client initialized")
        return cls._client
    
    @classmethod
    def get_client(cls) -> Client:
        """Get the Twilio client instance"""
        if cls._client is None:
            cls.initialize()
        return cls._client
    
    @classmethod
    def get_validator(cls) -> RequestValidator:
        """Get the Twilio request validator"""
        if cls._validator is None:
            cls.initialize()
        return cls._validator
    
    @classmethod
    def send_sms(cls, to: str, body: str, status_callback: Optional[str] = None) -> dict:
        """
        Send an SMS using Twilio Messaging Service (preferred) or fallback to direct number
        
        Args:
            to: E.164 formatted phone number
            body: Message body
            status_callback: Optional status callback URL
            
        Returns:
            dict with message_sid and status
        """
        # Validate E.164 format
        if not to.startswith('+') or len(to) < 10:
            raise ValueError(f"Invalid E.164 phone number: {to}")
        
        client = cls.get_client()
        
        message_params = {
            'to': to,
            'body': body
        }
        
        # Prefer Messaging Service SID
        messaging_service_sid = os.getenv("TWILIO_MESSAGING_SERVICE_SID")
        twilio_from = os.getenv("TWILIO_FROM")
        
        if messaging_service_sid:
            message_params['messaging_service_sid'] = messaging_service_sid
        elif twilio_from:
            message_params['from_'] = twilio_from
        else:
            raise ValueError("Missing TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM")
        
        if status_callback:
            message_params['status_callback'] = status_callback
        
        message = client.messages.create(**message_params)
        
        return {
            'message_sid': message.sid,
            'status': message.status,
            'to': to
        }
    
    @classmethod
    def validate_signature(cls, signature: str, url: str, params: dict) -> bool:
        """
        Validate Twilio request signature
        
        Args:
            signature: X-Twilio-Signature header value
            url: Full request URL
            params: Request parameters as dict
            
        Returns:
            True if signature is valid
        """
        validator = cls.get_validator()
        return validator.validate(url, params, signature)


def get_twilio() -> Client:
    """Dependency to get Twilio client"""
    return TwilioService.get_client()

