"""API router registry."""

from fastapi import APIRouter
from app.api import health, auth, books, users, admin, vision, recommendations

# Create main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(books.router, prefix="/books", tags=["Books"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(vision.router, prefix="/vision", tags=["Vision"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])

# Future routers will be added here:
# api_router.include_router(search.router, prefix="/search", tags=["Search"])
