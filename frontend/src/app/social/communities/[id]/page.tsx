"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_COMMUNITIES, MOCK_POSTS } from "@/lib/social-mock-data";
import PostCard from "@/components/social/PostCard";
import PostComposer from "@/components/social/PostComposer";
import {
    Users, MessageSquare, BookOpen, Shield, Globe, Lock,
    ArrowLeft, UserPlus, LogOut, Crown, Star, ChevronRight,
    ExternalLink, MapPin, Calendar
} from "lucide-react";
import Link from "next/link";

type Tab = "posts" | "members" | "about" | "rules";

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export default function CommunityDetailPage() {
    const params = useParams();
    const router = useRouter();
    const communityId = params.id as string;

    const community = MOCK_COMMUNITIES.find((c) => c.id === communityId);
    const communityPosts = MOCK_POSTS.filter((p) => p.community_id === communityId);

    const [activeTab, setActiveTab] = useState<Tab>("posts");
    const [isMember, setIsMember] = useState(community?.is_member ?? false);

    if (!community) {
        return (
            <div className="text-center py-20">
                <p className="text-lg font-bold" style={{ color: "var(--social-text-muted)" }}>
                    Community not found
                </p>
                <Link
                    href="/social/communities"
                    className="social-btn-primary mt-4 inline-block"
                >
                    Browse Communities
                </Link>
            </div>
        );
    }

    const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: "posts", label: "Posts", icon: <MessageSquare size={16} />, count: communityPosts.length },
        { key: "members", label: "Members", icon: <Users size={16} />, count: community.member_count },
        { key: "about", label: "About", icon: <BookOpen size={16} /> },
        { key: "rules", label: "Rules", icon: <Shield size={16} />, count: community.rules.length },
    ];

    const roleIcon = (role: string) => {
        if (role === "creator") return <Crown size={12} style={{ color: "var(--social-accent)" }} />;
        if (role === "admin") return <Star size={12} style={{ color: "#ef4444" }} />;
        if (role === "moderator") return <Shield size={12} style={{ color: "#3b82f6" }} />;
        return null;
    };

    return (
        <div>
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors"
                style={{ color: "var(--social-text-muted)" }}
            >
                <ArrowLeft size={16} />
                Back
            </button>

            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden mb-6">
                <div className="h-48 md:h-64">
                    <img
                        src={community.banner_photo}
                        alt={`${community.name} banner`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                </div>

                {/* Profile Photo + Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
                    <div
                        className="w-20 h-20 rounded-2xl overflow-hidden border-4 flex-shrink-0"
                        style={{
                            borderColor: "var(--social-bg)",
                            backgroundColor: "var(--social-card-elevated)",
                        }}
                    >
                        {community.profile_photo?.startsWith("/") ||
                            community.profile_photo?.startsWith("http") ? (
                            <img
                                src={community.profile_photo}
                                alt={community.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-full flex items-center justify-center text-2xl font-bold"
                                style={{ color: "var(--social-accent)" }}
                            >
                                {community.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h1
                                className="text-2xl font-heading font-bold truncate"
                                style={{ color: "var(--social-text)" }}
                            >
                                {community.name}
                            </h1>
                            <span
                                className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md"
                                style={{
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    color: community.privacy === "private"
                                        ? "var(--social-accent)"
                                        : "var(--social-success)",
                                }}
                            >
                                {community.privacy === "private" ? <Lock size={10} /> : <Globe size={10} />}
                                {community.privacy}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--social-text-muted)" }}>
                                <Users size={12} /> {community.member_count.toLocaleString()} members
                            </span>
                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--social-text-muted)" }}>
                                <MessageSquare size={12} /> {community.post_count} posts
                            </span>
                        </div>
                    </div>

                    {/* Join / Leave */}
                    <div className="flex-shrink-0">
                        {isMember ? (
                            <button
                                onClick={() => setIsMember(false)}
                                className="social-btn-outline flex items-center gap-1.5 text-sm"
                            >
                                <LogOut size={14} />
                                Leave
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsMember(true)}
                                className="social-btn-primary flex items-center gap-1.5 text-sm"
                            >
                                <UserPlus size={14} />
                                Join Community
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-6">
                {community.category_tags.map((tag) => (
                    <span key={tag} className="social-tag text-xs">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Tabs */}
            <div
                className="flex items-center gap-1 mb-6 overflow-x-auto pb-2"
                style={{ borderBottom: "1px solid var(--social-border)" }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap relative"
                        style={{
                            color: activeTab === tab.key
                                ? "var(--social-accent)"
                                : "var(--social-text-muted)",
                            backgroundColor: activeTab === tab.key
                                ? "var(--social-accent-dim)"
                                : "transparent",
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && (
                            <span
                                className="text-[10px] font-bold ml-1 px-1.5 py-0.5 rounded-full"
                                style={{
                                    backgroundColor: activeTab === tab.key
                                        ? "var(--social-accent)"
                                        : "var(--social-border)",
                                    color: activeTab === tab.key
                                        ? "#000"
                                        : "var(--social-text-muted)",
                                }}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* ── Posts Tab ── */}
                    {activeTab === "posts" && (
                        <div className="flex flex-col gap-4">
                            {isMember && (
                                <PostComposer placeholder={`Share something with ${community.name}...`} />
                            )}
                            {communityPosts.length > 0 ? (
                                communityPosts.map((post) => (
                                    <PostCard key={post.id} post={post} showCommunity={false} />
                                ))
                            ) : (
                                <div className="social-card p-8 text-center">
                                    <MessageSquare size={32} className="mx-auto mb-2" style={{ color: "var(--social-text-muted)" }} />
                                    <p className="text-sm" style={{ color: "var(--social-text-muted)" }}>
                                        No posts yet. Be the first to share!
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Members Tab ── */}
                    {activeTab === "members" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {community.members.map((member) => (
                                <div
                                    key={member.user_id}
                                    className="social-card p-4 flex items-center gap-3"
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                        style={{
                                            backgroundColor: "var(--social-card-elevated)",
                                            color: "var(--social-text)",
                                        }}
                                    >
                                        {member.full_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p
                                                className="font-bold text-sm truncate"
                                                style={{ color: "var(--social-text)" }}
                                            >
                                                {member.full_name}
                                            </p>
                                            {roleIcon(member.role)}
                                        </div>
                                        <p className="text-xs capitalize" style={{ color: "var(--social-text-muted)" }}>
                                            {member.role} • Joined {formatDate(member.joined_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── About Tab ── */}
                    {activeTab === "about" && (
                        <div className="social-card p-6 space-y-6">
                            <div>
                                <h3 className="font-bold text-sm mb-2 uppercase tracking-wide" style={{ color: "var(--social-text-muted)" }}>
                                    Description
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--social-text-secondary)" }}>
                                    {community.description}
                                </p>
                            </div>

                            {/* Related Books */}
                            {community.related_books.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-sm mb-3 uppercase tracking-wide" style={{ color: "var(--social-text-muted)" }}>
                                        Related Books
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {community.related_books.map((book, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 p-3 rounded-xl"
                                                style={{ backgroundColor: "var(--social-bg-secondary)" }}
                                            >
                                                <BookOpen size={16} style={{ color: "var(--social-accent)" }} />
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: "var(--social-text)" }}>
                                                        {book.title}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "var(--social-text-muted)" }}>
                                                        {book.author}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--social-text-muted)" }}>
                                    <Calendar size={14} />
                                    Created {formatDate(community.created_at)}
                                </div>
                                {community.location && (
                                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--social-text-muted)" }}>
                                        <MapPin size={14} />
                                        {community.location}
                                    </div>
                                )}
                                {community.website && (
                                    <a
                                        href={community.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm hover:underline"
                                        style={{ color: "var(--social-accent)" }}
                                    >
                                        <ExternalLink size={14} />
                                        Website
                                    </a>
                                )}
                            </div>

                            {/* Creator */}
                            <div>
                                <h3 className="font-bold text-sm mb-2 uppercase tracking-wide" style={{ color: "var(--social-text-muted)" }}>
                                    Created by
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                        style={{
                                            backgroundColor: "var(--social-card-elevated)",
                                            color: "var(--social-accent)",
                                        }}
                                    >
                                        {community.creator_name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: "var(--social-text)" }}>
                                        {community.creator_name}
                                    </span>
                                    <Crown size={12} style={{ color: "var(--social-accent)" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Rules Tab ── */}
                    {activeTab === "rules" && (
                        <div className="social-card p-6">
                            <h3
                                className="font-bold text-base mb-4 flex items-center gap-2"
                                style={{ color: "var(--social-text)" }}
                            >
                                <Shield size={18} style={{ color: "var(--social-accent)" }} />
                                Community Rules
                            </h3>
                            {community.rules.length > 0 ? (
                                <ol className="space-y-3">
                                    {community.rules.map((rule, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 p-3 rounded-xl"
                                            style={{ backgroundColor: "var(--social-bg-secondary)" }}
                                        >
                                            <span
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                style={{
                                                    backgroundColor: "var(--social-accent-dim)",
                                                    color: "var(--social-accent)",
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                            <p className="text-sm" style={{ color: "var(--social-text-secondary)" }}>
                                                {rule}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-sm" style={{ color: "var(--social-text-muted)" }}>
                                    No rules have been set for this community yet.
                                </p>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
