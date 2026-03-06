"""Pydantic schemas for social features (Book Buddy)."""

from pydantic import BaseModel, UUID4
from typing import List, Optional
from datetime import datetime


class BookBuddyMatch(BaseModel):
    """Single book buddy match result."""
    user_id: UUID4
    email: str
    full_name: Optional[str] = None
    compatibility_score: float
    shared_books: int
    total_interactions: int
    
    model_config = {"from_attributes": True}


class BookBuddyListResponse(BaseModel):
    """List of book buddy matches."""
    buddies: List[BookBuddyMatch]
    total: int


class SharedBook(BaseModel):
    """Shared book between users."""
    id: UUID4
    title: str
    author: str
    genres: List[str]
    
    model_config = {"from_attributes": True}


class SharedInterestsResponse(BaseModel):
    """Shared interests between two users."""
    shared_books: List[SharedBook]
    shared_books_count: int
    shared_genres: List[str]
    shared_genres_count: int
    user_total_books: int
    buddy_total_books: int


class BuddyRecommendation(BaseModel):
    """Book recommendation from buddy."""
    id: UUID4
    title: str
    author: str
    genres: List[str]
    description: Optional[str] = None
    price: Optional[float] = None
    interaction_type: str
    buddy_interaction_date: datetime
    
    model_config = {"from_attributes": True}


class BuddyRecommendationsResponse(BaseModel):
    """List of buddy recommendations."""
    recommendations: List[BuddyRecommendation]
    total: int
    buddy_id: UUID4


class ConnectionCreateRequest(BaseModel):
    """Request to create connection with buddy."""
    pass  # No body needed, buddy_id in path


class ConnectionResponse(BaseModel):
    """Connection creation response."""
    connection_id: UUID4
    user_id: UUID4
    buddy_id: UUID4
    compatibility_score: float
    shared_books: int
    shared_genres: int
    status: str
    created_at: datetime
    
    model_config = {"from_attributes": True}


class MyConnectionItem(BaseModel):
    """Single entry in my-connections list."""
    connection_id: UUID4
    user_id: UUID4
    email: str
    full_name: Optional[str] = None
    compatibility_score: float
    shared_books: int
    shared_genres_count: int
    total_interactions: int
    status: str
    connected_at: datetime

    model_config = {"from_attributes": True}


class MyConnectionsResponse(BaseModel):
    """List of current user's connections."""
    connections: List[MyConnectionItem]
    total: int


class BlockResponse(BaseModel):
    """Response after blocking a user."""
    connection_id: UUID4
    blocked_user_id: UUID4
    status: str
    message: str
