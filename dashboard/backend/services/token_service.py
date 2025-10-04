"""
JWT token service for reservation action tokens
"""
import os
import jwt
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

def get_jwt_secret():
    """Get JWT secret from environment, lazy loaded"""
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise ValueError("JWT_SECRET environment variable must be set")
    return secret


class ActionTokenPayload:
    def __init__(self, resv_id: str, user_id: str, action: Literal["confirm", "owner_cancel"], jti: str):
        self.resv_id = resv_id
        self.user_id = user_id
        self.action = action
        self.jti = jti


def sign_action_token(resv_id: str, user_id: str, action: Literal["confirm", "owner_cancel"], ttl_seconds: int = 900) -> str:
    """
    Sign an action token with a TTL
    
    Args:
        resv_id: Reservation ID
        user_id: User ID (organizer)
        action: Action type ('confirm' or 'owner_cancel')
        ttl_seconds: Time to live in seconds (default 15 minutes)
        
    Returns:
        JWT token string
    """
    jti = str(uuid.uuid4())
    
    payload = {
        'resvId': resv_id,
        'userId': user_id,
        'action': action,
        'jti': jti,
        'exp': datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds),
        'iat': datetime.now(timezone.utc)
    }
    
    token = jwt.encode(payload, get_jwt_secret(), algorithm='HS256')
    return token


def verify_action_token(token: str) -> dict:
    """
    Verify and decode an action token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload dict
        
    Raises:
        jwt.ExpiredSignatureError: Token has expired
        jwt.InvalidTokenError: Token is invalid
    """
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=['HS256'])
        
        if not all(k in payload for k in ['jti', 'resvId', 'userId', 'action']):
            raise jwt.InvalidTokenError('Invalid token payload')
        
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError('Token has expired')
    except jwt.InvalidTokenError as e:
        raise ValueError(f'Invalid token: {str(e)}')


def decode_token_unsafe(token: str) -> dict:
    """
    Decode token without verification (for displaying info only, never trust for actions)
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload dict or None
    """
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except:
        return None

