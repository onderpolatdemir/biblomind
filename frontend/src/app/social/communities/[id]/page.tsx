"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import PostCard from "@/components/social/PostCard";
import PostComposer from "@/components/social/PostComposer";
import { useAuth } from "@/context/AuthContext";
import { Users, Lock, Globe, Trash2, Settings } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";

const BACKEND_URL = "http://localhost:8000";

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

interface Member {
    user_id: string;
    full_name: string;
    username: string | null;
    avatar_url: string | null;
    role: string;
    joined_at: string;
}

interface Community {
    id: string;
    name: string;
    description: string | null;
    privacy: string;
    member_count: number;
    post_count: number;
    category_tags: string[];
    profile_photo_url: string | null;
    banner_photo_url: string | null;
    is_member: boolean;
    is_creator: boolean;
    user_role: string | null;
    rules: string[];
    join_request_status?: "pending" | "approved" | "rejected" | null;
}

type Tab = "posts" | "members" | "about";

export default function CommunityDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const [community, setCommunity] = useState<Community | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [tab, setTab] = useState<Tab>("posts");
    const [isLoading, setIsLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);
    const [membersLoaded, setMembersLoaded] = useState(false);

    const fetchCommunity = useCallback(async () => {
        try {
            const res = await api.get(`/communities/${id}`);
            setCommunity(res.data);
        } catch {
            router.push("/social/communities");
        }
    }, [id, router]);

    const fetchPosts = useCallback(async () => {
        setPostsLoading(true);
        try {
            const res = await api.get(`/communities/${id}/posts`);
            setPosts(res.data.posts ?? []);
        } catch {
            setPosts([]);
        } finally {
            setPostsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        Promise.all([fetchCommunity(), fetchPosts()]).finally(() => setIsLoading(false));
    }, [fetchCommunity, fetchPosts]);

    const fetchMembers = async () => {
        if (membersLoaded) return;
        try {
            const res = await api.get(`/communities/${id}/members`);
            setMembers(res.data.members ?? []);
            setMembersLoaded(true);
        } catch {}
    };

    const handleTabChange = (t: Tab) => {
        setTab(t);
        if (t === "members") fetchMembers();
    };

    const toggleMembership = async () => {
        if (!community) return;
        try {
            if (community.is_member) {
                await api.post(`/communities/${id}/leave`);
                setCommunity((c) => c ? { ...c, is_member: false, user_role: null, member_count: c.member_count - 1 } : c);
            } else {
                const res = await api.post(`/communities/${id}/join`);
                if (res.data?.status === "pending") {
                    setCommunity((c) => c ? { ...c, join_request_status: "pending" } : c);
                } else {
                    setCommunity((c) => c ? { ...c, is_member: true, user_role: "member", member_count: c.member_count + 1 } : c);
                }
            }
        } catch {}
    };

    const deletePost = async (postId: string) => {
        try {
            await api.delete(`/communities/${id}/posts/${postId}`);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
        } catch {}
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 font-body">
                <Header />
                <div className="flex justify-center py-32">
                    <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!community) return null;

    const bannerSrc = community.banner_photo_url
        ? (community.banner_photo_url.startsWith("http") ? community.banner_photo_url : `${BACKEND_URL}${community.banner_photo_url}`)
        : null;

    const profileSrc = community.profile_photo_url
        ? (community.profile_photo_url.startsWith("http") ? community.profile_photo_url : `${BACKEND_URL}${community.profile_photo_url}`)
        : null;

    const canPost = community.is_member;
    const isModerator = ["creator", "admin"].includes(community.user_role ?? "");

    return (
        <div className="min-h-screen bg-gray-50/50 font-body">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Community Header */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                    <div
                        className="h-36 bg-gradient-to-r from-primary/20 to-secondary/40"
                        style={bannerSrc ? { backgroundImage: `url(${bannerSrc})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                    />
                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-10 mb-4">
                            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-primary text-3xl flex-shrink-0">
                                {profileSrc ? <img src={profileSrc} alt={community.name} className="w-full h-full object-cover" /> : community.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold text-gray-900 truncate">{community.name}</h1>
                                    {community.privacy === "private" ? <Lock size={16} className="text-gray-400" /> : <Globe size={16} className="text-gray-400" />}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Users size={14} />{community.member_count} members</span>
                                    <span>{community.post_count} posts</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 pb-1">
                                {community.is_creator && (
                                    <button className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-all">
                                        <Settings size={16} />
                                    </button>
                                )}
                                {!community.is_creator && (
                                    <button
                                        onClick={toggleMembership}
                                        disabled={community.join_request_status === "pending" || community.join_request_status === "rejected"}
                                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:cursor-not-allowed ${
                                            community.is_member
                                                ? "border-2 border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500"
                                                : community.join_request_status === "pending"
                                                    ? "bg-gray-100 text-gray-400 border-2 border-gray-200"
                                                    : community.join_request_status === "rejected"
                                                        ? "bg-red-50 text-red-400 border-2 border-red-200"
                                                        : "bg-primary text-white hover:bg-opacity-90"
                                        }`}
                                    >
                                        {community.is_member
                                            ? "Leave"
                                            : community.join_request_status === "pending"
                                                ? "Request Pending"
                                                : community.join_request_status === "rejected"
                                                    ? "Request Denied"
                                                    : community.privacy === "private"
                                                        ? "Request to Join"
                                                        : "Join"}
                                    </button>
                                )}
                            </div>
                        </div>
                        {community.description && (
                            <p className="text-gray-600 text-sm mb-4">{community.description}</p>
                        )}
                        {community.category_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {community.category_tags.map((tag) => (
                                    <span key={tag} className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t border-gray-100">
                        {(["posts", "members", "about"] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => handleTabChange(t)}
                                className={`flex-1 py-3 text-sm font-bold capitalize transition-colors ${tab === t ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                {tab === "posts" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {community.privacy === "private" && !community.is_member ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
                                <Lock size={44} className="text-gray-200 mx-auto mb-4" />
                                <h3 className="font-bold text-gray-600 mb-2">This community is private</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                    {community.join_request_status === "pending"
                                        ? "Your request is being reviewed by the community creator."
                                        : community.join_request_status === "rejected"
                                            ? "Your join request was not approved."
                                            : "Request to join to view and participate in discussions."}
                                </p>
                            </div>
                        ) : (
                            <>
                                {canPost && (
                                    <PostComposer
                                        communityId={id}
                                        onPost={fetchPosts}
                                        authorInitial={user?.full_name?.charAt(0).toUpperCase() || "U"}
                                    />
                                )}
                                {postsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                                        <p className="text-gray-400">No posts yet.</p>
                                        {canPost && <p className="text-sm text-gray-400 mt-1">Be the first to share something!</p>}
                                    </div>
                                ) : (
                                    posts.map((post) => (
                                        <PostCard key={post.id} post={post} onDelete={deletePost} />
                                    ))
                                )}
                            </>
                        )}
                    </motion.div>
                )}

                {tab === "members" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 text-sm font-bold text-gray-600">
                            {community.member_count} Members
                        </div>
                        <div className="divide-y divide-gray-50">
                            {members.map((m) => {
                                const avatarSrc = m.avatar_url
                                    ? (m.avatar_url.startsWith("http") ? m.avatar_url : `${BACKEND_URL}${m.avatar_url}`)
                                    : null;
                                return (
                                    <div key={m.user_id} className="flex items-center gap-3 px-5 py-3">
                                        <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center font-bold text-text flex-shrink-0">
                                            {avatarSrc ? <img src={avatarSrc} alt={m.full_name} className="w-full h-full object-cover" /> : m.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-800 truncate">{m.full_name}</p>
                                            {m.username && <p className="text-xs text-primary">@{m.username}</p>}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold capitalize ${m.role === "creator" ? "bg-primary/10 text-primary" : m.role === "admin" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                                            {m.role === "moderator" ? "member" : m.role}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {tab === "about" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {community.rules.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Community Rules</h3>
                                <ol className="space-y-3">
                                    {community.rules.map((rule, i) => (
                                        <li key={i} className="flex gap-3 text-sm">
                                            <span className="font-bold text-primary flex-shrink-0">{i + 1}.</span>
                                            <span className="text-gray-600">{rule}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                        {community.description && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h3 className="font-bold text-gray-800 mb-2">About</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{community.description}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
}
