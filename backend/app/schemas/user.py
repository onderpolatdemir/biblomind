"""User schemas for profile and preferences management."""

from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID


class UserPreferences(BaseModel):
    """User preferences for personalized recommendations."""
    favorite_genres: List[str] = Field(default_factory=list, description="List of favorite book genres")
    favorite_authors: List[str] = Field(default_factory=list, description="List of favorite authors")
    
    class Config:
        from_attributes = True


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences."""
    favorite_genres: Optional[List[str]] = Field(None, description="Update favorite genres")
    favorite_authors: Optional[List[str]] = Field(None, description="Update favorite authors")
    
    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile information."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255, description="User's full name")
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User response schema (basic info)."""
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    is_admin: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserWithPreferences(UserResponse):
    """User response with preferences included."""
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    
    class Config:
        from_attributes = True


class InteractionCreate(BaseModel):
    """Schema for creating a user interaction."""
    book_id: UUID
    interaction_type: str = Field(..., description="Type: view, like, cart, purchase")
    
    class Config:
        from_attributes = True


class InteractionResponse(BaseModel):
    """User interaction response."""
    id: UUID
    user_id: UUID
    book_id: UUID
    interaction_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True
