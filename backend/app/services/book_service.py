"""Book service for CRUD operations and business logic."""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from uuid import UUID
import math

from app.models.book import Book
from app.schemas.book import BookCreate, BookUpdate


class BookService:
    """Service for book-related operations."""
    
    @staticmethod
    def get_books(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        genre: Optional[str] = None,
        author: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[Book], int]:
        """
        Get paginated and filtered list of books.
        
        Args:
            db: Database session
            page: Page number (1-indexed)
            page_size: Number of items per page
            genre: Filter by genre
            author: Filter by author (partial match)
            min_price: Minimum price filter
            max_price: Maximum price filter
            sort_by: Sort field (title, author, price, created_at)
            sort_order: Sort order (asc, desc)
            
        Returns:
            Tuple of (books list, total count)
        """
        # Base query
        query = db.query(Book)
        
        # Apply filters
        filters = []
        
        if genre:
            filters.append(Book.genres.contains([genre]))
        
        if author:
            filters.append(Book.author.ilike(f"%{author}%"))
        
        if min_price is not None:
            filters.append(Book.price >= min_price)
        
        if max_price is not None:
            filters.append(Book.price <= max_price)
        
        if filters:
            query = query.filter(and_(*filters))
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(Book, sort_by, Book.created_at)
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        books = query.offset(offset).limit(page_size).all()
        
        return books, total
    
    @staticmethod
    def get_book_by_id(db: Session, book_id: UUID) -> Optional[Book]:
        """
        Get a book by ID.
        
        Args:
            db: Database session
            book_id: Book UUID
            
        Returns:
            Book object or None if not found
        """
        return db.query(Book).filter(Book.id == book_id).first()
    
    @staticmethod
    def create_book(db: Session, book_data: BookCreate) -> Book:
        """
        Create a new book (admin only).
        
        Args:
            db: Database session
            book_data: Book creation data
            
        Returns:
            Created book object
        """
        db_book = Book(
            title=book_data.title,
            author=book_data.author,
            isbn=book_data.isbn,
            description=book_data.description,
            price=book_data.price,
            stock=book_data.stock,
            cover_url=book_data.cover_url,
            genres=book_data.genres
        )
        
        db.add(db_book)
        db.commit()
        db.refresh(db_book)
        
        return db_book
    
    @staticmethod
    def update_book(
        db: Session,
        book_id: UUID,
        book_data: BookUpdate
    ) -> Optional[Book]:
        """
        Update a book (admin only).
        
        Args:
            db: Database session
            book_id: Book UUID
            book_data: Book update data
            
        Returns:
            Updated book object or None if not found
        """
        db_book = db.query(Book).filter(Book.id == book_id).first()
        if not db_book:
            return None
        
        # Update only provided fields
        update_data = book_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_book, field, value)
        
        db.commit()
        db.refresh(db_book)
        
        return db_book
    
    @staticmethod
    def delete_book(db: Session, book_id: UUID) -> bool:
        """
        Delete a book (admin only).
        
        Args:
            db: Database session
            book_id: Book UUID
            
        Returns:
            True if deleted, False if not found
        """
        db_book = db.query(Book).filter(Book.id == book_id).first()
        if not db_book:
            return False
        
        db.delete(db_book)
        db.commit()
        
        return True
    
    @staticmethod
    def check_isbn_exists(db: Session, isbn: str, exclude_id: Optional[UUID] = None) -> bool:
        """
        Check if ISBN already exists.
        
        Args:
            db: Database session
            isbn: ISBN to check
            exclude_id: Book ID to exclude from check (for updates)
            
        Returns:
            True if ISBN exists, False otherwise
        """
        query = db.query(Book).filter(Book.isbn == isbn)
        
        if exclude_id:
            query = query.filter(Book.id != exclude_id)
        
        return query.first() is not None
