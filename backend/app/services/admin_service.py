"""Admin service for dashboard and management operations."""

from typing import Optional, List, Dict, Tuple
from uuid import UUID
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from fastapi import HTTPException, status

from app.models.user import User
from app.models.book import Book
from app.models.order import Order, OrderItem
from app.schemas.admin import OrderStatusUpdate


class AdminService:
    """Service class for admin operations."""
    
    @staticmethod
    def get_dashboard_stats(db: Session) -> dict:
        """
        Get dashboard statistics.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with dashboard stats
        """
        # Total users
        total_users = db.query(func.count(User.id)).scalar() or 0
        
        # Total books
        total_books = db.query(func.count(Book.id)).scalar() or 0
        
        # Total orders
        total_orders = db.query(func.count(Order.id)).scalar() or 0
        
        # Total revenue (sum of all PAID and DELIVERED orders)
        total_revenue = db.query(
            func.coalesce(func.sum(Order.total_price), 0)
        ).filter(
            Order.status.in_(["PAID", "SHIPPED", "DELIVERED"])
        ).scalar() or Decimal("0.00")
        
        # Orders by status
        orders_by_status_query = db.query(
            Order.status,
            func.count(Order.id)
        ).group_by(Order.status).all()
        
        orders_by_status = {
            status: count for status, count in orders_by_status_query
        }
        
        # Ensure all statuses are present (even if 0)
        all_statuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]
        for status_name in all_statuses:
            if status_name not in orders_by_status:
                orders_by_status[status_name] = 0
        
        return {
            "total_users": total_users,
            "total_books": total_books,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "orders_by_status": orders_by_status
        }
    
    @staticmethod
    def get_all_users(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None
    ) -> Tuple[List[dict], int]:
        """
        Get all users with pagination and search.
        
        Args:
            db: Database session
            page: Page number (1-indexed)
            page_size: Items per page
            search: Search term (email or name)
            
        Returns:
            Tuple of (users list, total count)
        """
        # Base query
        query = db.query(User)
        
        # Search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (User.email.ilike(search_term)) |
                (User.full_name.ilike(search_term))
            )
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        users = query.order_by(desc(User.created_at)).offset(offset).limit(page_size).all()
        
        # Get order stats for each user
        user_list = []
        for user in users:
            # Count orders for this user
            total_orders = db.query(func.count(Order.id)).filter(
                Order.user_id == user.id
            ).scalar() or 0
            
            # Total spent (PAID, SHIPPED, DELIVERED orders only)
            total_spent = db.query(
                func.coalesce(func.sum(Order.total_price), 0)
            ).filter(
                Order.user_id == user.id,
                Order.status.in_(["PAID", "SHIPPED", "DELIVERED"])
            ).scalar() or Decimal("0.00")
            
            user_list.append({
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_admin": user.is_admin,
                "created_at": user.created_at,
                "total_orders": total_orders,
                "total_spent": total_spent
            })
        
        return user_list, total
    
    @staticmethod
    def get_user_details(db: Session, user_id: UUID) -> dict:
        """
        Get detailed user information.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User details dictionary
            
        Raises:
            HTTPException: If user not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get order stats
        total_orders = db.query(func.count(Order.id)).filter(
            Order.user_id == user.id
        ).scalar() or 0
        
        total_spent = db.query(
            func.coalesce(func.sum(Order.total_price), 0)
        ).filter(
            Order.user_id == user.id,
            Order.status.in_(["PAID", "SHIPPED", "DELIVERED"])
        ).scalar() or Decimal("0.00")
        
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin,
            "created_at": user.created_at,
            "total_orders": total_orders,
            "total_spent": total_spent
        }
    
    @staticmethod
    def get_all_orders(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status_filter: Optional[str] = None
    ) -> Tuple[List[dict], int]:
        """
        Get all orders with pagination and filtering.
        
        Args:
            db: Database session
            page: Page number (1-indexed)
            page_size: Items per page
            status_filter: Filter by order status
            
        Returns:
            Tuple of (orders list, total count)
        """
        # Base query
        query = db.query(Order)
        
        # Status filter
        if status_filter:
            query = query.filter(Order.status == status_filter.upper())
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        orders = query.order_by(desc(Order.created_at)).offset(offset).limit(page_size).all()
        
        # Build response
        order_list = []
        for order in orders:
            # Get user email
            user = db.query(User).filter(User.id == order.user_id).first()
            user_email = user.email if user else None
            
            # Count items
            items_count = db.query(func.count(OrderItem.id)).filter(
                OrderItem.order_id == order.id
            ).scalar() or 0
            
            order_list.append({
                "id": order.id,
                "user_id": order.user_id,
                "user_email": user_email,
                "status": order.status,
                "total_price": order.total_price,
                "shipping_address": order.shipping_address,
                "notes": order.notes,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "items_count": items_count
            })
        
        return order_list, total
    
    @staticmethod
    def get_order_detail(db: Session, order_id: UUID) -> dict:
        """
        Get detailed order information.
        
        Args:
            db: Database session
            order_id: Order ID
            
        Returns:
            Order details with items
            
        Raises:
            HTTPException: If order not found
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Get user email
        user = db.query(User).filter(User.id == order.user_id).first()
        user_email = user.email if user else None
        
        # Get order items
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        
        items_list = []
        for item in order_items:
            # Get book info
            book = db.query(Book).filter(Book.id == item.book_id).first()
            
            items_list.append({
                "id": item.id,
                "book_id": item.book_id,
                "book_title": book.title if book else None,
                "book_author": book.author if book else None,
                "quantity": item.quantity,
                "price": item.price
            })
        
        return {
            "id": order.id,
            "user_id": order.user_id,
            "user_email": user_email,
            "status": order.status,
            "total_price": order.total_price,
            "shipping_address": order.shipping_address,
            "notes": order.notes,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "items_count": len(items_list),
            "items": items_list
        }
    
    @staticmethod
    def update_order_status(
        db: Session,
        order_id: UUID,
        status_update: OrderStatusUpdate
    ) -> dict:
        """
        Update order status.
        
        Args:
            db: Database session
            order_id: Order ID
            status_update: New status
            
        Returns:
            Updated order
            
        Raises:
            HTTPException: If order not found or invalid status
        """
        # Validate status
        valid_statuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]
        new_status = status_update.status.upper()
        
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Get order
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Update status
        order.status = new_status
        db.commit()
        db.refresh(order)
        
        # Return updated order detail
        return AdminService.get_order_detail(db, order_id)
    
    @staticmethod
    def get_recent_orders(db: Session, limit: int = 10) -> List[dict]:
        """
        Get recent orders for dashboard.
        
        Args:
            db: Database session
            limit: Number of recent orders
            
        Returns:
            List of recent orders
        """
        orders = db.query(Order).order_by(desc(Order.created_at)).limit(limit).all()
        
        result = []
        for order in orders:
            # Get user email
            user = db.query(User).filter(User.id == order.user_id).first()
            user_email = user.email if user else "Unknown"
            
            result.append({
                "id": order.id,
                "user_email": user_email,
                "total_price": order.total_price,
                "status": order.status,
                "created_at": order.created_at
            })
        
        return result
    
    @staticmethod
    def get_top_selling_books(db: Session, limit: int = 5) -> List[dict]:
        """
        Get top selling books.
        
        Args:
            db: Database session
            limit: Number of top books
            
        Returns:
            List of top selling books
        """
        # Query to get book sales
        top_books = db.query(
            OrderItem.book_id,
            func.sum(OrderItem.quantity).label('total_sold'),
            func.sum(OrderItem.price * OrderItem.quantity).label('total_revenue')
        ).join(
            Order,
            Order.id == OrderItem.order_id
        ).filter(
            Order.status.in_(["PAID", "SHIPPED", "DELIVERED"])
        ).group_by(
            OrderItem.book_id
        ).order_by(
            desc('total_sold')
        ).limit(limit).all()
        
        result = []
        for book_id, total_sold, total_revenue in top_books:
            # Get book info
            book = db.query(Book).filter(Book.id == book_id).first()
            
            if book:
                result.append({
                    "book_id": book.id,
                    "title": book.title,
                    "author": book.author,
                    "total_sold": int(total_sold or 0),
                    "total_revenue": Decimal(total_revenue or 0)
                })
        
        return result
