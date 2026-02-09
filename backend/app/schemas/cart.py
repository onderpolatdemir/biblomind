from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, computed_field

# --- Book Summary Schema for Cart Item Display ---
class BookSummary(BaseModel):
    id: UUID
    title: str
    author: Optional[str] = None
    price: Decimal
    stock: int  # Added for cart validation
    cover_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# --- Cart Item Schemas ---
class CartItemBase(BaseModel):
    book_id: UUID
    quantity: int = Field(default=1, ge=1)

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)

class CartItem(CartItemBase):
    id: UUID
    cart_id: UUID
    price_at_addition: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    book: Optional[BookSummary] = None  # Nested book details
    
    # Computed property for total price of this item
    @property
    def subtotal(self) -> Decimal:
        price = self.price_at_addition
        if self.book and self.book.price:
            price = self.book.price
        return (price or Decimal(0)) * self.quantity

    model_config = ConfigDict(from_attributes=True)

# --- Cart Schemas ---
class CartBase(BaseModel):
    pass

class CartCreate(CartBase):
    pass

class Cart(CartBase):
    id: UUID
    user_id: UUID
    items: List[CartItem] = []
    created_at: datetime
    updated_at: datetime
    
    @computed_field
    def total_price(self) -> Decimal:
        return sum([item.subtotal for item in self.items])
    
    @computed_field
    def total_items(self) -> int:
        return sum([item.quantity for item in self.items])

    model_config = ConfigDict(from_attributes=True)
