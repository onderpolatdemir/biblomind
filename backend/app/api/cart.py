import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from app.api import deps
from app.models.cart import Cart, CartItem
from app.models.book import Book
from app.models.user import User
from app.models.user_interaction import UserInteraction
from app.services.recommendation_service import RecommendationService
from app.schemas import cart as schemas

logger = logging.getLogger(__name__)

router = APIRouter()


async def _update_user_vector_background(db: Session, user_id: UUID):
    try:
        rec_service = RecommendationService(db)
        result = await rec_service.update_user_preference_vector(user_id)
        await rec_service.close()
        logger.info(
            f"Cart background task: Vector updated={result['vector_updated']}, "
            f"Interactions processed={result['interactions_processed']}"
        )
    except Exception as e:
        logger.error(f"Cart background vector update failed: {e}")

# Helper function
def _delete_pending_order_if_cart_empty(user_id: UUID, db: Session):
    # 1. Check if cart is empty
    cart_query = select(Cart).where(Cart.user_id == user_id).options(joinedload(Cart.items))
    cart = db.execute(cart_query).scalars().first()
    
    if not cart or not cart.items:
        # Cart is empty, delete any pending order
        from app.models.order import Order, OrderStatus # Local import to avoid circular dependency if any
        
        pending_order_query = select(Order).where(
            Order.user_id == user_id,
            Order.status == OrderStatus.PENDING
        )
        pending_order = db.execute(pending_order_query).scalars().first()
        
        if pending_order:
            db.delete(pending_order)
            db.commit()

@router.get("/", response_model=schemas.Cart)
def get_cart(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get current user's shopping cart.
    Creates a new cart if one doesn't exist.
    """
    # Try to find existing cart
    query = select(Cart).where(Cart.user_id == current_user.id).options(
        joinedload(Cart.items).joinedload(CartItem.book)
    )
    cart = db.execute(query).scalars().first()
    
    # Create if not exists
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    return cart

@router.post("/add", response_model=schemas.Cart)
async def add_to_cart(
    item_in: schemas.CartItemCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Add a book to the cart.
    If book already exists in cart, increments quantity.
    Records a 'cart' interaction for preference vector updates.
    """
    # 1. Get or create cart
    query = select(Cart).where(Cart.user_id == current_user.id)
    cart = db.execute(query).scalars().first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    # 2. Check if book exists
    book_query = select(Book).where(Book.id == item_in.book_id)
    book = db.execute(book_query).scalars().first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
        
    # 3. Check if item already in cart
    item_query = select(CartItem).where(
        CartItem.cart_id == cart.id,
        CartItem.book_id == item_in.book_id
    )
    existing_item = db.execute(item_query).scalars().first()
    
    if existing_item:
        existing_item.quantity += item_in.quantity
        db.add(existing_item)
    else:
        new_item = CartItem(
            cart_id=cart.id,
            book_id=item_in.book_id,
            quantity=item_in.quantity,
            price_at_addition=book.price
        )
        db.add(new_item)
        
    # 4. Record 'cart' interaction if not already exists (for preference vector)
    existing_interaction = db.query(UserInteraction).filter(
        UserInteraction.user_id == current_user.id,
        UserInteraction.book_id == item_in.book_id,
        UserInteraction.interaction_type == "cart"
    ).first()

    if not existing_interaction:
        interaction = UserInteraction(
            user_id=current_user.id,
            book_id=item_in.book_id,
            interaction_type="cart"
        )
        db.add(interaction)

    db.commit()

    # 5. Trigger preference vector update in background
    background_tasks.add_task(
        _update_user_vector_background,
        db=db,
        user_id=current_user.id,
    )

    # 6. Return updated cart with all items loaded
    refresh_query = select(Cart).where(Cart.id == cart.id).options(
        joinedload(Cart.items).joinedload(CartItem.book)
    )
    updated_cart = db.execute(refresh_query).scalars().first()
    return updated_cart

@router.put("/item/{item_id}", response_model=schemas.Cart)
def update_cart_item(
    item_id: UUID,
    item_in: schemas.CartItemUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Update quantity of a specific cart item.
    """
    # Find the item and ensure it belongs to the user's cart
    query = select(CartItem).join(Cart).where(
        CartItem.id == item_id,
        Cart.user_id == current_user.id
    )
    item = db.execute(query).scalars().first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in cart"
        )
        
    item.quantity = item_in.quantity
    db.add(item)
    db.commit()
    
    # Return updated cart
    cart_query = select(Cart).where(Cart.user_id == current_user.id).options(
        joinedload(Cart.items).joinedload(CartItem.book)
    )
    return db.execute(cart_query).scalars().first()

@router.delete("/item/{item_id}", response_model=schemas.Cart)
def remove_from_cart(
    item_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Remove an item from the cart.
    """
    query = select(CartItem).join(Cart).where(
        CartItem.id == item_id,
        Cart.user_id == current_user.id
    )
    item = db.execute(query).scalars().first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in cart"
        )
        
    db.delete(item)
    db.commit()
    
    # Check if cart is empty and delete pending order
    _delete_pending_order_if_cart_empty(current_user.id, db)
    
    # Return updated cart
    cart_query = select(Cart).where(Cart.user_id == current_user.id).options(
        joinedload(Cart.items).joinedload(CartItem.book)
    )
    return db.execute(cart_query).scalars().first()

@router.delete("/clear", response_model=schemas.Cart)
def clear_cart(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Remove all items from the cart.
    """
    # Get user's cart
    cart_query = select(Cart).where(Cart.user_id == current_user.id)
    cart = db.execute(cart_query).scalars().first()
    
    if cart:
        # Delete all items
        stmt = select(CartItem).where(CartItem.cart_id == cart.id)
        items = db.execute(stmt).scalars().all()
        for item in items:
            db.delete(item)
        db.commit()
        db.refresh(cart)
        
    return cart
