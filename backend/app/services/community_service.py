"""Service layer for the community social feature."""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.community import (
    Community, CommunityMember, CommunityRule, CommunityRelatedBook,
    CommunityPost, PostComment, PostLike, CommentLike, PostSave, CommunityActivity,
    CommunityJoinRequest,
)
from app.models.user import User
from app.schemas.community import CommunityCreate, CommunityUpdate, PostCreate, CommentCreate

logger = logging.getLogger(__name__)

ROLE_ORDER = {"creator": 4, "admin": 3, "moderator": 2, "member": 1}


def _role_rank(role: Optional[str]) -> int:
    return ROLE_ORDER.get(role or "", 0)


def _relative_time(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    diff = now - dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else now - dt
    secs = int(diff.total_seconds())
    if secs < 60:
        return "just now"
    if secs < 3600:
        return f"{secs // 60} min ago"
    if secs < 86400:
        return f"{secs // 3600}h ago"
    return f"{secs // 86400}d ago"


async def save_upload(file: UploadFile, directory: str, filename: str) -> str:
    """Validate and save an uploaded image to local disk."""
    allowed = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WebP images allowed")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
    path = os.path.join("static", "uploads", directory, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(contents)
    return f"/static/uploads/{directory}/{filename}"


class CommunityService:
    def __init__(self, db: Session):
        self.db = db

    # ── helpers ────────────────────────────────────────────────────────────────

    def _get_community_or_404(self, community_id: UUID) -> Community:
        c = self.db.query(Community).filter(Community.id == community_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Community not found")
        return c

    def _get_member_role(self, community_id: UUID, user_id: UUID) -> Optional[str]:
        m = self.db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == user_id
        ).first()
        return m.role if m else None

    def _require_role(self, community_id: UUID, user_id: UUID, min_role: str):
        role = self._get_member_role(community_id, user_id)
        if _role_rank(role) < _role_rank(min_role):
            raise HTTPException(status_code=403, detail="Insufficient permissions")

    def _log_activity(self, community_id: Optional[UUID], user_id: UUID, action: str, target: str):
        activity = CommunityActivity(
            community_id=community_id,
            user_id=user_id,
            action=action,
            target=target,
        )
        self.db.add(activity)

    def _get_join_request_status(self, community_id: UUID, user_id: UUID) -> Optional[str]:
        req = self.db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.community_id == community_id,
            CommunityJoinRequest.user_id == user_id,
        ).first()
        return req.status if req else None

    def _format_community(self, community: Community, current_user_id: UUID) -> Dict[str, Any]:
        role = self._get_member_role(community.id, current_user_id)
        join_request_status = None
        if role is None and community.privacy == "private":
            join_request_status = self._get_join_request_status(community.id, current_user_id)
        return {
            "id": community.id,
            "name": community.name,
            "description": community.description,
            "profile_photo_url": community.profile_photo_url,
            "banner_photo_url": community.banner_photo_url,
            "category_tags": community.category_tags or [],
            "privacy": community.privacy,
            "rules": [r.rule_text for r in community.rules],
            "related_books": [{"title": b.book_title, "author": b.book_author} for b in community.related_books],
            "website": community.website,
            "location": community.location,
            "creator_id": community.creator_id,
            "creator_name": community.creator.full_name if community.creator else None,
            "member_count": community.member_count,
            "post_count": community.post_count,
            "created_at": community.created_at,
            "is_member": role is not None,
            "is_creator": role == "creator",
            "user_role": role,
            "join_request_status": join_request_status,
        }

    def _format_post(self, post: CommunityPost, current_user_id: UUID, include_comments: bool = True) -> Dict[str, Any]:
        is_liked = self.db.query(PostLike).filter(
            PostLike.post_id == post.id, PostLike.user_id == current_user_id
        ).first() is not None
        is_saved = self.db.query(PostSave).filter(
            PostSave.post_id == post.id, PostSave.user_id == current_user_id
        ).first() is not None
        author_role = self._get_member_role(post.community_id, post.author_id)
        comments = []
        if include_comments:
            raw_comments = self.db.query(PostComment).filter(
                PostComment.post_id == post.id
            ).order_by(PostComment.created_at.asc()).limit(3).all()
            comments = [self._format_comment(c, current_user_id) for c in raw_comments]
        return {
            "id": post.id,
            "community_id": post.community_id,
            "community_name": post.community.name if post.community else None,
            "author_id": post.author_id,
            "author_name": post.author.full_name if post.author else None,
            "author_username": post.author.username if post.author else None,
            "author_avatar": post.author.avatar_url if post.author else None,
            "author_role": author_role,
            "content": post.content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "likes": post.like_count,
            "like_count": post.like_count,
            "comment_count": post.comment_count,
            "comments": comments,
            "saves": post.save_count,
            "save_count": post.save_count,
            "is_liked": is_liked,
            "is_saved": is_saved,
            "is_mine": post.author_id == current_user_id,
        }

    def _format_comment(self, comment: PostComment, current_user_id: UUID) -> Dict[str, Any]:
        is_liked = self.db.query(CommentLike).filter(
            CommentLike.comment_id == comment.id, CommentLike.user_id == current_user_id
        ).first() is not None
        return {
            "id": comment.id,
            "author_id": comment.author_id,
            "author_name": comment.author.full_name if comment.author else None,
            "author_username": comment.author.username if comment.author else None,
            "author_avatar": comment.author.avatar_url if comment.author else None,
            "content": comment.content,
            "created_at": comment.created_at,
            "likes": comment.like_count,
            "is_liked": is_liked,
        }

    # ── community CRUD ─────────────────────────────────────────────────────────

    def create_community(
        self,
        creator_id: UUID,
        data: CommunityCreate,
        profile_url: Optional[str] = None,
        banner_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        community = Community(
            name=data.name,
            description=data.description,
            privacy=data.privacy,
            category_tags=data.category_tags,
            website=data.website,
            location=data.location,
            creator_id=creator_id,
            profile_photo_url=profile_url,
            banner_photo_url=banner_url,
            member_count=1,
        )
        self.db.add(community)
        self.db.flush()

        # Creator membership
        self.db.add(CommunityMember(community_id=community.id, user_id=creator_id, role="creator"))

        # Rules
        for i, rule_text in enumerate(data.rules or []):
            self.db.add(CommunityRule(community_id=community.id, order_index=i, rule_text=rule_text))

        # Related books
        for book in data.related_books or []:
            self.db.add(CommunityRelatedBook(
                community_id=community.id, book_title=book.title, book_author=book.author
            ))

        self._log_activity(community.id, creator_id, "created a community", community.name)
        self.db.commit()
        self.db.refresh(community)
        return self._format_community(community, creator_id)

    def get_community(self, community_id: UUID, current_user_id: UUID) -> Dict[str, Any]:
        community = self._get_community_or_404(community_id)
        return self._format_community(community, current_user_id)

    def list_communities(
        self,
        search: Optional[str],
        tags: Optional[str],
        privacy: Optional[str],
        page: int,
        limit: int,
        current_user_id: UUID,
    ) -> Dict[str, Any]:
        query = self.db.query(Community)
        if search:
            query = query.filter(
                or_(
                    Community.name.ilike(f"%{search}%"),
                    Community.description.ilike(f"%{search}%"),
                )
            )
        if privacy:
            query = query.filter(Community.privacy == privacy)
        total = query.count()
        communities = query.offset((page - 1) * limit).limit(limit).all()
        return {
            "communities": [self._format_community(c, current_user_id) for c in communities],
            "total": total,
        }

    def get_my_communities(self, user_id: UUID) -> Dict[str, Any]:
        memberships = self.db.query(CommunityMember).filter(
            CommunityMember.user_id == user_id
        ).all()
        communities = [
            self._format_community(m.community, user_id)
            for m in memberships
            if m.community
        ]
        return {"communities": communities, "total": len(communities)}

    def update_community(
        self,
        community_id: UUID,
        user_id: UUID,
        data: CommunityUpdate,
        profile_url: Optional[str] = None,
        banner_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        community = self._get_community_or_404(community_id)
        self._require_role(community_id, user_id, "admin")

        update_data = data.model_dump(exclude_none=True, exclude={"rules", "related_books"})
        for key, value in update_data.items():
            setattr(community, key, value)
        if profile_url:
            community.profile_photo_url = profile_url
        if banner_url:
            community.banner_photo_url = banner_url

        if data.rules is not None:
            for r in community.rules:
                self.db.delete(r)
            for i, rule_text in enumerate(data.rules):
                self.db.add(CommunityRule(community_id=community.id, order_index=i, rule_text=rule_text))

        if data.related_books is not None:
            for b in community.related_books:
                self.db.delete(b)
            for book in data.related_books:
                self.db.add(CommunityRelatedBook(
                    community_id=community.id, book_title=book.title, book_author=book.author
                ))

        self.db.commit()
        self.db.refresh(community)
        return self._format_community(community, user_id)

    def delete_community(self, community_id: UUID, user_id: UUID):
        community = self._get_community_or_404(community_id)
        self._require_role(community_id, user_id, "creator")
        self.db.delete(community)
        self.db.commit()

    # ── membership ─────────────────────────────────────────────────────────────

    def join_community(self, community_id: UUID, user_id: UUID) -> Dict[str, Any]:
        community = self._get_community_or_404(community_id)
        existing_role = self._get_member_role(community_id, user_id)
        if existing_role:
            raise HTTPException(status_code=400, detail="Already a member")

        if community.privacy == "private":
            existing_req = self.db.query(CommunityJoinRequest).filter(
                CommunityJoinRequest.community_id == community_id,
                CommunityJoinRequest.user_id == user_id,
            ).first()
            if existing_req:
                if existing_req.status == "pending":
                    raise HTTPException(status_code=400, detail="Join request already pending")
                if existing_req.status == "rejected":
                    raise HTTPException(status_code=403, detail="Your join request was rejected")
                # approved but not member yet — shouldn't happen, but handle gracefully
                existing_req.status = "pending"
            else:
                req = CommunityJoinRequest(community_id=community_id, user_id=user_id)
                self.db.add(req)
                self.db.flush()
                self._create_join_request_notification(community, user_id, req.id)
            self.db.commit()
            return {"message": "Join request sent", "status": "pending"}

        self.db.add(CommunityMember(community_id=community_id, user_id=user_id, role="member"))
        community.member_count = (community.member_count or 0) + 1
        self._log_activity(community_id, user_id, "joined", community.name)
        self.db.commit()
        return {"message": "Joined successfully", "member_count": community.member_count}

    def approve_join_request(self, community_id: UUID, request_id: UUID, actor_id: UUID) -> Dict[str, Any]:
        from app.models.notification import Notification

        self._require_role(community_id, actor_id, "admin")
        req = self.db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.id == request_id,
            CommunityJoinRequest.community_id == community_id,
        ).first()
        if not req:
            raise HTTPException(status_code=404, detail="Join request not found")
        # Always delete the notification regardless of current status
        self.db.query(Notification).filter(
            Notification.entity_id == request_id,
            Notification.type == "community_join_request",
        ).delete(synchronize_session=False)

        if req.status != "pending":
            self.db.commit()
            return {"message": "Already processed", "user_id": str(req.user_id)}

        req.status = "approved"
        already = self._get_member_role(community_id, req.user_id)
        community = self._get_community_or_404(community_id)
        if not already:
            self.db.add(CommunityMember(community_id=community_id, user_id=req.user_id, role="member"))
            community.member_count = (community.member_count or 0) + 1
            self._log_activity(community_id, req.user_id, "joined", community.name)

        # Notify the requester of approval
        self.db.add(Notification(
            user_id=req.user_id,
            actor_id=actor_id,
            type="community_join_approved",
            entity_id=community_id,
            message=f"Your request to join {community.name} has been approved.",
        ))

        self.db.commit()
        return {"message": "Request approved", "user_id": str(req.user_id)}

    def approve_join_request_by_id(self, request_id: UUID, actor_id: UUID) -> Dict[str, Any]:
        req = self.db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.id == request_id,
        ).first()
        if not req:
            raise HTTPException(status_code=404, detail="Join request not found")
        return self.approve_join_request(req.community_id, request_id, actor_id)

    def reject_join_request_by_id(self, request_id: UUID, actor_id: UUID) -> Dict[str, Any]:
        req = self.db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.id == request_id,
        ).first()
        if not req:
            raise HTTPException(status_code=404, detail="Join request not found")
        return self.reject_join_request(req.community_id, request_id, actor_id)

    def reject_join_request(self, community_id: UUID, request_id: UUID, actor_id: UUID) -> Dict[str, Any]:
        from app.models.notification import Notification

        self._require_role(community_id, actor_id, "admin")
        req = self.db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.id == request_id,
            CommunityJoinRequest.community_id == community_id,
        ).first()
        if not req:
            raise HTTPException(status_code=404, detail="Join request not found")
        # Always delete the notification regardless of current status
        self.db.query(Notification).filter(
            Notification.entity_id == request_id,
            Notification.type == "community_join_request",
        ).delete(synchronize_session=False)

        if req.status != "pending":
            self.db.commit()
            return {"message": "Already processed", "user_id": str(req.user_id)}

        req.status = "rejected"

        # Notify the requester of rejection
        community = self._get_community_or_404(community_id)
        self.db.add(Notification(
            user_id=req.user_id,
            actor_id=actor_id,
            type="community_join_rejected",
            entity_id=community_id,
            message=f"Your request to join {community.name} was not approved.",
        ))

        self.db.commit()
        return {"message": "Request rejected", "user_id": str(req.user_id)}

    def leave_community(self, community_id: UUID, user_id: UUID) -> Dict[str, Any]:
        community = self._get_community_or_404(community_id)
        role = self._get_member_role(community_id, user_id)
        if role is None:
            raise HTTPException(status_code=400, detail="Not a member")
        if role == "creator":
            raise HTTPException(status_code=400, detail="Creator cannot leave the community")
        self.db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == user_id
        ).delete()
        community.member_count = max(0, (community.member_count or 1) - 1)
        self._log_activity(community_id, user_id, "left", community.name)
        self.db.commit()
        return {"message": "Left successfully", "member_count": community.member_count}

    def get_members(self, community_id: UUID, page: int, limit: int) -> Dict[str, Any]:
        self._get_community_or_404(community_id)
        members_q = self.db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id
        )
        total = members_q.count()
        members = members_q.offset((page - 1) * limit).limit(limit).all()
        result = []
        for m in members:
            result.append({
                "user_id": m.user_id,
                "full_name": m.user.full_name if m.user else None,
                "username": m.user.username if m.user else None,
                "avatar_url": m.user.avatar_url if m.user else None,
                "role": m.role,
                "joined_at": m.joined_at,
            })
        result.sort(key=lambda x: _role_rank(x["role"]), reverse=True)
        return {"members": result, "total": total}

    def update_member_role(
        self, community_id: UUID, actor_id: UUID, target_user_id: UUID, new_role: str
    ) -> Dict[str, Any]:
        actor_role = self._get_member_role(community_id, actor_id)
        target_role = self._get_member_role(community_id, target_user_id)
        if target_role is None:
            raise HTTPException(status_code=404, detail="Target user is not a member")
        if target_role == "creator":
            raise HTTPException(status_code=403, detail="Cannot change creator role")
        if _role_rank(actor_role) <= _role_rank(target_role):
            raise HTTPException(status_code=403, detail="Cannot change role of equal or higher rank")
        member = self.db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == target_user_id
        ).first()
        member.role = new_role
        self.db.commit()
        return {
            "user_id": member.user_id,
            "full_name": member.user.full_name if member.user else None,
            "username": member.user.username if member.user else None,
            "avatar_url": member.user.avatar_url if member.user else None,
            "role": member.role,
            "joined_at": member.joined_at,
        }

    def remove_member(self, community_id: UUID, actor_id: UUID, target_user_id: UUID):
        actor_role = self._get_member_role(community_id, actor_id)
        target_role = self._get_member_role(community_id, target_user_id)
        if target_role is None:
            raise HTTPException(status_code=404, detail="Target user is not a member")
        if target_role == "creator":
            raise HTTPException(status_code=403, detail="Cannot remove the creator")
        if _role_rank(actor_role) <= _role_rank(target_role):
            raise HTTPException(status_code=403, detail="Cannot remove equal or higher rank member")
        self.db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == target_user_id
        ).delete()
        community = self._get_community_or_404(community_id)
        community.member_count = max(0, (community.member_count or 1) - 1)
        self.db.commit()

    # ── posts ──────────────────────────────────────────────────────────────────

    def create_post(
        self, community_id: UUID, author_id: UUID, content: str, image_url: Optional[str] = None
    ) -> Dict[str, Any]:
        community = self._get_community_or_404(community_id)
        self._require_role(community_id, author_id, "member")
        post = CommunityPost(
            community_id=community_id,
            author_id=author_id,
            content=content,
            image_url=image_url,
        )
        self.db.add(post)
        community.post_count = (community.post_count or 0) + 1
        self.db.flush()
        self._log_activity(community_id, author_id, "posted in", community.name)
        self.db.commit()
        self.db.refresh(post)
        return self._format_post(post, author_id)

    def get_community_posts(
        self, community_id: UUID, current_user_id: UUID, page: int, limit: int
    ) -> Dict[str, Any]:
        community = self._get_community_or_404(community_id)
        if community.privacy == "private":
            role = self._get_member_role(community_id, current_user_id)
            if role is None:
                raise HTTPException(status_code=403, detail="Join this community to see posts")
        query = self.db.query(CommunityPost).filter(
            CommunityPost.community_id == community_id
        ).order_by(CommunityPost.created_at.desc())
        total = query.count()
        posts = query.offset((page - 1) * limit).limit(limit).all()
        return {
            "posts": [self._format_post(p, current_user_id) for p in posts],
            "total": total,
        }

    def get_feed_posts(self, user_id: UUID, page: int, limit: int) -> Dict[str, Any]:
        community_ids = [
            m.community_id for m in
            self.db.query(CommunityMember).filter(CommunityMember.user_id == user_id).all()
        ]
        if not community_ids:
            return {"posts": [], "total": 0}
        query = self.db.query(CommunityPost).filter(
            CommunityPost.community_id.in_(community_ids)
        ).order_by(CommunityPost.created_at.desc())
        total = query.count()
        posts = query.offset((page - 1) * limit).limit(limit).all()
        return {
            "posts": [self._format_post(p, user_id) for p in posts],
            "total": total,
        }

    def delete_post(self, community_id: UUID, post_id: UUID, user_id: UUID):
        post = self.db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        role = self._get_member_role(community_id, user_id)
        if post.author_id != user_id and _role_rank(role) < _role_rank("moderator"):
            raise HTTPException(status_code=403, detail="Not allowed to delete this post")
        community = self._get_community_or_404(community_id)
        community.post_count = max(0, (community.post_count or 1) - 1)
        self.db.delete(post)
        self.db.commit()

    # ── post interactions ──────────────────────────────────────────────────────

    def toggle_post_like(self, post_id: UUID, user_id: UUID) -> Dict[str, Any]:
        post = self.db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        existing = self.db.query(PostLike).filter(
            PostLike.post_id == post_id, PostLike.user_id == user_id
        ).first()
        if existing:
            self.db.delete(existing)
            post.like_count = max(0, post.like_count - 1)
            toggled = False
        else:
            self.db.add(PostLike(post_id=post_id, user_id=user_id))
            post.like_count = post.like_count + 1
            toggled = True
            # Create notification for post author
            if post.author_id != user_id:
                self._create_post_like_notification(post, user_id)
        self.db.commit()
        return {"toggled": toggled, "count": post.like_count}

    def toggle_post_save(self, post_id: UUID, user_id: UUID) -> Dict[str, Any]:
        post = self.db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        existing = self.db.query(PostSave).filter(
            PostSave.post_id == post_id, PostSave.user_id == user_id
        ).first()
        if existing:
            self.db.delete(existing)
            post.save_count = max(0, post.save_count - 1)
            toggled = False
        else:
            self.db.add(PostSave(post_id=post_id, user_id=user_id))
            post.save_count = post.save_count + 1
            toggled = True
        self.db.commit()
        return {"toggled": toggled, "count": post.save_count}

    def get_comments(
        self, post_id: UUID, current_user_id: UUID, page: int, limit: int
    ) -> List[Dict[str, Any]]:
        post = self.db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        comments = self.db.query(PostComment).filter(
            PostComment.post_id == post_id
        ).order_by(PostComment.created_at.asc()).offset((page - 1) * limit).limit(limit).all()
        return [self._format_comment(c, current_user_id) for c in comments]

    def create_comment(
        self, post_id: UUID, user_id: UUID, content: str
    ) -> Dict[str, Any]:
        post = self.db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        self._require_role(post.community_id, user_id, "member")
        comment = PostComment(post_id=post_id, author_id=user_id, content=content)
        self.db.add(comment)
        post.comment_count = post.comment_count + 1
        self.db.flush()
        self._log_activity(post.community_id, user_id, "commented in", post.community.name if post.community else "")
        # Notification for post author
        if post.author_id != user_id:
            self._create_comment_notification(post, user_id)
        self.db.commit()
        self.db.refresh(comment)
        return self._format_comment(comment, user_id)

    def delete_comment(self, post_id: UUID, comment_id: UUID, user_id: UUID):
        comment = self.db.query(PostComment).filter(PostComment.id == comment_id).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        post = self.db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        role = self._get_member_role(post.community_id, user_id)
        if comment.author_id != user_id and _role_rank(role) < _role_rank("moderator"):
            raise HTTPException(status_code=403, detail="Not allowed to delete this comment")
        post.comment_count = max(0, post.comment_count - 1)
        self.db.delete(comment)
        self.db.commit()

    def toggle_comment_like(self, comment_id: UUID, user_id: UUID) -> Dict[str, Any]:
        comment = self.db.query(PostComment).filter(PostComment.id == comment_id).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        existing = self.db.query(CommentLike).filter(
            CommentLike.comment_id == comment_id, CommentLike.user_id == user_id
        ).first()
        if existing:
            self.db.delete(existing)
            comment.like_count = max(0, comment.like_count - 1)
            toggled = False
        else:
            self.db.add(CommentLike(comment_id=comment_id, user_id=user_id))
            comment.like_count = comment.like_count + 1
            toggled = True
        self.db.commit()
        return {"toggled": toggled, "count": comment.like_count}

    # ── activity ───────────────────────────────────────────────────────────────

    def get_recent_activity(self, user_id: UUID, limit: int) -> Dict[str, Any]:
        community_ids = [
            m.community_id for m in
            self.db.query(CommunityMember).filter(CommunityMember.user_id == user_id).all()
        ]
        if not community_ids:
            return {"activities": []}
        activities = self.db.query(CommunityActivity).filter(
            CommunityActivity.community_id.in_(community_ids)
        ).order_by(CommunityActivity.created_at.desc()).limit(limit).all()
        result = []
        for a in activities:
            result.append({
                "id": a.id,
                "user_id": a.user_id,
                "user_name": a.user.full_name if a.user else None,
                "user_avatar": a.user.avatar_url if a.user else None,
                "community_id": str(a.community_id) if a.community_id else None,
                "community_name": a.community.name if a.community else None,
                "action": a.action,
                "target": a.target,
                "relative_time": _relative_time(a.created_at),
                "timestamp": _relative_time(a.created_at),
            })
        return {"activities": result}

    # ── notification helpers ───────────────────────────────────────────────────

    def _create_join_request_notification(self, community: Community, actor_id: UUID, request_id):
        try:
            from app.models.notification import Notification
            actor = self.db.query(User).filter(User.id == actor_id).first()
            name = actor.full_name or actor.username or "Someone"
            self.db.add(Notification(
                user_id=community.creator_id,
                actor_id=actor_id,
                type="community_join_request",
                entity_id=request_id,
                message=f"{name} wants to join {community.name}",
            ))
        except Exception:
            pass

    def _create_post_like_notification(self, post: CommunityPost, actor_id: UUID):
        try:
            from app.models.notification import Notification
            actor = self.db.query(User).filter(User.id == actor_id).first()
            name = actor.full_name or actor.username or "Someone"
            notif = Notification(
                user_id=post.author_id,
                actor_id=actor_id,
                type="post_like",
                entity_id=post.id,
                message=f"{name} liked your post",
            )
            self.db.add(notif)
        except Exception:
            pass

    def _create_comment_notification(self, post: CommunityPost, actor_id: UUID):
        try:
            from app.models.notification import Notification
            actor = self.db.query(User).filter(User.id == actor_id).first()
            name = actor.full_name or actor.username or "Someone"
            notif = Notification(
                user_id=post.author_id,
                actor_id=actor_id,
                type="post_comment",
                entity_id=post.id,
                message=f"{name} commented on your post",
            )
            self.db.add(notif)
        except Exception:
            pass
