"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MOCK_COMMUNITIES } from "@/lib/social-mock-data";
import CommunityCard from "@/components/social/CommunityCard";
import { Plus, Search, Filter } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export default function ExploreCommunities() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [communities, setCommunities] = useState(MOCK_COMMUNITIES);

    const filteredCommunities = communities.filter((c) => {
        const matchesSearch =
            !searchQuery ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag =
            !selectedTag || c.category_tags.includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    // Get unique tags from all communities + some from CATEGORIES
    const allTags = Array.from(
        new Set(communities.flatMap((c) => c.category_tags))
    );

    const handleJoin = (id: string) => {
        setCommunities((prev) =>
            prev.map((c) =>
                c.id === id
                    ? { ...c, is_member: true, member_count: c.member_count + 1 }
                    : c
            )
        );
    };

    return (
        <div>
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1
                            className="text-3xl font-heading font-bold mb-1"
                            style={{ color: "var(--social-text)" }}
                        >
                            Explore Communities
                        </h1>
                        <p
                            className="text-sm"
                            style={{ color: "var(--social-text-muted)" }}
                        >
                            Find your tribe. Join communities about the books you love.
                        </p>
                    </div>

                    <Link
                        href="/social/communities/create"
                        className="social-btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Create Community
                    </Link>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "var(--social-text-muted)" }}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search communities..."
                            className="social-input pl-9 w-full text-sm"
                        />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setSelectedTag(null)}
                            className={`social-tag text-[11px] ${!selectedTag ? "social-tag-active" : ""}`}
                        >
                            All
                        </button>
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() =>
                                    setSelectedTag(selectedTag === tag ? null : tag)
                                }
                                className={`social-tag text-[11px] ${selectedTag === tag ? "social-tag-active" : ""}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Community Grid */}
            {filteredCommunities.length === 0 ? (
                <div
                    className="text-center py-16 social-card"
                >
                    <Filter
                        size={40}
                        className="mx-auto mb-3"
                        style={{ color: "var(--social-text-muted)" }}
                    />
                    <p
                        className="font-bold mb-1"
                        style={{ color: "var(--social-text-secondary)" }}
                    >
                        No communities found
                    </p>
                    <p
                        className="text-sm"
                        style={{ color: "var(--social-text-muted)" }}
                    >
                        Try a different search or create your own!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCommunities.map((community, i) => (
                        <CommunityCard
                            key={community.id}
                            community={community}
                            index={i}
                            onJoin={handleJoin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
