"""API router registry."""

from fastapi import APIRouter
from app.api import health, auth, books, users, admin, vision, recommendations, chat, social, cart, orders, payment

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
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(social.router, prefix="/social", tags=["Social"])

# E-commerce routers (Önder)
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(payment.router, prefix="/payment", tags=["Payment"])
