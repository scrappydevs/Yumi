"""
Simple JWT token decoding utility.
For MVP, we decode without signature verification.
"""
import jwt
from fastapi import Header, HTTPException


def get_user_id_from_token(authorization: str = Header(None)) -> str:
    """
    Extract user_id from JWT token without verification (MVP only).
    
    Args:
        authorization: Bearer token from request header
        
    Returns:
        user_id (UUID as string)
        
    Raises:
        HTTPException: If token is missing or invalid format
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    # Remove "Bearer " prefix
    token = authorization.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization format")

    try:
        # Decode WITHOUT signature verification (MVP only!)
        # In production, you should verify the signature
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload - missing 'sub' field")

        return user_id

    except jwt.DecodeError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token decode error: {str(e)}")

