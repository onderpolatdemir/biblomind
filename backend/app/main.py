"""BiblioMind FastAPI Application - Main Entry Point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.middleware import logging_middleware, global_exception_handler
from app.core.rate_limit import init_rate_limiting
from app.core.monitoring import init_sentry
from app.api import api_router

# Ensure static uploads directory exists
os.makedirs("static/uploads/shelves", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger = setup_logging()
    init_sentry()  # Initialize Sentry error tracking
    
    # Create database tables
    from app.core.database import Base, engine
    import app.models # Import models to ensure they are registered
    Base.metadata.create_all(bind=engine)
    
    logger.info("=" * 60)
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info(f"🛑 Shutting down {settings.APP_NAME}")
    logger.info("=" * 60)


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## 📚 BiblioMind API
    
    AI-powered book discovery and e-commerce platform with advanced semantic search.
    
    ### Features:
    * 🤖 **AI-Powered Recommendations** - Personalized book suggestions using GPT-4
    * 📸 **Photo Scan** - Upload bookshelf photos to get instant recommendations
    * 🔍 **Semantic Search** - Find books using natural language queries
    * 🛒 **E-commerce** - Complete shopping experience with cart and orders
    * 👥 **Book Buddy** - Connect with readers who share your taste
    
    ### Technology Stack:
    * FastAPI + PostgreSQL (pgvector)
    * OpenAI (GPT-4o, Embeddings)
    * Google Cloud Vision API
    * Elasticsearch + Redis
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware - Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host Middleware (security)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.bibliomind.com"]
    )

# Custom Middleware
app.middleware("http")(logging_middleware)

# Rate Limiting
init_rate_limiting(app)

# Exception Handlers
app.add_exception_handler(Exception, global_exception_handler)

# Mount Static Files (for uploaded bookshelf photos)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount API Router
app.include_router(api_router, prefix="/api")

# Root endpoint (also serves as health check)
@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
