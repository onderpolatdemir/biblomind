"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Header from "@/components/layout/Header";
import api from "@/lib/api";
import { Users, BookOpen, X, UserPlus, CheckCircle, ChevronRight, ShieldAlert, ExternalLink, Search } from "lucide-react";
import Image from "next/image";

const BACKEND_URL = "http://localhost:8000";

interface UserSearchResult {
    user_id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
}

interface BuddyMatch {
    user_id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
    compatibility_score: number;
    shared_genres: string[];
    shared_books: number;
    total_interactions: number;
}

interface SharedInterests {
    buddy_name: string;
    shared_genres: string[];
    shared_authors: string[];
    mutual_books: { id: string; title: string; author: string; cover_url?: string }[];
}

interface BuddyRecommendation {
    id: string;
    title: string;
    author: string;
    price?: number;
    cover_url?: string;
    interaction_type?: string;
}

export default function BookBuddiesPage() {
    const [buddies, setBuddies] = useState<BuddyMatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
    const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
    const [blockConfirmId, setBlockConfirmId] = useState<string | null>(null);
    const [selectedBuddy, setSelectedBuddy] = useState<BuddyMatch | null>(null);
    const [sharedInterests, setSharedInterests] = useState<SharedInterests | null>(null);
    const [buddyRecs, setBuddyRecs] = useState<BuddyRecommendation[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchConnectedIds, setSearchConnectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchBuddies();
    }, []);

    const fetchBuddies = async () => {
        try {
            const res = await api.get("/social/find-buddies?limit=12");
            setBuddies(res.data.buddies ?? res.data ?? []);
        } catch {
            setBuddies([]);
        } finally {
            setIsLoading(false);
        }
    };

    const openBuddyModal = async (buddy: BuddyMatch) => {
        setSelectedBuddy(buddy);
        setSharedInterests(null);
        setBuddyRecs([]);
        setModalLoading(true);
        try {
            const [interestsRes, recsRes] = await Promise.all([
                api.get(`/social/buddies/${buddy.user_id}/shared-interests`),
                api.get(`/social/buddies/${buddy.user_id}/recommendations`),
            ]);
            setSharedInterests(interestsRes.data);
            setBuddyRecs(recsRes.data.recommendations ?? []);
        } catch {
            // partial data is fine
        } finally {
            setModalLoading(false);
        }
    };

    const connectBuddy = async (userId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.post(`/social/connect/${userId}`);
        } catch { /* may already be connected */ }
        setConnectedIds((prev) => new Set(prev).add(userId));
    };

    const searchUsers = async (q: string) => {
        if (!q.trim()) { setSearchResults([]); return; }
        setSearchLoading(true);
        try {
            const res = await api.get(`/social/search?q=${encodeURIComponent(q.trim())}`);
            setSearchResults(res.data.results ?? []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const connectFromSearch = async (userId: string) => {
        try {
            await api.post(`/social/connect/${userId}`);
        } catch { /* may already be connected */ }
        setSearchConnectedIds((prev) => new Set(prev).add(userId));
    };

    const blockBuddy = async (userId: string) => {
        try {
            await api.post(`/social/block/${userId}`);
        } catch { /* sessizce geç */ }
        setBlockedIds((prev) => new Set(prev).add(userId));
        setBuddies((prev) => prev.filter((b) => b.user_id !== userId));
        if (selectedBuddy?.user_id === userId) setSelectedBuddy(null);
        setBlockConfirmId(null);
    };

    // genres from DB may be comma-separated strings — flatten to individual tags
    const flatGenres = (genres: string[]): string[] => {
        const set = new Set<string>();
        (genres ?? []).forEach((g) =>
            g.split(",").forEach((part) => {
                const t = part.trim();
                if (t) set.add(t);
            })
        );
        return Array.from(set);
    };

    const scoreColor = (score: number) => {
        if (isNaN(score) || score === undefined) return "text-gray-400";
        if (score >= 0.75) return "text-green-600";
        if (score >= 0.5) return "text-accent";
        return "text-gray-500";
    };

    const scoreRing = (score: number) => {
        if (isNaN(score) || score === undefined) return "bg-gray-50 border-gray-200";
        const pct = Math.round(score * 100);
        if (pct >= 75) return "bg-green-100 border-green-300";
        if (pct >= 50) return "bg-orange-50 border-orange-200";
        return "bg-gray-50 border-gray-200";
    };

    const fmtScore = (score: number) =>
        isNaN(score) || score == null ? "—" : `${Math.round(score * 100)}%`;

    return (
        <div className="min-h-screen bg-background font-body">
            <Header />

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/30 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-text" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text">
                            Book Buddies
                        </h1>
                    </div>
                    <p className="text-lg text-gray-500 max-w-xl">
                        Discover readers who share your taste. Connect, explore shared interests, and find your next great read together.
                    </p>
                </motion.div>

                {/* Username Search */}
                <div className="mb-10">
                    <h2 className="text-lg font-heading font-bold text-text mb-3">Find a Reader by Username</h2>
                    <div className="flex gap-3 max-w-md">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                placeholder="Search by @username..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                        </div>
                    </div>

                    {/* Search Results */}
                    {(searchLoading || searchResults.length > 0 || (searchQuery && !searchLoading)) && (
                        <div className="mt-3 max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {searchLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : searchResults.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-5">No users found for &quot;{searchQuery}&quot;</p>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {searchResults.map((u) => (
                                        <li key={u.user_id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-sm font-bold text-text flex-shrink-0">
                                                    {u.avatar_url ? (
                                                        <img
                                                            src={u.avatar_url.startsWith("http") ? u.avatar_url : `${BACKEND_URL}${u.avatar_url}`}
                                                            alt={u.username}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        u.full_name?.charAt(0)?.toUpperCase() ?? u.username.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{u.full_name ?? u.username}</p>
                                                    <p className="text-xs text-primary">@{u.username}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => connectFromSearch(u.user_id)}
                                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                                                    searchConnectedIds.has(u.user_id)
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-text text-white hover:bg-accent"
                                                }`}
                                            >
                                                {searchConnectedIds.has(u.user_id) ? (
                                                    <><CheckCircle size={12} /> Connected</>
                                                ) : (
                                                    <><UserPlus size={12} /> Connect</>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : buddies.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Users size={48} className="text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-heading font-bold text-gray-600 mb-2">No buddies found yet</h3>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto">
                            Add some books to your favorites and interact with books to find readers like you.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {buddies.map((buddy, i) => (
                            <motion.div
                                key={buddy.user_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                onClick={() => openBuddyModal(buddy)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
                            >
                                {/* Avatar + Score */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-14 h-14 rounded-full border-2 overflow-hidden flex items-center justify-center text-xl font-bold text-text ${scoreRing(buddy.compatibility_score)}`}>
                                        {buddy.avatar_url ? (
                                            <img
                                                src={buddy.avatar_url.startsWith("http") ? buddy.avatar_url : `${BACKEND_URL}${buddy.avatar_url}`}
                                                alt={buddy.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            buddy.full_name?.charAt(0)?.toUpperCase() ?? "?"
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${scoreColor(buddy.compatibility_score)}`}>
                                            {fmtScore(buddy.compatibility_score)}
                                        </p>
                                        <p className="text-xs text-gray-400">match</p>
                                    </div>
                                </div>

                                <h3 className="font-heading font-bold text-gray-800 text-base mb-0.5 truncate">
                                    {buddy.full_name}
                                </h3>
                                {buddy.username && (
                                    <p className="text-xs text-primary mb-1">@{buddy.username}</p>
                                )}

                                {/* Shared genres */}
                                {buddy.shared_genres?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {flatGenres(buddy.shared_genres).slice(0, 3).map((g) => (
                                            <span key={g} className="px-2 py-0.5 bg-primary/20 text-text text-xs rounded-full font-medium">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {buddy.shared_books > 0 && (
                                    <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                        <BookOpen size={12} />
                                        {buddy.shared_books} mutual books
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => connectBuddy(buddy.user_id, e)}
                                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${connectedIds.has(buddy.user_id)
                                            ? "bg-green-100 text-green-700"
                                            : "bg-text text-white hover:bg-accent"
                                            }`}
                                    >
                                        {connectedIds.has(buddy.user_id) ? (
                                            <><CheckCircle size={12} /> Connected</>
                                        ) : (
                                            <><UserPlus size={12} /> Connect</>
                                        )}
                                    </button>
                                    <button className="flex items-center gap-1 text-xs text-accent font-medium hover:underline">
                                        Details <ChevronRight size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setBlockConfirmId(buddy.user_id); }}
                                        className="ml-auto p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                                        title="Block user"
                                    >
                                        <ShieldAlert size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Block Confirm Dialog */}
            <AnimatePresence>
                {blockConfirmId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setBlockConfirmId(null)}
                        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center"
                        >
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert size={24} className="text-red-500" />
                            </div>
                            <h3 className="font-heading font-bold text-lg text-text mb-2">Block this user?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                They will no longer appear in your Book Buddies list. This action can be reversed from your connections.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setBlockConfirmId(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => blockBuddy(blockConfirmId)}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
                                >
                                    Block
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Buddy Detail Modal */}
            <AnimatePresence>
                {selectedBuddy && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedBuddy(null)}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-secondary rounded-full overflow-hidden flex items-center justify-center text-lg font-bold text-text">
                                        {selectedBuddy.avatar_url ? (
                                            <img
                                                src={selectedBuddy.avatar_url.startsWith("http") ? selectedBuddy.avatar_url : `${BACKEND_URL}${selectedBuddy.avatar_url}`}
                                                alt={selectedBuddy.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            selectedBuddy.full_name?.charAt(0)?.toUpperCase() ?? "?"
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="font-heading font-bold text-gray-800 text-lg">{selectedBuddy.full_name}</h2>
                                        <p className={`text-sm font-bold ${scoreColor(selectedBuddy.compatibility_score)}`}>
                                            {fmtScore(selectedBuddy.compatibility_score)} reading match
                                        </p>
                                        {selectedBuddy.username && (
                                            <Link
                                                href={`/profile/${selectedBuddy.username}`}
                                                onClick={() => setSelectedBuddy(null)}
                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                            >
                                                <ExternalLink size={10} /> View Profile
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedBuddy(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                                {modalLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Shared Genres */}
                                        {(sharedInterests?.shared_genres?.length ?? 0) > 0 && (
                                            <div>
                                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Shared Genres</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {flatGenres(sharedInterests?.shared_genres || []).slice(0, 5).map((g) => (
                                                        <span key={g} className="px-3 py-1 bg-primary/20 text-text text-sm rounded-full font-medium">
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Shared Authors */}
                                        {(sharedInterests?.shared_authors?.length ?? 0) > 0 && (
                                            <div>
                                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Shared Authors</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {sharedInterests?.shared_authors?.map((a) => (
                                                        <span key={a} className="px-3 py-1 bg-secondary text-text text-sm rounded-full">
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Mutual Books */}
                                        {(sharedInterests?.mutual_books?.length ?? 0) > 0 && (
                                            <div>
                                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Books You Both Love</h3>
                                                <div className="space-y-2">
                                                    {sharedInterests?.mutual_books?.map((b) => (
                                                        <div key={b.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                                                            <div className="relative w-8 h-12 rounded overflow-hidden bg-secondary flex-shrink-0">
                                                                {b.cover_url ? (
                                                                    <Image src={b.cover_url} alt={b.title} fill className="object-cover" />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <BookOpen size={14} className="text-gray-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm text-gray-800 line-clamp-1">{b.title}</p>
                                                                <p className="text-xs text-gray-500">{b.author}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Buddy's Recommendations */}
                                        {buddyRecs.length > 0 && (
                                            <div>
                                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                                                    Books {selectedBuddy.full_name?.split(" ")[0]} Loved
                                                </h3>
                                                <div className="space-y-2">
                                                    {buddyRecs.slice(0, 4).map((r) => (
                                                        <div key={r.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                                                            <div className="relative w-8 h-12 rounded overflow-hidden bg-secondary flex-shrink-0">
                                                                {r.cover_url ? (
                                                                    <Image src={r.cover_url} alt={r.title} fill className="object-cover" />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <BookOpen size={14} className="text-gray-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm text-gray-800 line-clamp-1">{r.title}</p>
                                                                <p className="text-xs text-gray-500">{r.author}</p>
                                                                {r.interaction_type && (
                                                                    <p className="text-xs text-accent mt-0.5 capitalize">{r.interaction_type}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                                <button
                                    onClick={(e) => connectBuddy(selectedBuddy.user_id, e)}
                                    className={`flex-1 py-3 rounded-full font-bold text-sm transition-all ${connectedIds.has(selectedBuddy.user_id)
                                        ? "bg-green-100 text-green-700"
                                        : "bg-text text-white hover:bg-accent"
                                        }`}
                                >
                                    {connectedIds.has(selectedBuddy.user_id) ? "Connected!" : `Connect with ${selectedBuddy.full_name?.split(" ")[0]}`}
                                </button>
                                <button
                                    onClick={() => setBlockConfirmId(selectedBuddy.user_id)}
                                    className="px-4 py-3 rounded-full border border-red-200 text-red-500 hover:bg-red-50 text-sm font-bold transition-all flex items-center gap-1.5"
                                >
                                    <ShieldAlert size={14} /> Block
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
