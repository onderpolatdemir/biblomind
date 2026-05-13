"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Sparkles } from "lucide-react";
import api from "@/lib/api";

const BACKEND_URL = "http://localhost:8000";

interface MyCommunity {
    id: string;
    name: string;
    profile_photo_url: string | null;
    member_count: number;
}

interface BuddyRecommendation {
    community_id: string;
    community_name: string;
    community_avatar_url: string | null;
    buddy_name: string;
}

export default function SocialSidebar() {
    const [communities, setCommunities] = useState<MyCommunity[]>([]);
    const [recommendations, setRecommendations] = useState<BuddyRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get("/communities/my").catch(() => ({ data: { communities: [] } })),
            api.get("/social/community-recommendations").catch(() => ({ data: { recommendations: [] } }))
        ]).then(([commRes, recRes]) => {
            setCommunities(commRes.data.communities ?? []);
            setRecommendations(recRes.data.recommendations ?? []);
        }).finally(() => setIsLoading(false));
    }, []);

    return (
        <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <Users size={16} className="text-primary" /> My Communities
                    </h3>
                    <Link
                        href="/social/communities/create"
                        className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                        title="Create community"
                    >
                        <Plus size={14} />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : communities.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-xs text-gray-400 mb-3">You haven't joined any communities yet.</p>
                        <Link href="/social/communities" className="text-xs font-bold text-primary hover:underline">
                            Explore Communities →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {communities.map((c) => {
                            const avatarSrc = c.profile_photo_url
                                ? c.profile_photo_url.startsWith("http")
                                    ? c.profile_photo_url
                                    : `${BACKEND_URL}${c.profile_photo_url}`
                                : null;

                            return (
                                <Link
                                    key={c.id}
                                    href={`/social/communities/${c.id}`}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                        {avatarSrc ? (
                                            <img src={avatarSrc} alt={c.name} className="w-full h-full object-cover" />
                                        ) : (
                                            c.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-primary transition-colors">
                                            {c.name}
                                        </p>
                                        <p className="text-[10px] text-gray-400">{c.member_count} members</p>
                                    </div>
                                </Link>
                            );
                        })}

                        <Link
                            href="/social/communities"
                            className="block text-center text-xs font-bold text-primary hover:underline pt-2"
                        >
                            Explore more →
                        </Link>
                    </div>
                )}

                {!isLoading && recommendations.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-4">
                            <Sparkles size={16} className="text-primary" /> Recommended for You
                        </h3>
                        <div className="space-y-1">
                            {recommendations.map((r) => {
                                const avatarSrc = r.community_avatar_url
                                    ? r.community_avatar_url.startsWith("http")
                                        ? r.community_avatar_url
                                        : `${BACKEND_URL}${r.community_avatar_url}`
                                    : null;

                                return (
                                    <Link
                                        key={r.community_id}
                                        href={`/social/communities/${r.community_id}`}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                            {avatarSrc ? (
                                                <img src={avatarSrc} alt={r.community_name} className="w-full h-full object-cover" />
                                            ) : (
                                                r.community_name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate group-hover:text-primary transition-colors">
                                                {r.community_name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 truncate">Because {r.buddy_name} is a member</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}