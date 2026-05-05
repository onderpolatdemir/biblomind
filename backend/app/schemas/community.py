"""Pydantic schemas for the community social feature."""

import json
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# ── Request schemas ────────────────────────────────────────────────────────────

class RelatedBookIn(BaseModel):
    title: str = Field(..., max_length=500)
    author: Optional[str] = Field(None, max_length=255)


class CommunityCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    privacy: str = Field("public", pattern="^(public|private)$")
    category_tags: Optional[List[str]] = None
    rules: Optional[List[str]] = None
    related_books: Optional[List[RelatedBookIn]] = None
    website: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=255)


class CommunityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=500)
    privacy: Optional[str] = Field(None, pattern="^(public|private)$")
    category_tags: Optional[List[str]] = None
    rules: Optional[List[str]] = None
    related_books: Optional[List[RelatedBookIn]] = None
    website: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=255)


class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class MemberRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(admin|member)$")


# ── Response schemas ───────────────────────────────────────────────────────────

class RelatedBookOut(BaseModel):
    title: str
    author: Optional[str] = None

    class Config:
        from_attributes = True


class CommunityResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    profile_photo_url: Optional[str] = None
    banner_photo_url: Optional[str] = None
    category_tags: Optional[List[str]] = None
    privacy: str
    rules: List[str] = []
    related_books: List[RelatedBookOut] = []
    website: Optional[str] = None
    location: Optional[str] = None
    creator_id: UUID
    creator_name: Optional[str] = None
    member_count: int
    post_count: int
    created_at: datetime
    is_member: bool = False
    is_creator: bool = False
    user_role: Optional[str] = None
    join_request_status: Optional[str] = None

    class Config:
        from_attributes = True


class CommunityListResponse(BaseModel):
    communities: List[CommunityResponse]
    total: int


class CommunityMemberResponse(BaseModel):
    user_id: UUID
    full_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True


class MemberListResponse(BaseModel):
    members: List[CommunityMemberResponse]
    total: int


class CommentResponse(BaseModel):
    id: UUID
    author_id: UUID
    author_name: Optional[str] = None
    author_username: Optional[str] = None
    author_avatar: Optional[str] = None
    content: str
    created_at: datetime
    likes: int = 0
    is_liked: bool = False

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: UUID
    community_id: UUID
    community_name: Optional[str] = None
    author_id: UUID
    author_name: Optional[str] = None
    author_username: Optional[str] = None
    author_avatar: Optional[str] = None
    author_role: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    likes: int = 0
    like_count: int = 0
    comments: List[CommentResponse] = []
    comment_count: int = 0
    saves: int = 0
    save_count: int = 0
    is_liked: bool = False
    is_saved: bool = False
    is_mine: bool = False

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int


class ToggleResponse(BaseModel):
    toggled: bool
    count: int


class ActivityResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    community_id: Optional[str] = None
    community_name: Optional[str] = None
    action: str
    target: Optional[str] = None
    relative_time: Optional[str] = None
    timestamp: str

    class Config:
        from_attributes = True


class ActivityListResponse(BaseModel):
    activities: List[ActivityResponse]
