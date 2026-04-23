"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommunityPost, PostComment } from "@/types/social";
import { Heart, MessageCircle, Send, Bookmark, Share2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? "s" : ""} ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`;
}

function RoleBadge({ role }: { role: string }) {
    if (role === "member") return null;
    const cls =
        role === "creator"
            ? "role-badge role-creator"
            : role === "admin"
                ? "role-badge role-admin"
                : "role-badge role-moderator";
    return <span className={cls}>{role}</span>;
}

interface PostCardProps {
    post: CommunityPost;
    showCommunity?: boolean;
}

export default function PostCard({ post, showCommunity = true }: PostCardProps) {
    const [liked, setLiked] = useState(post.is_liked ?? false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [saved, setSaved] = useState(post.is_saved ?? false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState<PostComment[]>(post.comments);

    const toggleLike = () => {
        setLiked(!liked);
        setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    };

    const addComment = () => {
        if (!commentText.trim()) return;
        const newComment: PostComment = {
            id: `cmt-new-${Date.now()}`,
            author_id: "current",
            author_name: "You",
            content: commentText.trim(),
            created_at: new Date().toISOString(),
            likes: 0,
        };
        setComments([...comments, newComment]);
        setCommentText("");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="social-card overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-start justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                    {/* Author Avatar */}
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                            backgroundColor: "var(--social-card-elevated)",
                            color: "var(--social-text)",
                        }}
                    >
                        {post.author_name.charAt(0)}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className="font-bold text-sm"
                                style={{ color: "var(--social-text)" }}
                            >
                                {post.author_name}
                            </span>
                            <RoleBadge role={post.author_role} />
                        </div>
                        <div className="flex items-center gap-1.5">
                            {showCommunity && (
                                <>
                                    <Link
                                        href={`/social/communities/${post.community_id}`}
                                        className="text-xs font-medium hover:underline"
                                        style={{ color: "var(--social-accent)" }}
                                    >
                                        {post.community_name}
                                    </Link>
                                    <span
                                        className="text-xs"
                                        style={{ color: "var(--social-text-muted)" }}
                                    >
                                        •
                                    </span>
                                </>
                            )}
                            <span
                                className="text-xs"
                                style={{ color: "var(--social-text-muted)" }}
                            >
                                {timeAgo(post.created_at)}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    className="p-1 rounded-lg transition-colors"
                    style={{ color: "var(--social-text-muted)" }}
                >
                    <MoreHorizontal size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--social-text-secondary)" }}
                >
                    {post.content}
                </p>
            </div>

            {/* Image */}
            {post.image_url && (
                <div className="px-4 pb-3">
                    <div className="relative rounded-xl overflow-hidden max-h-[400px]">
                        <img
                            src={post.image_url}
                            alt="Post image"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{ borderColor: "var(--social-border)" }}
            >
                <div className="flex items-center gap-4">
                    {/* Like */}
                    <button
                        onClick={toggleLike}
                        className="flex items-center gap-1.5 text-sm font-medium transition-all group"
                        style={{
                            color: liked ? "var(--social-danger)" : "var(--social-text-muted)",
                        }}
                    >
                        <Heart
                            size={18}
                            fill={liked ? "currentColor" : "none"}
                            className="group-hover:scale-110 transition-transform"
                        />
                        <span>{likeCount}</span>
                    </button>

                    {/* Comment */}
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                        style={{ color: "var(--social-text-muted)" }}
                    >
                        <MessageCircle size={18} />
                        <span>{comments.length}</span>
                    </button>

                    {/* Share */}
                    <button
                        className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                        style={{ color: "var(--social-text-muted)" }}
                    >
                        <Share2 size={18} />
                    </button>
                </div>

                {/* Save */}
                <button
                    onClick={() => setSaved(!saved)}
                    className="social-btn-primary text-xs px-4 py-1.5"
                    style={
                        saved
                            ? {
                                backgroundColor: "var(--social-accent-dim)",
                                color: "var(--social-accent)",
                            }
                            : {}
                    }
                >
                    <Bookmark size={14} className="inline mr-1" fill={saved ? "currentColor" : "none"} />
                    {saved ? "Saved" : "Save"}
                </button>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div
                            className="px-4 py-3 border-t"
                            style={{
                                borderColor: "var(--social-border)",
                                backgroundColor: "rgba(0,0,0,0.2)",
                            }}
                        >
                            {/* Existing Comments */}
                            {comments.length > 0 && (
                                <div className="flex flex-col gap-3 mb-3">
                                    {comments.map((cmt) => (
                                        <div key={cmt.id} className="flex items-start gap-2.5">
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                                style={{
                                                    backgroundColor: "var(--social-card-elevated)",
                                                    color: "var(--social-text)",
                                                }}
                                            >
                                                {cmt.author_name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs">
                                                    <span
                                                        className="font-bold"
                                                        style={{ color: "var(--social-text)" }}
                                                    >
                                                        {cmt.author_name}
                                                    </span>{" "}
                                                    <span
                                                        style={{ color: "var(--social-text-secondary)" }}
                                                    >
                                                        {cmt.content}
                                                    </span>
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span
                                                        className="text-[10px]"
                                                        style={{ color: "var(--social-text-muted)" }}
                                                    >
                                                        {timeAgo(cmt.created_at)}
                                                    </span>
                                                    <span
                                                        className="text-[10px]"
                                                        style={{ color: "var(--social-text-muted)" }}
                                                    >
                                                        ❤ {cmt.likes}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Comment Input */}
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                    style={{
                                        backgroundColor: "var(--social-card-elevated)",
                                        color: "var(--social-text)",
                                    }}
                                >
                                    U
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addComment()}
                                        placeholder="Write your comment.."
                                        className="social-input flex-1 text-xs py-2"
                                    />
                                    <button
                                        onClick={addComment}
                                        disabled={!commentText.trim()}
                                        className="p-2 rounded-lg transition-colors disabled:opacity-30"
                                        style={{ color: "var(--social-accent)" }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
