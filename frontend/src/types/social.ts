// ── BiblioMind Social — Type Definitions ──

export type CommunityRole = "creator" | "admin" | "moderator" | "member";
export type CommunityPrivacy = "public" | "private";

export interface CommunityMember {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    role: CommunityRole;
    joined_at: string;
}

export interface Community {
    id: string;
    name: string;
    description: string;
    profile_photo: string;
    banner_photo: string;
    category_tags: string[];
    privacy: CommunityPrivacy;
    rules: string[];
    related_books: { title: string; author: string }[];
    website?: string;
    location?: string;
    creator_id: string;
    creator_name: string;
    member_count: number;
    post_count: number;
    members: CommunityMember[];
    created_at: string;
    is_member?: boolean;
    is_creator?: boolean;
}

export interface PostComment {
    id: string;
    author_id: string;
    author_name: string;
    author_avatar?: string;
    content: string;
    created_at: string;
    likes: number;
    is_liked?: boolean;
}

export interface CommunityPost {
    id: string;
    community_id: string;
    community_name: string;
    author_id: string;
    author_name: string;
    author_avatar?: string;
    author_role: CommunityRole;
    content: string;
    image_url?: string;
    created_at: string;
    likes: number;
    comments: PostComment[];
    saves: number;
    is_liked?: boolean;
    is_saved?: boolean;
}

export interface CreateCommunityForm {
    name: string;
    description: string;
    profile_photo: File | null;
    profile_photo_preview: string;
    banner_photo: File | null;
    banner_photo_preview: string;
    category_tags: string[];
    privacy: CommunityPrivacy;
    rules: string[];
    related_books: { title: string; author: string }[];
    website: string;
    location: string;
}

export interface RecentActivity {
    id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    action: string;
    target: string;
    timestamp: string;
}
