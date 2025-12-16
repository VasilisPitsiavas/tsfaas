"""Authentication utilities for Supabase JWT verification."""

from fastapi import HTTPException, Header
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings


def get_supabase_client() -> Client:
    """Create a Supabase client with service role key."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Supabase credentials not configured")
    
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )


async def get_user_from_token(
    authorization: Optional[str] = Header(None)
) -> Optional[dict]:
    """
    Extract user from Authorization header (Bearer token).
    
    Args:
        authorization: Authorization header value (format: "Bearer <token>")
    
    Returns:
        User dictionary with 'id' and 'email' if valid, None otherwise
    """
    if not authorization:
        return None
    
    try:
        # Extract token from "Bearer <token>"
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        
        token = parts[1]
        
        # Verify token with Supabase
        supabase = get_supabase_client()
        # Supabase Python client get_user is synchronous, but we're in an async function
        # Run it in executor to avoid blocking the event loop
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            user_response = await loop.run_in_executor(
                None, 
                lambda: supabase.auth.get_user(jwt=token)
            )
        except RuntimeError:
            # If no event loop, create one
            user_response = supabase.auth.get_user(jwt=token)
        
        if user_response and user_response.user:
            return {
                "id": user_response.user.id,
                "email": user_response.user.email,
            }
        
        return None
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error verifying token: {str(e)}", exc_info=True)
        # If token verification fails, return None
        return None


async def require_auth(
    authorization: Optional[str] = Header(None)
) -> dict:
    """
    Require authentication - raise 401 if not authenticated.
    
    Args:
        authorization: Authorization header value
    
    Returns:
        User dictionary with 'id' and 'email'
    
    Raises:
        HTTPException: 401 if not authenticated
    """
    user = await get_user_from_token(authorization)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user
