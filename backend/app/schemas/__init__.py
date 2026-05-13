"""Pydantic schemas for request/response validation."""

from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenRefresh,
)
from app.schemas.book import (
    BookCreate,
    BookUpdate,
    BookResponse,
    BookListResponse,
)
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationTitleUpdate,
)
from app.schemas.social import (
    BookBuddyListResponse,
    SharedInterestsResponse,
    BuddyRecommendationsResponse,
    ConnectionResponse,
)

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "TokenRefresh",
    "BookCreate",
    "BookUpdate",
    "BookResponse",
    "BookListResponse",
    "ChatMessageRequest",
    "ChatMessageResponse",
    "ConversationResponse",
    "ConversationDetailResponse",
    "ConversationListResponse",
    "ConversationTitleUpdate",
    "BookBuddyListResponse",
    "SharedInterestsResponse",
    "BuddyRecommendationsResponse",
    "ConnectionResponse",
]
