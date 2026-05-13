# BiblioMind Social — Backend Implementation Plan

> **Purpose**: Pathfinder document for implementing the backend of the community-based social media feature.
> **Date**: 2026-05-04
> **Tech Stack**: FastAPI, SQLAlchemy, PostgreSQL, Pydantic v2

---

## 1. ARCHITECTURE OVERVIEW

```
Frontend (Next.js)                    Backend (FastAPI)
─────────────────                    ─────────────────
social/page.tsx          ──→  GET    /api/communities/feed
communities/page.tsx     ──→  GET    /api/communities/
communities/[id]/page    ──→  GET    /api/communities/{id}
communities/create/page  ──→  POST   /api/communities/
PostCard.tsx             ──→  POST   /api/communities/posts/{id}/like
PostComposer.tsx         ──→  POST   /api/communities/{id}/posts
SocialSidebar.tsx        ──→  GET    /api/communities/my
SocialRightPanel.tsx     ──→  GET    /api/communities/activity
```

**Key Decision**: New router at `/api/communities` — does NOT conflict with existing `/api/social` (Book Buddy).

---

## 2. DATABASE TABLES (10 new tables)

### 2.1 `communities`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| name | VARCHAR(100) | NOT NULL | |
| description | TEXT | NOT NULL | Max 500 chars enforced in schema |
| profile_photo_url | VARCHAR(500) | nullable | Path to uploaded file |
| banner_photo_url | VARCHAR(500) | nullable | Path to uploaded file |
| category_tags | ARRAY(String) | nullable | e.g., ["Fantasy", "Classics"] |
| privacy | VARCHAR(10) | NOT NULL, default "public" | "public" or "private" |
| website | VARCHAR(500) | nullable | |
| location | VARCHAR(255) | nullable | |
| creator_id | UUID | FK → users.id, NOT NULL | |
| member_count | INTEGER | default 0 | Denormalized counter |
| post_count | INTEGER | default 0 | Denormalized counter |
| created_at | TIMESTAMP(tz) | NOT NULL | |
| updated_at | TIMESTAMP(tz) | NOT NULL | |

**Indexes**: creator_id, name (for search)

---

### 2.2 `community_members`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| community_id | UUID | FK → communities.id ON DELETE CASCADE |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| role | VARCHAR(20) | NOT NULL, default "member" |
| joined_at | TIMESTAMP(tz) | NOT NULL |

**Unique constraint**: (community_id, user_id)
**Valid roles**: "creator", "admin", "moderator", "member"
**Role hierarchy**: creator > admin > moderator > member

---

### 2.3 `community_rules`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| community_id | UUID | FK → communities.id ON DELETE CASCADE |
| order_index | INTEGER | NOT NULL |
| rule_text | TEXT | NOT NULL |

---

### 2.4 `community_related_books`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| community_id | UUID | FK → communities.id ON DELETE CASCADE |
| book_title | VARCHAR(500) | NOT NULL |
| book_author | VARCHAR(255) | nullable |

---

### 2.5 `community_posts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| community_id | UUID | FK → communities.id ON DELETE CASCADE |
| author_id | UUID | FK → users.id ON DELETE CASCADE |
| content | TEXT | NOT NULL |
| image_url | VARCHAR(500) | nullable |
| like_count | INTEGER | default 0 |
| comment_count | INTEGER | default 0 |
| save_count | INTEGER | default 0 |
| created_at | TIMESTAMP(tz) | NOT NULL |

**Indexes**: community_id, author_id, created_at DESC

---

### 2.6 `post_comments`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| post_id | UUID | FK → community_posts.id ON DELETE CASCADE |
| author_id | UUID | FK → users.id ON DELETE CASCADE |
| content | TEXT | NOT NULL |
| like_count | INTEGER | default 0 |
| created_at | TIMESTAMP(tz) | NOT NULL |

---

### 2.7 `post_likes`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| post_id | UUID | FK → community_posts.id ON DELETE CASCADE |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| created_at | TIMESTAMP(tz) | NOT NULL |

**Unique constraint**: (post_id, user_id) — one like per user per post

---

### 2.8 `comment_likes`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| comment_id | UUID | FK → post_comments.id ON DELETE CASCADE |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| created_at | TIMESTAMP(tz) | NOT NULL |

**Unique constraint**: (comment_id, user_id)

---

### 2.9 `post_saves`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| post_id | UUID | FK → community_posts.id ON DELETE CASCADE |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| created_at | TIMESTAMP(tz) | NOT NULL |

**Unique constraint**: (post_id, user_id)

---

