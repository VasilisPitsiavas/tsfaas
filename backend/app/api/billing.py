"""Billing API endpoints for Stripe integration."""

import stripe
from fastapi import APIRouter, HTTPException, Header, Request, Response
from typing import Optional
from app.core.config import settings
from app.utils.auth import require_auth, get_supabase_client, get_user_profile
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Stripe (TEST MODE ONLY)
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY
else:
    logger.warning("STRIPE_SECRET_KEY not configured - billing features disabled")


@router.post("/create-checkout-session")
async def create_checkout_session(
    authorization: Optional[str] = Header(None)
):
    """
    Create a Stripe Checkout Session for upgrading to Pro.
    Requires authentication.
    """
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_PRICE_ID:
        raise HTTPException(
            status_code=503,
            detail="Billing is not configured"
        )
    
    # Validate Price ID format
    if not settings.STRIPE_PRICE_ID.startswith('price_'):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Price ID format. Expected 'price_...' but got '{settings.STRIPE_PRICE_ID[:10]}...'. Please check your STRIPE_PRICE_ID in .env file. See STRIPE_GET_PRICE_ID.md for help."
        )
    
    # Require authentication
    user = await require_auth(authorization)
    user_id = user["id"]
    user_email = user["email"]
    
    # Frontend URL for success/cancel redirects
    # Prefer FRONTEND_URL, fallback to first CORS origin
    if settings.FRONTEND_URL:
        frontend_url = settings.FRONTEND_URL
    elif isinstance(settings.CORS_ORIGINS, list) and len(settings.CORS_ORIGINS) > 0:
        frontend_url = settings.CORS_ORIGINS[0]
    else:
        frontend_url = str(settings.CORS_ORIGINS) if settings.CORS_ORIGINS else "http://localhost:3000"
    
    try:
        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price": settings.STRIPE_PRICE_ID,
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=f"{frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/pricing",
            metadata={
                "user_id": user_id,
                "email": user_email,
            },
            customer_email=user_email,
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create checkout session: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating checkout session: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to create checkout session"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.
    This endpoint does NOT require authentication - Stripe calls it directly.
    """
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Billing webhook is not configured"
        )
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(
            status_code=400,
            detail="Missing stripe-signature header"
        )
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        
        # Extract user_id from metadata
        user_id = session.get("metadata", {}).get("user_id")
        
        if not user_id:
            logger.error("No user_id in checkout session metadata")
            return Response(status_code=200)  # Return 200 to acknowledge receipt
        
        try:
            # Update user profile to is_pro = true
            supabase = get_supabase_client()
            
            # Check if profile exists, if not create it
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                existing = await loop.run_in_executor(
                    None,
                    lambda: supabase.table("profiles").select("id").eq("id", user_id).execute()
                )
            except RuntimeError:
                existing = supabase.table("profiles").select("id").eq("id", user_id).execute()
            
            if existing.data and len(existing.data) > 0:
                # Update existing profile
                try:
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(
                        None,
                        lambda: supabase.table("profiles").update({"is_pro": True}).eq("id", user_id).execute()
                    )
                except RuntimeError:
                    supabase.table("profiles").update({"is_pro": True}).eq("id", user_id).execute()
            else:
                # Create new profile
                try:
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(
                        None,
                        lambda: supabase.table("profiles").insert({"id": user_id, "is_pro": True}).execute()
                    )
                except RuntimeError:
                    supabase.table("profiles").insert({"id": user_id, "is_pro": True}).execute()
            
            logger.info(f"Updated user {user_id} to Pro status")
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}", exc_info=True)
            # Still return 200 to acknowledge receipt - we'll retry if needed
    
    return Response(status_code=200)


@router.get("/profile")
async def get_billing_profile(
    authorization: Optional[str] = Header(None)
):
    """
    Get current user's billing profile (is_pro status).
    Requires authentication.
    """
    user = await require_auth(authorization)
    user_id = user["id"]
    
    profile = await get_user_profile(user_id)
    
    if not profile:
        # Return default (not pro)
        return {
            "is_pro": False,
            "user_id": user_id,
        }
    
    return {
        "is_pro": profile.get("is_pro", False),
        "user_id": user_id,
    }

