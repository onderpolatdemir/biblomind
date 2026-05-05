"""Notification API — polling-based notification system."""

from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the number of unread notifications. Polled every 30s by the frontend."""
    count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).scalar() or 0
    return {"count": count}


@router.get("/")
def get_notifications(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the most recent notifications for the current user."""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(limit).all()

    return [
        {
            "id": str(n.id),
            "type": n.type,
            "message": n.message,
            "is_read": n.is_read,
            "entity_id": str(n.entity_id) if n.entity_id else None,
            "actor_avatar": n.actor.avatar_url if n.actor else None,
            "actor_name": n.actor.full_name or n.actor.username if n.actor else None,
            "actor_username": n.actor.username if n.actor else None,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a single notification (only the owner can delete)."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if notif:
        db.delete(notif)
        db.commit()
    return {"ok": True}


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a single notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"ok": True}


@router.put("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
