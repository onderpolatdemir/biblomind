"""Custom middleware for BiblioMind."""

import time
import logging
from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.logging import set_request_id, get_request_id

logger = logging.getLogger("bibliomind")


async def logging_middleware(request: Request, call_next: Callable) -> Response:
    """
    Log all incoming requests with request ID tracking and performance metrics.
    """
    start_time = time.time()
    
    # Generate and set request ID
    request_id = request.headers.get("X-Request-ID") or set_request_id()
    request.state.request_id = request_id
    
    # Log request with extra context
    logger.info(
        f"→ {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None
        }
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log response with metrics
    logger.info(
        f"← {request.method} {request.url.path} "
        f"- Status: {response.status_code} "
        f"- Time: {process_time:.3f}s",
        extra={
            "request_id": request_id,
            "status_code": response.status_code,
            "duration_ms": round(process_time * 1000, 2)
        }
    )
    
    # Add headers
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-ID"] = request_id
    
    return response


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler with Sentry integration and request tracking.
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Log with context
    logger.error(
        f"Unhandled exception: {exc}",
        exc_info=True,
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    # Capture to Sentry (if configured)
    try:
        import sentry_sdk
        sentry_sdk.capture_exception(exc)
    except:
        pass  # Sentry not configured
    
    # Database errors
    if isinstance(exc, SQLAlchemyError):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Database Error",
                "message": "A database error occurred. Please try again later.",
                "detail": str(exc) if logger.level <= logging.DEBUG else None,
                "request_id": request_id
            }
        )
    
    # Generic server error
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "detail": str(exc) if logger.level <= logging.DEBUG else None,
            "request_id": request_id
        }
    )
