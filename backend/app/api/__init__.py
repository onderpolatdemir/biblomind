"""API router registry."""

from fastapi import APIRouter
from app.api import health, auth, cart, orders, payment, books

# Create main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

api_router.include_router(books.router, prefix="/books", tags=["Books"])
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(payment.router, prefix="/payment", tags=["Payment"])
# Future routers will be added here:
# api_router.include_router(books.router, prefix="/books", tags=["Books"])
# api_router.include_router(search.router, prefix="/search", tags=["Search"])
