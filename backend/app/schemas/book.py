from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, HttpUrl

class BookBase(BaseModel):
    title: str
    author: Optional[str] = None
    isbn: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock: int = 0
    cover_url: Optional[str] = None
    genres: Optional[List[str]] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BookBase):
    title: Optional[str] = None

class Book(BookBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
