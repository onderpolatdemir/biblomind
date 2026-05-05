"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import SocialSidebar from "@/components/social/SocialSidebar";
import SocialRightPanel from "@/components/social/SocialRightPanel";
import PostCard from "@/components/social/PostCard";
import { useAuth } from "@/context/AuthContext";
import { Globe, Plus } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import Link from "next/link";

interface Post {
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
}

export default function SocialPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [notInAnyCommunity, setNotInAnyCommunity] = useState(false);

    const fetchFeed = useCallback(async (pg: number, replace = false) => {
        try {
            const res = await api.get("/communities/feed", { params: { page: pg, limit: 20 } });
            const items: Post[] = res.data.posts ?? [];
            if (items.length === 0 && pg === 1) setNotInAnyCommunity(true);
            setPosts((prev) => replace ? items : [...prev, ...items]);
            setHasMore(items.length === 20);
        } catch {
            setPosts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed(1, true);
    }, [fetchFeed]);

    const deletePost = async (postId: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-body">
            <Header />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="flex gap-6">
                    {/* Left Sidebar */}
                    <SocialSidebar />

                    {/* Center Feed */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-heading font-bold text-gray-900 flex items-center gap-2">
                                <Globe size={22} className="text-primary" /> Social Feed
                            </h1>
                            <Link
                                href="/social/communities/create"
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-opacity-90 transition-all"
                            >
                                <Plus size={14} /> Create Community
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                                ))}
                            </div>
                        ) : notInAnyCommunity ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                                <Globe size={48} className="text-gray-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Your feed is empty</h3>
                                <p className="text-gray-400 mb-6">Join communities to see posts from fellow readers.</p>
                                <Link
                                    href="/social/communities"
                                    className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all"
                                >
                                    Explore Communities →
                                </Link>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} onDelete={deletePost} showCommunity />
                                ))}

                                {hasMore && (
                                    <div className="flex justify-center pt-4">
                                        <button
                                            onClick={() => {
                                                const next = page + 1;
                                                setPage(next);
                                                fetchFeed(next);
                                            }}
                                            className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:border-primary transition-all"
                                        >
                                            Load more
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Right Panel */}
                    <SocialRightPanel />
                </div>
            </main>
        </div>
    );
}
