"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Bookmark, Trash2, Send } from "lucide-react";
import api from "@/lib/api";

const BACKEND_URL = "http://localhost:8000";

interface Comment {
    id: string;
    content: string;
    author_name: string;
    author_avatar: string | null;
    is_mine: boolean;
    like_count: number;
    created_at: string;
}

interface PostCardProps {
    post: {
        id: string;
        content: string;
        image_url: string | null;
        author_name: string;
        author_avatar: string | null;
        author_username: string | null;
        community_name: string;
        community_id: string;
        is_liked: boolean;
        is_saved: boolean;
        like_count: number;
        comment_count: number;
        save_count: number;
        is_mine: boolean;
        created_at: string;
    };
    onDelete?: (id: string) => void;
    showCommunity?: boolean;
}

export default function PostCard({ post, onDelete, showCommunity = false }: PostCardProps) {
    const [liked, setLiked] = useState(post.is_liked);
    const [saved, setSaved] = useState(post.is_saved);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const [saveCount, setSaveCount] = useState(post.save_count);
    const [commentCount, setCommentCount] = useState(post.comment_count);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoaded, setCommentsLoaded] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const toggleLike = async () => {
        try {
            const res = await api.post(`/communities/posts/${post.id}/like`);
            setLiked(res.data.toggled);
            setLikeCount((n) => (res.data.toggled ? n + 1 : n - 1));
        } catch {}
    };

    const toggleSave = async () => {
        try {
            const res = await api.post(`/communities/posts/${post.id}/save`);
            setSaved(res.data.toggled);
            setSaveCount((n) => (res.data.toggled ? n + 1 : n - 1));
        } catch {}
    };

    const openComments = async () => {
        setShowComments((v) => !v);
        if (!commentsLoaded) {
            try {
                const res = await api.get(`/communities/posts/${post.id}/comments`);
                setComments(res.data ?? []);
                setCommentsLoaded(true);
            } catch {}
        }
    };

    const submitComment = async () => {
        if (!newComment.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/communities/posts/${post.id}/comments`, { content: newComment.trim() });
            setComments((prev) => [res.data, ...prev]);
            setCommentCount((n) => n + 1);
            setNewComment("");
        } catch {
        } finally {
            setSubmitting(false);
        }
    };

    const deleteComment = async (commentId: string) => {
        try {
            await api.delete(`/communities/posts/${post.id}/comments/${commentId}`);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            setCommentCount((n) => n - 1);
        } catch {}
    };

    const imageSrc = post.image_url
        ? post.image_url.startsWith("http")
            ? post.image_url
            : `${BACKEND_URL}${post.image_url}`
        : null;

    const authorAvatarSrc = post.author_avatar
        ? post.author_avatar.startsWith("http")
            ? post.author_avatar
            : `${BACKEND_URL}${post.author_avatar}`
        : null;

    const fmtTime = (iso: string) => {
        const diff = (Date.now() - new Date(iso).getTime()) / 1000;
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-4 pb-2">
                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center font-bold text-text flex-shrink-0">
                    {authorAvatarSrc ? (
                        <img src={authorAvatarSrc} alt={post.author_name} className="w-full h-full object-cover" />
                    ) : (
                        post.author_name?.charAt(0).toUpperCase()
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {post.author_username ? (
                            <Link
                                href={`/profile/${post.author_username}`}
                                className="font-bold text-sm text-gray-800 hover:text-primary transition-colors"
                            >
                                {post.author_name}
                            </Link>
                        ) : (
                            <span className="font-bold text-sm text-gray-800">{post.author_name}</span>
                        )}

                        {showCommunity && (
                            <>
                                <span className="text-gray-400 text-xs">in</span>
                                <Link
                                    href={`/social/communities/${post.community_id}`}
                                    className="text-xs font-medium text-primary hover:underline"
                                >
                                    {post.community_name}
                                </Link>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">{fmtTime(post.created_at)}</p>
                </div>

                {post.is_mine && (
                    <button
                        onClick={() => onDelete?.(post.id)}
                        className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            <div className="px-5 pb-3">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>
            </div>

            {imageSrc && (
                <div className="px-5 pb-3">
                    <img src={imageSrc} alt="post" className="w-full rounded-xl object-cover max-h-80" />
                </div>
            )}

            <div className="px-5 pb-3 flex items-center gap-4 border-t border-gray-50 pt-3">
                <button
                    onClick={toggleLike}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                        liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                    }`}
                >
                    <Heart size={16} className={liked ? "fill-red-500" : ""} />
                    <span className="text-xs">{likeCount}</span>
                </button>

                <button
                    onClick={openComments}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors"
                >
                    <MessageCircle size={16} />
                    <span className="text-xs">{commentCount}</span>
                </button>

                <button
                    onClick={toggleSave}
                    className={`flex items-center gap-1.5 text-sm ml-auto transition-colors ${
                        saved ? "text-primary" : "text-gray-400 hover:text-primary"
                    }`}
                >
                    <Bookmark size={16} className={saved ? "fill-primary" : ""} />
                    <span className="text-xs">{saveCount}</span>
                </button>
            </div>

            {showComments && (
                <div className="border-t border-gray-50 px-5 pb-4 pt-3 space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submitComment()}
                            placeholder="Write a comment..."
                            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors"
                        />
                        <button
                            onClick={submitComment}
                            disabled={!newComment.trim() || submitting}
                            className="p-2 bg-primary text-white rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all"
                        >
                            <Send size={14} />
                        </button>
                    </div>

                    {comments.map((c) => (
                        <div key={c.id} className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-text flex-shrink-0">
                                {c.author_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                                <p className="text-xs font-bold text-gray-700">{c.author_name}</p>
                                <p className="text-xs text-gray-600">{c.content}</p>
                            </div>
                            {c.is_mine && (
                                <button onClick={() => deleteComment(c.id)} className="text-gray-300 hover:text-red-400">
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}