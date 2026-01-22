"""
Rate limiting configuration using slowapi.

Prevents API abuse and ensures fair usage across endpoints.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from typing import Callable

from app.core.config import settings


def get_identifier(request: Request) -> str:
    """
    Get identifier for rate limiting.
    
    Uses remote address (IP) for unauthenticated requests,
    or user ID for authenticated requests if available.
    """
    # Try to get user from request state (set by auth middleware)
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.id}"
    
    # Fallback to IP address
    return get_remote_address(request)


# Create limiter instance
limiter = Limiter(
    key_func=get_identifier,
    default_limits=["100/minute"],  # Global default
    enabled=True
)


def init_rate_limiting(app):
    """
    Initialize rate limiting for FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