### 2.10 `community_activities`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| community_id | UUID | FK → communities.id ON DELETE CASCADE, nullable |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| action | VARCHAR(50) | NOT NULL |
| target | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP(tz) | NOT NULL |

**Example rows**:
- action="joined", target="Lord of the Rings Lovers"
- action="posted in", target="Potterheads United"
- action="liked a post in", target="Dune Universe"

---

## 3. PYDANTIC SCHEMAS

**File**: `app/schemas/community.py`

### Request Schemas

| Schema | Fields | Used By |
|--------|--------|---------|
| `CommunityCreate` | name (str, required), description (str, required, max 500), category_tags (list[str], optional), privacy ("public"/"private", default "public"), rules (list[str], optional), related_books (list[{title, author}], optional), website (str, optional), location (str, optional) | POST /api/communities/ |
| `CommunityUpdate` | Same as Create but all optional | PUT /api/communities/{id} |
| `PostCreate` | content (str, required) | POST /api/communities/{id}/posts |
| `CommentCreate` | content (str, required) | POST /api/communities/posts/{id}/comments |
| `MemberRoleUpdate` | role (str: "admin"/"moderator"/"member") | PUT /api/communities/{id}/members/{uid}/role |

### Response Schemas

| Schema | Fields |
|--------|--------|
| `CommunityResponse` | id, name, description, profile_photo_url, banner_photo_url, category_tags, privacy, rules (list[str]), related_books (list[{title, author}]), website, location, creator_id, creator_name, member_count, post_count, created_at, **is_member** (bool), **is_creator** (bool) |
| `CommunityListResponse` | communities (list[CommunityResponse]), total (int) |
| `CommunityMemberResponse` | user_id, full_name, avatar_url, role, joined_at |
| `MemberListResponse` | members (list[CommunityMemberResponse]), total |
| `PostResponse` | id, community_id, community_name, author_id, author_name, author_avatar, author_role, content, image_url, created_at, likes (int), comments (list[CommentResponse]), saves (int), **is_liked** (bool), **is_saved** (bool) |
| `PostListResponse` | posts (list[PostResponse]), total |
| `CommentResponse` | id, author_id, author_name, author_avatar, content, created_at, likes (int), **is_liked** (bool) |
| `ActivityResponse` | id, user_id, user_name, user_avatar, action, target, timestamp (str, e.g. "3 min ago") |
| `ActivityListResponse` | activities (list[ActivityResponse]) |
| `ToggleResponse` | toggled (bool — new state), count (int — new total) |

---

## 4. API ENDPOINTS (22 endpoints)

**File**: `app/api/communities.py`
**Router prefix**: `/api/communities`
**All endpoints require**: `current_user: User = Depends(get_current_user)`

### 4.1 Community CRUD

| # | Method | Path | Description | Request Body | Response | Permission |
|---|--------|------|-------------|-------------|----------|------------|
| 1 | POST | `/` | Create community | Multipart form: JSON fields + profile_photo (file) + banner_photo (file) | CommunityResponse (201) | Any authenticated user |
| 2 | GET | `/` | List/search communities | Query: search?, tags? (comma-sep), privacy?, page=1, limit=20 | CommunityListResponse | Any authenticated |
| 3 | GET | `/my` | Get user's joined communities | — | CommunityListResponse | Any authenticated |
| 4 | GET | `/{community_id}` | Get community detail | — | CommunityResponse | Any authenticated |
| 5 | PUT | `/{community_id}` | Update community | Multipart form: JSON fields + optional photo files | CommunityResponse | Creator or Admin |
| 6 | DELETE | `/{community_id}` | Delete community | — | {"message": "..."} | Creator only |

### 4.2 Membership

| # | Method | Path | Description | Request Body | Response | Permission |
|---|--------|------|-------------|-------------|----------|------------|
| 7 | POST | `/{community_id}/join` | Join community | — | {"message": "Joined", "member_count": int} (201) | Any auth (public only) |
| 8 | POST | `/{community_id}/leave` | Leave community | — | {"message": "Left", "member_count": int} | Any member (not creator) |
| 9 | GET | `/{community_id}/members` | List members | Query: page=1, limit=20 | MemberListResponse | Any authenticated |
| 10 | PUT | `/{community_id}/members/{user_id}/role` | Change member role | MemberRoleUpdate | CommunityMemberResponse | Creator or Admin |
| 11 | DELETE | `/{community_id}/members/{user_id}` | Remove/kick member | — | {"message": "..."} | Moderator+ (cannot kick higher role) |

### 4.3 Posts

