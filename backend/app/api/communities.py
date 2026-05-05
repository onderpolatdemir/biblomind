"""Community API — 22 endpoints for the social communities feature."""

import uuid as uuid_lib
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.community_service import CommunityService, save_upload
from app.schemas.community import (
    CommunityCreate, CommunityUpdate, PostCreate, CommentCreate, MemberRoleUpdate,
    CommunityResponse, CommunityListResponse, CommunityMemberResponse, MemberListResponse,
    PostResponse, PostListResponse, CommentResponse, ToggleResponse, ActivityListResponse,
)

import json

router = APIRouter()


def _get_service(db: Session = Depends(get_db)) -> CommunityService:
    return CommunityService(db)


# ── Community CRUD ─────────────────────────────────────────────────────────────

@router.post("/", response_model=CommunityResponse, status_code=201)
async def create_community(
    data: str = Form(..., description="JSON string of CommunityCreate fields"),
    profile_photo: Optional[UploadFile] = File(None),
    banner_photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    """Create a new community (multipart: JSON data + optional images)."""
    try:
        parsed = CommunityCreate(**json.loads(data))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid data: {e}")

    profile_url = None
    banner_url = None
    temp_id = uuid_lib.uuid4()

    if profile_photo and profile_photo.filename:
        profile_url = await save_upload(profile_photo, "communities", f"{temp_id}_profile.jpg")
    if banner_photo and banner_photo.filename:
        banner_url = await save_upload(banner_photo, "communities", f"{temp_id}_banner.jpg")

    return service.create_community(current_user.id, parsed, profile_url, banner_url)


@router.post("/join-requests/{request_id}/approve")
def approve_join_request_standalone(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.approve_join_request_by_id(request_id, current_user.id)


@router.post("/join-requests/{request_id}/reject")
def reject_join_request_standalone(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.reject_join_request_by_id(request_id, current_user.id)


@router.get("/feed", response_model=PostListResponse)
def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    """Aggregated feed from all communities the user has joined."""
    return service.get_feed_posts(current_user.id, page, limit)


@router.get("/my", response_model=CommunityListResponse)
def get_my_communities(
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    """Get communities the current user has joined."""
    return service.get_my_communities(current_user.id)


@router.get("/activity", response_model=ActivityListResponse)
def get_activity(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    """Recent activity from all communities the user belongs to."""
    return service.get_recent_activity(current_user.id, limit)


@router.get("/", response_model=CommunityListResponse)
def list_communities(
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    privacy: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    """List and search all communities."""
    return service.list_communities(search, tags, privacy, page, limit, current_user.id)


@router.get("/{community_id}", response_model=CommunityResponse)
def get_community(
    community_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.get_community(community_id, current_user.id)


@router.put("/{community_id}", response_model=CommunityResponse)
async def update_community(
    community_id: UUID,
    data: str = Form(...),
    profile_photo: Optional[UploadFile] = File(None),
    banner_photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    try:
        parsed = CommunityUpdate(**json.loads(data))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid data: {e}")

    profile_url = None
    banner_url = None
    if profile_photo and profile_photo.filename:
        profile_url = await save_upload(profile_photo, "communities", f"{community_id}_profile.jpg")
    if banner_photo and banner_photo.filename:
        banner_url = await save_upload(banner_photo, "communities", f"{community_id}_banner.jpg")

    return service.update_community(community_id, current_user.id, parsed, profile_url, banner_url)


@router.delete("/{community_id}", status_code=204)
def delete_community(
    community_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    service.delete_community(community_id, current_user.id)


# ── Membership ─────────────────────────────────────────────────────────────────

@router.post("/{community_id}/join")
def join_community(
    community_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.join_community(community_id, current_user.id)


@router.post("/{community_id}/join-requests/{request_id}/approve")
def approve_join_request(
    community_id: UUID,
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.approve_join_request(community_id, request_id, current_user.id)


@router.post("/{community_id}/join-requests/{request_id}/reject")
def reject_join_request(
    community_id: UUID,
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.reject_join_request(community_id, request_id, current_user.id)


@router.post("/{community_id}/leave")
def leave_community(
    community_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.leave_community(community_id, current_user.id)


@router.get("/{community_id}/members", response_model=MemberListResponse)
def get_members(
    community_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.get_members(community_id, page, limit)


@router.put("/{community_id}/members/{target_user_id}/role", response_model=CommunityMemberResponse)
def update_member_role(
    community_id: UUID,
    target_user_id: UUID,
    body: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.update_member_role(community_id, current_user.id, target_user_id, body.role)


@router.delete("/{community_id}/members/{target_user_id}", status_code=204)
def remove_member(
    community_id: UUID,
    target_user_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    service.remove_member(community_id, current_user.id, target_user_id)


# ── Posts ──────────────────────────────────────────────────────────────────────

@router.post("/{community_id}/posts", response_model=PostResponse, status_code=201)
async def create_post(
    community_id: UUID,
    content: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    image_url = None
    if image and image.filename:
        post_id = uuid_lib.uuid4()
        image_url = await save_upload(image, "posts", f"{post_id}.jpg")
    return service.create_post(community_id, current_user.id, content, image_url)


@router.get("/{community_id}/posts", response_model=PostListResponse)
def get_community_posts(
    community_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.get_community_posts(community_id, current_user.id, page, limit)


@router.delete("/{community_id}/posts/{post_id}", status_code=204)
def delete_post(
    community_id: UUID,
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    service.delete_post(community_id, post_id, current_user.id)


# ── Post interactions ──────────────────────────────────────────────────────────

@router.post("/posts/{post_id}/like", response_model=ToggleResponse)
def toggle_post_like(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.toggle_post_like(post_id, current_user.id)


@router.post("/posts/{post_id}/save", response_model=ToggleResponse)
def toggle_post_save(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.toggle_post_save(post_id, current_user.id)


@router.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
def get_comments(
    post_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.get_comments(post_id, current_user.id, page, limit)


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=201)
def create_comment(
    post_id: UUID,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.create_comment(post_id, current_user.id, body.content)


@router.delete("/posts/{post_id}/comments/{comment_id}", status_code=204)
def delete_comment(
    post_id: UUID,
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    service.delete_comment(post_id, comment_id, current_user.id)


# ── Comment interactions ───────────────────────────────────────────────────────

@router.post("/comments/{comment_id}/like", response_model=ToggleResponse)
def toggle_comment_like(
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(_get_service),
):
    return service.toggle_comment_like(comment_id, current_user.id)
