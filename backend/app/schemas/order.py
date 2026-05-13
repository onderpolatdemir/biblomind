from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.models.order import OrderStatus

# --- Order Item Schemas ---
class OrderItemBase(BaseModel):
    book_id: UUID
    quantity: int = Field(ge=1)
    
class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: UUID
    order_id: UUID
    book_title: str
    book_author: Optional[str] = None
    book_cover_url: Optional[str] = None
    price: Decimal
    subtotal: Decimal
    
    model_config = ConfigDict(from_attributes=True)

# --- Order Schemas ---
class OrderBase(BaseModel):
    shipping_address: Dict[str, Any]
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdateStatus(BaseModel):
    status: OrderStatus

class Order(OrderBase):
    id: UUID
    user_id: UUID
    status: OrderStatus
    subtotal: Decimal
    shipping_cost: Decimal
    total_price: Decimal
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem] = []
    
    status_history: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(from_attributes=True)
