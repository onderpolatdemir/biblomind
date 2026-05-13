"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import CommunityCard from "@/components/social/CommunityCard";
import { Search, Plus } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";

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

export default function CommunitiesPage() {
    const router = useRouter();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchCommunities = useCallback(async (q: string, pg: number, replace = false) => {
        setIsLoading(true);
        try {
            const res = await api.get("/communities/", {
                params: { search: q || undefined, page: pg, limit: 20 },
            });
            const items: Community[] = res.data.communities ?? [];
            setCommunities((prev) => (replace ? items : [...prev, ...items]));
            setHasMore(items.length === 20);
        } catch {
            setCommunities([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCommunities("", 1, true);
    }, [fetchCommunities]);

    const handleSearch = (q: string) => {
        setSearch(q);
        setPage(1);
        fetchCommunities(q, 1, true);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-body">
            <Header />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-1">Communities</h1>
                        <p className="text-gray-500">Find your reading tribe</p>
                    </div>
                    <button
                        onClick={() => router.push("/social/communities/create")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-sm"
                    >
                        <Plus size={16} /> Create
                    </button>
                </div>

                <div className="relative mb-8 max-w-md">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search communities..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
                    />
                </div>

                {isLoading && communities.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-56 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : communities.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-gray-400 mb-3">No communities found.</p>
                        <button
                            onClick={() => router.push("/social/communities/create")}
                            className="text-primary font-bold hover:underline"
                        >
                            Create the first one →
                        </button>
                    </div>
                ) : (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                        >
                            {communities.map((c) => (
                                <CommunityCard key={c.id} community={c} />
                            ))}
                        </motion.div>

                        {hasMore && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={() => {
                                        const next = page + 1;
                                        setPage(next);
                                        fetchCommunities(search, next);
                                    }}
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:border-primary transition-all"
                                >
                                    {isLoading ? "Loading..." : "Load more"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}