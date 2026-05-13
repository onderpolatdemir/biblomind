"""Admin API endpoints for dashboard and management."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import math

from app.core.database import get_db
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.services.admin_service import AdminService
from app.schemas.admin import (
    AdminStats,
    AdminUserResponse,
    AdminUserListResponse,
    AdminOrderResponse,
    AdminOrderDetailResponse,
    AdminOrderListResponse,
    OrderStatusUpdate,
    TopSellingBook,
    RecentOrderSummary
)


router = APIRouter()


@router.get("/stats", response_model=AdminStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Get dashboard statistics.
    
    Returns:
    - Total users, books, orders
    - Total revenue
    - Orders by status
    
    **Requires admin privileges.**
    """
    stats = AdminService.get_dashboard_stats(db)
    return stats


@router.get("/users", response_model=AdminUserListResponse)
async def get_all_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by email or name"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Get all users with pagination and search.
    
    Query Parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    - search: Search term for email or name
    
    **Requires admin privileges.**
    """
    users, total = AdminService.get_all_users(db, page, page_size, search)
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user_details(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Get detailed user information.
    
    Returns user info with order statistics.
    
    **Requires admin privileges.**
    """
    user_details = AdminService.get_user_details(db, user_id)
    return user_details


@router.get("/orders", response_model=AdminOrderListResponse)
async def get_all_orders(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Get all orders with pagination and filtering.
    
    Query Parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    - status: Filter by order status
    
    **Requires admin privileges.**
    """
    orders, total = AdminService.get_all_orders(db, page, page_size, status)
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return {
        "items": orders,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/orders/{order_id}", response_model=AdminOrderDetailResponse)
async def get_order_details(
    order_id: UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Get detailed order information.
    
    Returns order info with all items.
    
    **Requires admin privileges.**
    """
    order_details = AdminService.get_order_detail(db, order_id)
    return order_details


@router.put("/orders/{order_id}/status", response_model=AdminOrderDetailResponse)
async def update_order_status(
    order_id: UUID,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Update order status.
    
    Valid statuses:
    - PENDING: Order created, awaiting payment
    - PAID: Payment received
    - SHIPPED: Order shipped
    - DELIVERED: Order delivered to customer
    - CANCELLED: Order cancelled
    
    **Requires admin privileges.**
    """
    updated_order = AdminService.update_order_status(db, order_id, status_update)
    return updated_order
