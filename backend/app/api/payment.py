from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
    )
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
        payment_url = payment_service.initialize_payment(
            order_id=order.id,
            price=float(order.total_price),
            user_info={"id": str(current_user.id), "email": current_user.email},
            shipping_address=order.shipping_address or {}
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
def payment_callback(
    request: schemas.PaymentCallbackRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Callback endpoint for successful payment.
    In a real scenario, this is called by the frontend after Iyzico redirect,
    or directly by Iyzico webhook.
    """
    # 1. Verify payment with service
    verification_result = payment_service.verify_payment(request.token)
    
    if verification_result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=verification_result.get("errorMessage", "Payment verification failed")
        )
        
    # 2. Update Order Status
    # In a real app we might need to parse conversationId from token or result
    # For now, we assume frontend passes the correct context or we find it via payment ID logic
    # Since this is a mock callback from frontend, we might not have order_id here easily 
    # unless we encoded it in the "token" or use a different flow.
    # To keep it simple for this mock: we won't auto-update order status here WITHOUT order_id.
    # Better flow: Frontend calls this with order_id AND token.
    # Let's simple return success and let frontend call a 'verify' endpoint with order_id
    
    return {"status": "success", "detail": "Payment verified"}

@router.post("/verify/{order_id}", response_model=schemas.PaymentStatusResponse)
def verify_payment_status(
    order_id: UUID,
    request: schemas.PaymentCallbackRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Verify payment status for a specific order and update it.
    This is called by frontend after returning from Iyzico.
    """
    order_query = select(Order).where(
        Order.id == order_id,
        Order.user_id == current_user.id
    )
    order = db.execute(order_query).scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Verify
    result = payment_service.verify_payment(request.token)
    
    if result.get("status") == "success":
        if order.status == OrderStatus.PENDING:
            order.status = OrderStatus.PAID
            db.add(order)
            db.commit()
            db.refresh(order)
    
    return {
        "status": result.get("status"),
        "payment_id": result.get("paymentId"),
        "error_message": result.get("errorMessage")
    }