| # | Method | Path | Description | Request Body | Response | Permission |
|---|--------|------|-------------|-------------|----------|------------|
| 12 | POST | `/{community_id}/posts` | Create post | Multipart: content (str) + image (file, optional) | PostResponse (201) | Members only |
| 13 | GET | `/{community_id}/posts` | List community posts | Query: page=1, limit=20 | PostListResponse | Any authenticated |
| 14 | DELETE | `/{community_id}/posts/{post_id}` | Delete post | — | {"message": "..."} | Author or Moderator+ |

### 4.4 Feed

| # | Method | Path | Description | Response |
|---|--------|------|-------------|----------|
| 15 | GET | `/feed` | Aggregated feed (posts from all user's communities) | PostListResponse. Query: page=1, limit=20. Ordered by created_at DESC |

### 4.5 Post Interactions

| # | Method | Path | Description | Response |
|---|--------|------|-------------|----------|
| 16 | POST | `/posts/{post_id}/like` | Toggle like | ToggleResponse |
| 17 | POST | `/posts/{post_id}/save` | Toggle save | ToggleResponse |
| 18 | GET | `/posts/{post_id}/comments` | Get comments | list[CommentResponse]. Query: page, limit |
| 19 | POST | `/posts/{post_id}/comments` | Add comment | CommentResponse (201). Body: CommentCreate |
| 20 | DELETE | `/posts/{post_id}/comments/{comment_id}` | Delete comment | {"message": "..."} |

### 4.6 Comment Interactions

| # | Method | Path | Description | Response |
|---|--------|------|-------------|----------|
| 21 | POST | `/comments/{comment_id}/like` | Toggle comment like | ToggleResponse |

### 4.7 Activity

| # | Method | Path | Description | Response |
|---|--------|------|-------------|----------|
| 22 | GET | `/activity` | Recent activity from user's communities | ActivityListResponse. Query: limit=20 |

---

## 5. SERVICE LAYER

**File**: `app/services/community_service.py`
**Class**: `CommunityService(db: Session)`

### 5.1 Community Methods

| Method | Parameters | Returns | Logic |
|--------|-----------|---------|-------|
| `create_community` | creator_id, data (CommunityCreate), profile_url, banner_url | Community | Insert Community row. Insert CommunityMember(role="creator"). Insert CommunityRule rows (from data.rules). Insert CommunityRelatedBook rows. Set member_count=1. Log activity "created a community" |
| `get_community` | community_id, current_user_id | dict | Query community + join CommunityMember to compute is_member, is_creator. Include rules, related_books, creator_name |
| `list_communities` | search, tags, privacy, page, limit, current_user_id | list[dict] | Filter by ILIKE on name/description, array overlap on category_tags, privacy. For each, compute is_member |
| `get_my_communities` | user_id | list[dict] | JOIN community_members WHERE user_id. Return community list |
| `update_community` | community_id, user_id, data, profile_url, banner_url | Community | Verify creator/admin role. Update fields. Replace rules (delete old, insert new). Replace related_books |
| `delete_community` | community_id, user_id | bool | Verify creator role. CASCADE delete handles all child rows |

### 5.2 Membership Methods

| Method | Parameters | Returns | Logic |
|--------|-----------|---------|-------|
| `join_community` | community_id, user_id | dict | Check community exists. Check not already member. If private → raise 403 "Invite only". Insert CommunityMember(role="member"). Increment member_count. Log activity "joined" |
| `leave_community` | community_id, user_id | dict | Check is member. Check is NOT creator (creators can't leave). Delete member row. Decrement member_count. Log activity "left" |
| `get_members` | community_id, page, limit | list[dict] | JOIN users. Order by: creator first, then admin, moderator, member. Include full_name, role, joined_at |
| `update_member_role` | community_id, actor_id, target_user_id, new_role | CommunityMember | Verify actor is creator (for admin promotion) or creator/admin (for moderator). Cannot change creator role. Cannot change own role |
| `remove_member` | community_id, actor_id, target_user_id | bool | Verify actor role > target role. Cannot remove creator. Delete member row. Decrement member_count |
| `check_role` | community_id, user_id | str or None | Query CommunityMember. Return role or None if not member |

### 5.3 Post Methods

| Method | Parameters | Returns | Logic |
|--------|-----------|---------|-------|
| `create_post` | community_id, author_id, content, image_url | CommunityPost | Verify author is member. Insert post. Increment community.post_count. Log activity "posted in" |
| `get_community_posts` | community_id, current_user_id, page, limit | list[dict] | Paginate by created_at DESC. For each post: join users for author_name, check CommunityMember for author_role, LEFT JOIN post_likes for is_liked, LEFT JOIN post_saves for is_saved. Include recent comments (last 3) |
| `get_feed_posts` | user_id, page, limit | list[dict] | Get all community_ids where user is member. Query posts WHERE community_id IN (...). Same enrichment as above. Order by created_at DESC |
| `delete_post` | post_id, user_id, community_id | bool | Verify author OR moderator+. CASCADE deletes comments/likes/saves. Decrement community.post_count |

### 5.4 Interaction Methods

| Method | Parameters | Returns | Logic |
|--------|-----------|---------|-------|
| `toggle_post_like` | post_id, user_id | dict {toggled, count} | Check if PostLike exists. If yes → DELETE, decrement like_count, return {false, count}. If no → INSERT, increment, return {true, count} |
| `toggle_post_save` | post_id, user_id | dict {toggled, count} | Same pattern with PostSave and save_count |
| `toggle_comment_like` | comment_id, user_id | dict {toggled, count} | Same pattern with CommentLike |
| `create_comment` | post_id, user_id, content | PostComment | Verify user is member of the post's community. Insert comment. Increment post.comment_count. Log activity "commented in" |
| `get_comments` | post_id, current_user_id, page, limit | list[dict] | Paginate. For each: join users for author_name, LEFT JOIN comment_likes for is_liked |
| `delete_comment` | comment_id, user_id | bool | Verify author OR moderator+ in the post's community. Delete. Decrement post.comment_count |

### 5.5 Activity Methods

| Method | Parameters | Returns | Logic |
|--------|-----------|---------|-------|
| `log_activity` | community_id, user_id, action, target | CommunityActivity | Insert activity row |
| `get_recent_activity` | user_id, limit | list[dict] | Get user's community_ids. Query activities WHERE community_id IN (...). Join users for user_name. Order by created_at DESC. Convert created_at to relative time string ("3 min ago") |

### 5.6 Image Upload Helper

| Method | Parameters | Returns | Logic |
|--------|-----------|---------|-------|
| `save_upload` | file (UploadFile), directory, filename | str (url) | Validate image (PIL). Save to `static/uploads/{directory}/{filename}`. Return URL path `/static/uploads/{directory}/{filename}` |

---

## 6. FILE CHANGES SUMMARY

### New Backend Files (4)

| File | Content |
|------|---------|
| `app/models/community.py` | 10 SQLAlchemy models (Section 2) |
| `app/schemas/community.py` | ~15 Pydantic schemas (Section 3) |
| `app/services/community_service.py` | CommunityService class with ~20 methods (Section 5) |
| `app/api/communities.py` | 22 FastAPI endpoints (Section 4) |

### Modified Backend Files (3)

| File | Change |
|------|--------|
| `app/models/__init__.py` | Add imports for all 10 new models |
| `app/schemas/__init__.py` | Add imports for new community schemas |
| `app/api/__init__.py` | Add: `from app.api import communities` + `api_router.include_router(communities.router, prefix="/communities", tags=["Communities"])` |
| `app/main.py` | Add: `os.makedirs("static/uploads/communities", exist_ok=True)` and `os.makedirs("static/uploads/posts", exist_ok=True)` |

### Modified Frontend Files (8)

| File | Change |
|------|--------|
| `social/page.tsx` | Replace MOCK_POSTS → `api.get("/communities/feed")`, MOCK_RECENT_ACTIVITY → `api.get("/communities/activity")` |
| `social/communities/page.tsx` | Replace MOCK_COMMUNITIES → `api.get("/communities/")`. Wire join button → `api.post("/communities/{id}/join")` |
| `social/communities/[id]/page.tsx` | Replace mock find → `api.get("/communities/{id}")`. Posts → `api.get("/communities/{id}/posts")`. Members → `api.get("/communities/{id}/members")`. Join/leave → `api.post(...)` |
| `social/communities/create/page.tsx` | Replace `setTimeout` → `api.post("/communities/", formData)` with multipart/form-data |
| `PostCard.tsx` | Wire like → `api.post("/communities/posts/{id}/like")`. Save → `api.post("/communities/posts/{id}/save")`. Comment → `api.post("/communities/posts/{id}/comments")` |
| `PostComposer.tsx` | Wire → `api.post("/communities/{id}/posts", formData)` |
| `SocialSidebar.tsx` | Replace MOCK_COMMUNITIES filter → `api.get("/communities/my")` |
| `SocialRightPanel.tsx` | Replace MOCK_RECENT_ACTIVITY → `api.get("/communities/activity")` |

---

## 7. IMPLEMENTATION ORDER

### Phase 1: Database Models
1. Create `app/models/community.py` with all 10 models
2. Update `app/models/__init__.py` to import them
3. Restart backend → tables auto-created by `Base.metadata.create_all`
4. Verify tables exist in PostgreSQL

### Phase 2: Schemas
5. Create `app/schemas/community.py` with all request/response schemas
6. Update `app/schemas/__init__.py`

### Phase 3: Service Layer
7. Create `app/services/community_service.py`
8. Implement community CRUD methods first
9. Implement membership methods
10. Implement post methods
11. Implement interaction methods (like/save/comment)
12. Implement activity methods

### Phase 4: API Endpoints
13. Create `app/api/communities.py`
14. Register router in `app/api/__init__.py`
15. Add upload directories in `app/main.py`
16. Implement community CRUD endpoints (1-6)
17. Implement membership endpoints (7-11)
18. Implement post endpoints (12-14)
19. Implement feed endpoint (15)
20. Implement interaction endpoints (16-21)
21. Implement activity endpoint (22)
22. Test all endpoints via Swagger UI at `/docs`

### Phase 5: Frontend Integration
23. Update `SocialSidebar.tsx` (simplest — just one GET call)
24. Update `SocialRightPanel.tsx` (one GET call)
25. Update `social/communities/page.tsx` (list + join)
26. Update `social/communities/create/page.tsx` (multipart POST)
27. Update `social/communities/[id]/page.tsx` (detail + tabs)
28. Update `PostCard.tsx` (like/save/comment interactions)
29. Update `PostComposer.tsx` (post creation)
30. Update `social/page.tsx` (feed + highlights)

### Phase 6: Testing
31. Full flow test: create → join → post → like → comment → leave
32. Role management test: promote → demote → kick
33. Privacy test: private community join rejected
34. Image upload test: profile, banner, post images
35. Feed test: only shows posts from joined communities

---

## 8. IMAGE STORAGE

| Type | Save Path | URL Pattern |
|------|-----------|-------------|
| Community profile | `static/uploads/communities/{community_id}_profile.jpg` | `/static/uploads/communities/{id}_profile.jpg` |
| Community banner | `static/uploads/communities/{community_id}_banner.jpg` | `/static/uploads/communities/{id}_banner.jpg` |
| Post image | `static/uploads/posts/{post_id}.jpg` | `/static/uploads/posts/{id}.jpg` |

**Upload flow**: Frontend sends `multipart/form-data` → FastAPI receives `UploadFile` → validate with PIL → save to disk → store URL path in DB.

---

## 9. ROLE-BASED ACCESS CONTROL

```
Creator (highest)
  ├── Can delete community
  ├── Can promote/demote any role
  ├── Can remove any member
  ├── All Admin permissions
  │
  Admin
  │ ├── Can update community info
  │ ├── Can promote members to moderator
  │ ├── Can remove moderators and members
  │ ├── All Moderator permissions
  │
  Moderator
  │ ├── Can delete any post in community
  │ ├── Can delete any comment in community
  │ ├── Can remove members
  │ ├── All Member permissions
  │
  Member (lowest)
    ├── Can create posts
    ├── Can comment on posts
    ├── Can like/save posts
    └── Can leave community
```

---

## 10. FRONTEND API CALL PATTERNS

All calls use the existing `api.ts` Axios instance (baseURL: `http://localhost:8000/api`).

**JSON endpoints**:
```
api.get("/communities/")
api.get("/communities/my")
api.get("/communities/{id}")
api.get("/communities/{id}/posts")
api.get("/communities/{id}/members")
api.get("/communities/feed")
api.get("/communities/activity")
api.get("/communities/posts/{id}/comments")
api.post("/communities/posts/{id}/like")
api.post("/communities/posts/{id}/save")
api.post("/communities/{id}/join")
api.post("/communities/{id}/leave")
api.delete("/communities/{id}")
api.delete("/communities/{id}/members/{uid}")
api.delete("/communities/{id}/posts/{pid}")
api.delete("/communities/posts/{pid}/comments/{cid}")
api.post("/communities/comments/{cid}/like")
api.put("/communities/{id}/members/{uid}/role", { role })
```

**Multipart endpoints** (override Content-Type):
```
// Create community with images
const formData = new FormData();
formData.append("data", JSON.stringify({name, description, ...}));
formData.append("profile_photo", file);
formData.append("banner_photo", file);
api.post("/communities/", formData, { headers: { "Content-Type": "multipart/form-data" } })

// Create post with image
const formData = new FormData();
formData.append("content", text);
formData.append("image", file);
api.post("/communities/{id}/posts", formData, { headers: { "Content-Type": "multipart/form-data" } })
```
