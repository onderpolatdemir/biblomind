"""Book schemas for request/response validation."""

from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class BookBase(BaseModel):
    """Base book schema with common fields."""
    title: str = Field(..., max_length=500, description="Book title")
    author: Optional[str] = Field(None, max_length=255, description="Book author")
    isbn: Optional[str] = Field(None, max_length=13, description="ISBN number")
    description: Optional[str] = Field(None, description="Book description")
    price: Decimal = Field(..., ge=0, description="Book price")
    stock: int = Field(default=0, ge=0, description="Available stock")
    cover_url: Optional[str] = Field(None, description="Cover image URL")
    genres: Optional[List[str]] = Field(None, description="Book genres")


class BookCreate(BookBase):
    """Schema for creating a book (admin only)."""
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "1984",
                "author": "George Orwell",
                "isbn": "9780451524935",
                "description": "A dystopian social science fiction novel...",
                "price": 45.00,
                "stock": 15,
                "cover_url": "https://covers.example.com/1984.jpg",
                "genres": ["Dystopian", "Science Fiction", "Political Fiction"]
            }
        }
    }


class BookUpdate(BaseModel):
    """Schema for updating a book (admin only)."""
    title: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = Field(None, max_length=255)
    isbn: Optional[str] = Field(None, max_length=13)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    cover_url: Optional[str] = None
    genres: Optional[List[str]] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "price": 39.99,
                "stock": 20
            }
        }
    }


class BookResponse(BookBase):
    """Schema for book response."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "title": "1984",
                "author": "George Orwell",
                "isbn": "9780451524935",
                "description": "A dystopian social science fiction novel...",
                "price": 45.00,
                "stock": 15,
                "cover_url": "https://covers.example.com/1984.jpg",
                "genres": ["Dystopian", "Science Fiction"],
                "created_at": "2026-01-10T08:00:00Z",
                "updated_at": "2026-01-10T08:00:00Z"
            }
        }
    }


class BookListResponse(BaseModel):
    """Schema for paginated book list."""
    items: List[BookResponse]
    total: int = Field(..., description="Total number of books")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440001",
                        "title": "1984",
                        "author": "George Orwell",
                        "isbn": "9780451524935",
                        "price": 45.00,
                        "stock": 15,
                        "cover_url": "https://covers.example.com/1984.jpg",
                        "genres": ["Dystopian", "Science Fiction"],
                        "created_at": "2026-01-10T08:00:00Z",
                        "updated_at": "2026-01-10T08:00:00Z"
                    }
                ],
                "total": 150,
                "page": 1,
                "page_size": 20,
                "total_pages": 8
            }
        }
    }
