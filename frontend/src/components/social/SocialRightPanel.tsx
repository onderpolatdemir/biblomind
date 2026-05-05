"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Compass } from "lucide-react";
import api from "@/lib/api";
import CommunityCard from "./CommunityCard";

interface ActivityItem {
    id: string;
    action: string;
    community_name: string;
    community_id: string;
    target: string | null;
    relative_time: string;
}

interface Community {
    id: string;
    name: string;
    description: string | null;
    privacy: string;
    member_count: number;
    category_tags: string[];
    profile_photo_url: string | null;
    is_member: boolean;
}

export default function SocialRightPanel() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [suggested, setSuggested] = useState<Community[]>([]);

    useEffect(() => {
        api.get("/communities/activity?limit=5")
            .then((r) => setActivities(r.data.activities ?? []))
            .catch(() => {});

        api.get("/communities/?limit=3")
            .then((r) => setSuggested((r.data.communities ?? []).filter((c: Community) => !c.is_member).slice(0, 3)))
            .catch(() => {});
    }, []);

    return (
        <aside className="w-72 flex-shrink-0 space-y-4">
            {/* Recent Activity */}
            {activities.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-primary" /> Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {activities.map((a) => (
                            <div key={a.id} className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        <span className="font-medium">{a.action}</span>
                                        {a.target && <span className="text-gray-500"> — {a.target}</span>}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        <Link href={`/social/communities/${a.community_id}`} className="hover:underline text-primary">
                                            {a.community_name}
                                        </Link>
                                        {" · "}{a.relative_time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggested Communities */}
            {suggested.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <Compass size={16} className="text-primary" /> Discover
                        </h3>
                        <Link href="/social/communities" className="text-xs text-primary hover:underline">
                            See all
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {suggested.map((c) => (
                            <div key={c.id} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Link href={`/social/communities/${c.id}`} className="text-sm font-medium text-gray-800 hover:text-primary truncate block">
                                        {c.name}
                                    </Link>
                                    <p className="text-xs text-gray-400">{c.member_count} members</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}
