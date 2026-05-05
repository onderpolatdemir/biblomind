"""Notification model for social activity alerts."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)   # recipient
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # who triggered it
    type = Column(String(30), nullable=False)       # post_like | post_comment | buddy_request | buddy_accepted
    entity_id = Column(UUID(as_uuid=True), nullable=True)  # related post/comment/connection ID
    message = Column(String(255), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    recipient = relationship("User", foreign_keys=[user_id])
    actor = relationship("User", foreign_keys=[actor_id])
