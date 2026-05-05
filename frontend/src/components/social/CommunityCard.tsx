"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Lock, Globe } from "lucide-react";
import api from "@/lib/api";

const BACKEND_URL = "http://localhost:8000";

interface CommunityCardProps {
    community: {
        id: string;
        name: string;
        description: string | null;
        privacy: string;
        member_count: number;
        category_tags: string[];
        profile_photo_url: string | null;
        is_member: boolean;
        join_request_status?: string | null;
    };
    onJoin?: (id: string) => void;
}

export default function CommunityCard({ community, onJoin }: CommunityCardProps) {
    const [isMember, setIsMember] = useState(community.is_member);
    const [requestStatus, setRequestStatus] = useState<string | null>(community.join_request_status ?? null);
    const [loading, setLoading] = useState(false);

    const handleJoin = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isMember || requestStatus === "pending" || requestStatus === "rejected") return;
        setLoading(true);
        try {
            const res = await api.post(`/communities/${community.id}/join`);
            if (res.data?.status === "pending") {
                setRequestStatus("pending");
            } else {
                setIsMember(true);
                onJoin?.(community.id);
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    const avatarSrc = community.profile_photo_url
        ? (community.profile_photo_url.startsWith("http") ? community.profile_photo_url : `${BACKEND_URL}${community.profile_photo_url}`)
        : null;

    return (
        <Link href={`/social/communities/${community.id}`} className="block group">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
                {/* Icon / Avatar */}
                <div className="h-24 bg-gradient-to-br from-primary/20 to-secondary/40 flex items-center justify-center relative">
                    {avatarSrc ? (
                        <img src={avatarSrc} alt={community.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl font-bold text-primary/40">
                            {community.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                    <div className="absolute top-2 right-2">
                        {community.privacy === "private" ? (
                            <Lock size={14} className="text-gray-500" />
                        ) : (
                            <Globe size={14} className="text-gray-400" />
                        )}
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-1 truncate group-hover:text-primary transition-colors">
                        {community.name}
                    </h3>
                    {community.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{community.description}</p>
                    )}

                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                        <Users size={12} />
                        <span>{community.member_count} members</span>
                    </div>

                    {community.category_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {community.category_tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleJoin}
                        disabled={loading || isMember || requestStatus === "pending" || requestStatus === "rejected"}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed ${
                            isMember
                                ? "bg-green-100 text-green-700"
                                : requestStatus === "pending"
                                    ? "bg-gray-100 text-gray-400"
                                    : requestStatus === "rejected"
                                        ? "bg-red-50 text-red-400"
                                        : "bg-primary text-white hover:bg-opacity-90"
                        }`}
                    >
                        {loading
                            ? "Sending..."
                            : isMember
                                ? "Joined"
                                : requestStatus === "pending"
                                    ? "Request Pending"
                                    : requestStatus === "rejected"
                                        ? "Request Denied"
                                        : community.privacy === "private"
                                            ? "Request to Join"
                                            : "Join Community"}
                    </button>
                </div>
            </div>
        </Link>
    );
}
