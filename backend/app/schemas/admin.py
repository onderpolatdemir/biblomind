"""Admin schemas for dashboard and management operations."""

from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class AdminStats(BaseModel):
    """Dashboard statistics for admin panel."""
    total_users: int = Field(..., description="Total number of registered users")
    total_books: int = Field(..., description="Total number of books in catalog")
    total_orders: int = Field(..., description="Total number of orders")
    total_revenue: Decimal = Field(..., description="Total revenue from all orders")
    orders_by_status: Dict[str, int] = Field(..., description="Order counts by status")
    
    class Config:
        from_attributes = True


class AdminUserResponse(BaseModel):
    """User information for admin management."""
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    is_admin: bool
    created_at: datetime
    total_orders: int = Field(0, description="Total number of orders by this user")
    total_spent: Decimal = Field(Decimal("0.00"), description="Total amount spent")
    
    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    """Paginated user list response."""
    items: List[AdminUserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status."""
    status: str = Field(..., description="New status: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED")
    
    class Config:
        from_attributes = True


class AdminOrderItemResponse(BaseModel):
    """Order item information for admin."""
    id: UUID
    book_id: UUID
    book_title: Optional[str] = None
    book_author: Optional[str] = None
    quantity: int
    price: Decimal
    
    class Config:
        from_attributes = True


class AdminOrderResponse(BaseModel):
    """Order information for admin management."""
    id: UUID
    user_id: UUID
    user_email: Optional[str] = None
    status: str
    total_price: Decimal
    shipping_address: Optional[dict] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items_count: int = Field(0, description="Number of items in order")
    
    class Config:
        from_attributes = True


class AdminOrderDetailResponse(AdminOrderResponse):
    """Detailed order information with items."""
    items: List[AdminOrderItemResponse] = Field(default_factory=list)
    
    class Config:
        from_attributes = True


class AdminOrderListResponse(BaseModel):
    """Paginated order list response."""
    items: List[AdminOrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    class Config:
        from_attributes = True


class TopSellingBook(BaseModel):
    """Top selling book statistics."""
    book_id: UUID
    title: str
    author: str
    total_sold: int
    total_revenue: Decimal
    
    class Config:
        from_attributes = True


class RecentOrderSummary(BaseModel):
    """Recent order summary for dashboard."""
    id: UUID
    user_email: str
    total_price: Decimal
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
