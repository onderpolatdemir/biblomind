"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Community } from "@/types/social";
import { Users, Lock, Globe, MessageSquare } from "lucide-react";

interface CommunityCardProps {
    community: Community;
    index?: number;
    onJoin?: (id: string) => void;
}

export default function CommunityCard({ community, index = 0, onJoin }: CommunityCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
        >
            <Link
                href={`/social/communities/${community.id}`}
                className="social-card block overflow-hidden group"
            >
                {/* Banner */}
                <div className="relative h-28 overflow-hidden">
                    <img
                        src={community.banner_photo}
                        alt={`${community.name} banner`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />

                    {/* Privacy Badge */}
                    <div
                        className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold"
                        style={{
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: community.privacy === "private" ? "var(--social-accent)" : "var(--social-success)",
                        }}
                    >
                        {community.privacy === "private" ? <Lock size={10} /> : <Globe size={10} />}
                        {community.privacy === "private" ? "Private" : "Public"}
                    </div>
                </div>

                {/* Profile Photo Overlay */}
                <div className="relative px-4 -mt-6">
                    <div
                        className="w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0"
                        style={{
                            borderColor: "var(--social-card)",
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
                                className="w-full h-full flex items-center justify-center text-lg font-bold"
                                style={{ color: "var(--social-accent)" }}
                            >
                                {community.name.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="p-4 pt-2">
                    <h3
                        className="font-bold text-sm mb-1 truncate"
                        style={{ color: "var(--social-text)" }}
                    >
                        {community.name}
                    </h3>
                    <p
                        className="text-xs leading-relaxed mb-3 line-clamp-2"
                        style={{ color: "var(--social-text-muted)" }}
                    >
                        {community.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                        {community.category_tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="social-tag text-[10px] py-0.5 px-2">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Stats & Join */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span
                                className="flex items-center gap-1 text-xs"
                                style={{ color: "var(--social-text-muted)" }}
                            >
                                <Users size={12} />
                                {community.member_count.toLocaleString()}
                            </span>
                            <span
                                className="flex items-center gap-1 text-xs"
                                style={{ color: "var(--social-text-muted)" }}
                            >
                                <MessageSquare size={12} />
                                {community.post_count}
                            </span>
                        </div>

                        {community.is_member ? (
                            <span
                                className="text-xs font-bold px-3 py-1 rounded-lg"
                                style={{
                                    backgroundColor: "var(--social-accent-dim)",
                                    color: "var(--social-accent)",
                                }}
                            >
                                Joined
                            </span>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onJoin?.(community.id);
                                }}
                                className="social-btn-primary text-xs px-3 py-1"
                            >
                                Join
                            </button>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
