"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { MOCK_COMMUNITIES, MOCK_USER_INTERESTS } from "@/lib/social-mock-data";
import { Users, BookOpen, Star } from "lucide-react";

export default function SocialSidebar() {
    const { user } = useAuth();
    const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U";

    // Communities the user is a member of
    const myCommunities = MOCK_COMMUNITIES.filter((c) => c.is_member);

    return (
        <div className="flex flex-col gap-4">
            {/* ── User Profile Card ── */}
            <div className="social-card p-5">
                {/* Avatar & Stats */}
                <div className="flex flex-col items-center mb-4">
                    <div className="avatar-ring mb-3">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                            style={{
                                backgroundColor: "var(--social-card-elevated)",
                                color: "var(--social-text)",
                            }}
                        >
                            {userInitial}
                        </div>
                    </div>

                    {/* Follower/Following Row */}
                    <div className="flex items-center gap-6 mb-3">
                        <div className="text-center">
                            <p
                                className="text-lg font-bold"
                                style={{ color: "var(--social-text)" }}
                            >
                                128
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: "var(--social-text-muted)" }}
                            >
                                Followers
                            </p>
                        </div>
                        <div className="text-center">
                            <p
                                className="text-lg font-bold"
                                style={{ color: "var(--social-text)" }}
                            >
                                64
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: "var(--social-text-muted)" }}
                            >
                                Following
                            </p>
                        </div>
                    </div>

                    {/* Name & Username */}
                    <h3
                        className="font-bold text-base"
                        style={{ color: "var(--social-text)" }}
                    >
                        {user?.full_name || "User"}
                    </h3>
                    <p
                        className="text-xs mb-3"
                        style={{ color: "var(--social-text-muted)" }}
                    >
                        @{user?.full_name?.toLowerCase().replace(/\s+/g, "") || "user"}
                    </p>

                    {/* Bio */}
                    <p
                        className="text-xs text-center leading-relaxed mb-3"
                        style={{ color: "var(--social-text-secondary)" }}
                    >
                        <Star
                            size={12}
                            className="inline mr-1"
                            style={{ color: "var(--social-accent)" }}
                        />
                        Avid reader & book lover. Always looking for the next great story!
                    </p>

                    {/* My Profile Button */}
                    <button className="social-btn-outline w-full text-sm py-2">
                        My Profile
                    </button>
                </div>
            </div>

            {/* ── Reading Interests ── */}
            <div className="social-card p-4">
                <h4
                    className="font-bold text-sm mb-3 flex items-center gap-2"
                    style={{ color: "var(--social-text)" }}
                >
                    <BookOpen size={14} style={{ color: "var(--social-accent)" }} />
                    Reading Interests
                </h4>
                <div className="flex flex-wrap gap-1.5">
                    {MOCK_USER_INTERESTS.map((interest) => (
                        <span key={interest} className="social-tag text-[11px]">
                            {interest}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── My Communities ── */}
            <div className="social-card p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4
                        className="font-bold text-sm flex items-center gap-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        <Users size={14} style={{ color: "var(--social-accent)" }} />
                        Communities
                    </h4>
                    <Link
                        href="/social/communities"
                        className="text-xs font-semibold"
                        style={{ color: "var(--social-accent)" }}
                    >
                        See all
                    </Link>
                </div>

                <div className="flex flex-col gap-2">
                    {myCommunities.map((community) => (
                        <Link
                            key={community.id}
                            href={`/social/communities/${community.id}`}
                            className="flex items-center gap-3 p-2 rounded-xl transition-all"
                            style={{ color: "var(--social-text-secondary)" }}
                        >
                            <div
                                className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                                style={{
                                    backgroundColor: "var(--social-card-elevated)",
                                }}
                            >
                                {community.profile_photo?.startsWith("/") ? (
                                    <img
                                        src={community.profile_photo}
                                        alt={community.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center text-xs font-bold"
                                        style={{ color: "var(--social-accent)" }}
                                    >
                                        {community.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p
                                    className="text-xs font-semibold truncate"
                                    style={{ color: "var(--social-text)" }}
                                >
                                    {community.name}
                                </p>
                                <p
                                    className="text-[10px]"
                                    style={{ color: "var(--social-text-muted)" }}
                                >
                                    • {community.member_count.toLocaleString()} members
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
