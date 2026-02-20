from typing import Any, List
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, desc

from app.api import deps
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.schemas import order as schemas

router = APIRouter()

@router.post("/create", response_model=schemas.Order)
def create_order(
    order_in: schemas.OrderCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Create a new order from the user's current shopping cart.
    1. Validates that the cart is not empty.
    2. Creates an Order record.
    3. Moves items from CartItem to OrderItem (snapshotting prices).
    4. Clears the user's cart.
    """
    # 1. Get user's cart with items and book details
    cart_query = select(Cart).where(Cart.user_id == current_user.id).options(
        joinedload(Cart.items).joinedload(CartItem.book)
    )
    cart = db.execute(cart_query).scalars().first()
    
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )

    # 1.5. Check for existing PENDING order and delete it to prevent duplicates
    existing_order_query = select(Order).where(
        Order.user_id == current_user.id,
        Order.status == OrderStatus.PENDING
    )
    existing_order = db.execute(existing_order_query).scalars().first()
    
    if existing_order:
        # Delete existing pending order
        # Assuming cascade delete is set up for items, otherwise verify
        db.delete(existing_order)
        db.flush()
        
    # 2. Calculate totals
    subtotal = sum(item.book.price * item.quantity for item in cart.items if item.book.price)
    shipping_cost = 0  # Logic for shipping cost can be added here
    total_price = subtotal + shipping_cost
    
    # 3. Create Order
    new_order = Order(
        user_id=current_user.id,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total_price=total_price,
        status=OrderStatus.PENDING,
        shipping_address=order_in.shipping_address,
        notes=order_in.notes,
        status_history=[
            {"status": OrderStatus.PENDING.value, "timestamp": datetime.now(timezone.utc).isoformat()}
        ]
    )
    db.add(new_order)
    db.flush() # Flush to get the new_order.id
    
    # 4. Create Order Items (Snapshot)
    for cart_item in cart.items:
        if not cart_item.book:
            continue # Should not happen if DB integrity is maintained
            
        order_item = OrderItem(
            order_id=new_order.id,
            book_id=cart_item.book_id,
            book_title=cart_item.book.title,
            book_author=cart_item.book.author,
            book_cover_url=cart_item.book.cover_url,
            quantity=cart_item.quantity,
            price=cart_item.book.price,
            subtotal=cart_item.book.price * cart_item.quantity
        )
        db.add(order_item)
        
    # 5. Clear Cart (MOVED TO PAYMENT CALLBACK)
    # We keep the items in cart until payment is confirmed
    # for item in cart.items:
    #     db.delete(item)
        
    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/", response_model=List[schemas.Order])
def get_orders(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve current user's order history.
    """
    query = select(Order).where(Order.user_id == current_user.id)\
        .order_by(desc(Order.created_at))\
        .offset(skip).limit(limit)\
        .options(joinedload(Order.items))
        
    orders = db.execute(query).scalars().unique().all()
    return orders

@router.get("/{order_id}", response_model=schemas.Order)
def get_order_detail(
    order_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get detailed information about a specific order.
    """
    query = select(Order).where(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).options(joinedload(Order.items))
    
    order = db.execute(query).scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    return order

@router.put("/{order_id}/status", response_model=schemas.Order)
def update_order_status(
    order_id: UUID,
    status_in: schemas.OrderUpdateStatus,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Update order status.
    TODO: Add admin permission check.
    """
    # For now, we allow any logged-in user to update their own order status for testing
    # In production, this should be restricted to admin users or callbacks
    query = select(Order).where(Order.id == order_id)
    order = db.execute(query).scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    # Update status
    order.status = status_in.status
    
    # Update history
    if order.status_history is None:
        order.status_history = []
        
    # Append to history (create new list to ensure change tracking picks it up)
    new_history = list(order.status_history)
    new_history.append({
        "status": status_in.status.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_by": str(current_user.id)
    })
    order.status_history = new_history
    
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
