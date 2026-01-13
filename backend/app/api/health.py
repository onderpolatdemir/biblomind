"""Health check endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Health Check", description="Check system health status")
async def health_check(db: Session = Depends(get_db)):
    """
    Check the health of all system components.
    
    Returns:
        - status: overall health status
        - timestamp: current server time
        - services: status of each service (database, cache, search)
    """
    services_status = {}
    overall_healthy = True
    
    # Check PostgreSQL
    try:
        db.execute(text("SELECT 1"))
        services_status["database"] = {
            "status": "healthy",
            "type": "PostgreSQL + pgvector"
        }
    except Exception as e:
        services_status["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_healthy = False
    
    # Check Redis
    try:
        r = redis.from_url(settings.REDIS_URL, decode_responses=True)
        r.ping()
        services_status["cache"] = {
            "status": "healthy",
            "type": "Redis"
        }
    except Exception as e:
        services_status["cache"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_healthy = False
    
    # Check Elasticsearch (optional - won't fail overall health)
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.ELASTICSEARCH_URL}/_cluster/health", timeout=2.0)
            if response.status_code == 200:
                services_status["search"] = {
                    "status": "healthy",
                    "type": "Elasticsearch"
                }
            else:
                services_status["search"] = {
                    "status": "degraded",
                    "note": "Search may be limited"
                }
    except Exception as e:
        services_status["search"] = {
            "status": "unavailable",
            "note": "Search features disabled",
            "error": str(e)
        }
        # Don't mark overall as unhealthy for Elasticsearch
    
    return {
        "status": "healthy" if overall_healthy else "unhealthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "services": services_status
    }


@router.get("/", summary="Root", description="API root endpoint")
async def root():
    """API root endpoint."""
    return {
        "message": "Welcome to BiblioMind API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }
