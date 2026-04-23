"use client";

import { MOCK_POSTS } from "@/lib/social-mock-data";
import PostCard from "@/components/social/PostCard";
import PostComposer from "@/components/social/PostComposer";
import CommunityHighlights from "@/components/social/CommunityHighlights";

export default function SocialFeedPage() {
    return (
        <div className="flex flex-col gap-5">
            {/* Community Highlights (Story Row) */}
            <div className="social-card p-4">
                <CommunityHighlights />
            </div>

            {/* Post Composer */}
            <PostComposer />

            {/* Feed */}
            <div className="flex flex-col gap-4">
                {MOCK_POSTS.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
}
