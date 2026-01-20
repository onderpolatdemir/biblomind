"""API router registry."""

from fastapi import APIRouter
from app.api import health, auth, books, users, admin

# Create main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(books.router, prefix="/books", tags=["Books"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Future routers will be added here:
# api_router.include_router(search.router, prefix="/search", tags=["Search"])
