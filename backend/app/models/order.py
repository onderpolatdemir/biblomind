"""Order and order item models."""

from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, DECIMAL, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime, timezone

from app.core.database import Base


class OrderStatus(enum.Enum):
    """Order status enumeration."""
    PENDING = "PENDING"
    PAID = "PAID"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class Order(Base):
    """
    Customer order with payment and shipping information.
    """
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Pricing
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    shipping_cost = Column(DECIMAL(10, 2), default=0.00)
    total_price = Column(DECIMAL(10, 2), nullable=False)
    
    # Status
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    
    # Shipping information
    shipping_address = Column(JSONB, nullable=True)
    # Example: {"full_name": "...", "address": "...", "city": "...", "postal_code": "...", "phone": "..."}
    
    # Order notes
    notes = Column(Text, nullable=True)
    
    # Status history (for tracking)
    status_history = Column(JSONB, nullable=True)
    # Example: [{"status": "PENDING", "timestamp": "..."}, {"status": "PAID", "timestamp": "..."}]
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status.value}, total={self.total_price})>"


class OrderItem(Base):
    """
    Individual item in an order.
    Stores snapshot of book info at time of purchase.
    """
    __tablename__ = "order_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Snapshot of book info at purchase time
    book_title = Column(String(500), nullable=False)
    book_author = Column(String(255), nullable=True)
    book_cover_url = Column(Text, nullable=True)
    
    quantity = Column(Integer, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)  # Price per item at purchase time
    subtotal = Column(DECIMAL(10, 2), nullable=False)  # quantity * price
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    order = relationship("Order", back_populates="items")
    book = relationship("Book", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, book_title={self.book_title}, quantity={self.quantity})>"
