from typing import Any
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session, joinedload

from sqlalchemy import select

from app.api import deps
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas import payment as schemas
from app.services.payment_service import payment_service

router = APIRouter()

@router.post("/initialize", response_model=schemas.PaymentInitializeResponse)
def initialize_payment(
    request: schemas.PaymentInitializeRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Initialize payment for an order.
    Returns the payment page URL (iframe).
    """
    # 1. Get the order
    query = select(Order).where(
        Order.id == request.order_id,
        Order.user_id == current_user.id
    ).options(joinedload(Order.items))
    order = db.execute(query).scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not in PENDING status"
        )
        
    # 2. Call Payment Service
    try:
        # Prepare items list
        items = []
        for item in order.items:
            items.append({
                "id": str(item.book_id),
                "name": item.book_title,
                "price": float(item.subtotal)
            })
            
        # Parse user name
        first_name = "Guest"
        last_name = "User"
        if current_user.full_name:
            parts = current_user.full_name.split(" ")
            if len(parts) > 0:
                first_name = parts[0]
            if len(parts) > 1:
                last_name = " ".join(parts[1:])
                
        payment_url = payment_service.initialize_payment(
            order_id=order.id,
            price=float(order.total_price),
            user_info={
                "id": str(current_user.id), 
                "email": current_user.email,
                "first_name": first_name,
                "last_name": last_name,
                "phone": "+905000000000" # Default for now as User model doesn't have phone
            },
            shipping_address=order.shipping_address or {},
            items=items
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment initialization failed: {str(e)}"
        )
        
    return {
        "payment_page_url": payment_url,
        "conversation_id": str(order.id)
    }

@router.post("/callback")
async def payment_callback(
    request: Request,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Handle Iyzico payment callback.
    """
    try:
        # Iyzico sends data as form-urlencoded
        form_data = await request.form()
        token = form_data.get("token")
        
        if not token:
             return RedirectResponse(
                url=f"http://localhost:3000/checkout/result?status=failure&errorMessage=No token provided",
                status_code=status.HTTP_303_SEE_OTHER
            )

        # Verify payment with Iyzico
        # Re-instantiate service to ensure clean state if needed
        # payment_service is imported as instance, so we use it directly
        result = payment_service.verify_payment(token)

        if result.get("status") == "success":
            # Update order status
            # Iyzico returns basketId which we set to order_id
            order_id = result.get("basketId")
            
            # Need to find the order. 
            # Note: We don't have current_user here, so we just find by ID.
            query = select(Order).where(Order.id == order_id)
            order = db.execute(query).scalars().first()
            
            if order:
                # Only update if not already paid to avoid redundant history
                if order.status != OrderStatus.PAID:
                    order.status = OrderStatus.PAID
                    
                    # Update history
                    if order.status_history is None:
                        order.status_history = []
                    
                    new_history = list(order.status_history)
                    new_history.append({
                        "status": OrderStatus.PAID.value,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "updated_by": "Iyzico Callback"
                    })
                    order.status_history = new_history
                    
                    db.add(order)
                    
                    # --- NEW: Clear Cart after successful payment ---
                    # Find user's cart
                    from app.models.cart import Cart
                    cart_query = select(Cart).where(Cart.user_id == order.user_id).options(joinedload(Cart.items))
                    cart = db.execute(cart_query).scalars().first()
                    
                    if cart and cart.items:
                        for item in cart.items:
                            db.delete(item)
                    # -----------------------------------------------
                    
                    db.commit()
            
            return RedirectResponse(
                url=f"http://localhost:3000/checkout/result?status=success&orderId={order_id}",
                status_code=status.HTTP_303_SEE_OTHER
            )
        else:
             error_message = result.get("errorMessage", "Payment failed")
             return RedirectResponse(
                url=f"http://localhost:3000/checkout/result?status=failure&errorMessage={error_message}",
                status_code=status.HTTP_303_SEE_OTHER
            )
            
    except Exception as e:
        print(f"Payment Callback Error: {e}")
        return RedirectResponse(
            url=f"http://localhost:3000/checkout/result?status=failure&errorMessage=Internal Server Error",
            status_code=status.HTTP_303_SEE_OTHER
        )
