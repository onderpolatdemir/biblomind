"use client";

import Link from "next/link";
import { MOCK_COMMUNITIES } from "@/lib/social-mock-data";

export default function CommunityHighlights() {
    return (
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {MOCK_COMMUNITIES.map((community) => (
                <Link
                    key={community.id}
                    href={`/social/communities/${community.id}`}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                >
                    {/* Avatar with accent ring */}
                    <div
                        className="w-14 h-14 rounded-full p-[2px] transition-transform group-hover:scale-105"
                        style={{
                            background: `linear-gradient(135deg, var(--social-accent), #ff8c00)`,
                        }}
                    >
                        <div
                            className="w-full h-full rounded-full overflow-hidden"
                            style={{ border: "2px solid var(--social-bg)" }}
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
                                    className="w-full h-full flex items-center justify-center text-sm font-bold"
                                    style={{
                                        backgroundColor: "var(--social-card-elevated)",
                                        color: "var(--social-accent)",
                                    }}
                                >
                                    {community.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <span
                        className="text-[10px] font-medium text-center max-w-[60px] truncate"
                        style={{ color: "var(--social-text-muted)" }}
                    >
                        {community.name.split(" ")[0]}
                    </span>
                </Link>
            ))}
        </div>
    );
}
