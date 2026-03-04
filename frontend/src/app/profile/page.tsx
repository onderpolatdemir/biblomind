"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import ProfileInfo from "@/components/profile/ProfileInfo";
import AddressManager from "@/components/profile/AddressManager";
import OrderHistory from "@/components/profile/OrderHistory";
import {
    User as UserIcon,
    MapPin,
    ShoppingBag,
    Star,
    LogOut,
    RefreshCw,
    CheckCircle2,
    Users,
    Camera,
    BookOpen,
    CheckCircle,
    UserPlus,
    Trash2,
    UserSearch,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";

/* ─── My Connections Tab ─────────────────────────────────────────── */
interface Connection {
    connection_id: string;
    user_id: string;
    full_name: string;
    email: string;
    compatibility_score: number;
    shared_books: number;
    shared_genres_count: number;
    total_interactions: number;
    connected_at: string;
}

function MyConnectionsTab() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get("/social/my-connections?status=connected")
            .then((r) => setConnections(r.data.connections ?? []))
            .catch(() => setConnections([]))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return (
        <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (connections.length === 0) return (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No connections yet</h3>
            <p className="text-gray-500 mb-6">Connect with Book Buddies who share your reading taste.</p>
            <Link href="/book-buddies" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-opacity-90 transition-all">
                <UserPlus size={16} /> Find Book Buddies
            </Link>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Users size={18} className="text-primary" />
                <h3 className="font-heading font-bold text-text">My Connections ({connections.length})</h3>
            </div>
            <div className="divide-y divide-gray-50">
                {connections.map((c) => (
                    <div key={c.connection_id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg flex-shrink-0">
                            {c.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-text truncate">{c.full_name}</p>
                            <p className="text-sm text-gray-400 truncate">{c.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-1">
                            <div className="flex items-center gap-1 justify-end">
                                <CheckCircle size={13} className="text-green-500" />
                                <span className="text-xs font-bold text-green-600">{Math.round(c.compatibility_score * 100)}% match</span>
                            </div>
                            <p className="text-xs text-gray-400">{c.shared_books} shared books</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Potential Buddies Tab ──────────────────────────────────────── */
function PotentialBuddiesTab() {
    const [buddies, setBuddies] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get("/social/my-connections?status=suggested")
            .then((r) => setBuddies(r.data.connections ?? []))
            .catch(() => setBuddies([]))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return (
        <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (buddies.length === 0) return (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <UserSearch className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No suggestions yet</h3>
            <p className="text-gray-500 mb-6">Visit Book Buddies to discover readers with similar tastes.</p>
            <Link href="/book-buddies" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-opacity-90 transition-all">
                <UserSearch size={16} /> Find Buddies
            </Link>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <UserSearch size={18} className="text-primary" />
                <h3 className="font-heading font-bold text-text">Potential Buddies ({buddies.length})</h3>
            </div>
            <div className="divide-y divide-gray-50">
                {buddies.map((c) => (
                    <div key={c.connection_id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-secondary/60 flex items-center justify-center font-bold text-primary text-lg flex-shrink-0">
                            {c.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-text truncate">{c.full_name}</p>
                            <p className="text-sm text-gray-400 truncate">{c.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {Math.round(c.compatibility_score * 100)}% match
                            </span>
                            <p className="text-xs text-gray-400">{c.shared_books} shared books</p>
                        </div>
                        <Link href="/book-buddies" className="ml-2 flex-shrink-0 text-xs font-bold text-primary hover:underline">
                            Connect →
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── My Reviews Tab ─────────────────────────────────────────────── */
interface UserReview {
    id: string;
    book_id: string;
    rating: number;
    comment?: string;
    created_at: string;
}

function MyReviewsTab() {
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReviews = () => {
        setIsLoading(true);
        api.get("/reviews/users/me/reviews")
            .then((r) => setReviews(r.data ?? []))
            .catch(() => setReviews([]))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { fetchReviews(); }, []);

    const deleteReview = async (bookId: string) => {
        try {
            await api.delete(`/reviews/books/${bookId}/reviews`);
            fetchReviews();
        } catch {
            // ignore
        }
    };

    if (isLoading) return (
        <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (reviews.length === 0) return (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Star className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No reviews yet</h3>
            <p className="text-gray-500 mb-6">Start reading and share your thoughts on books.</p>
            <Link href="/home" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-opacity-90 transition-all">
                <BookOpen size={16} /> Browse Books
            </Link>
        </div>
    );

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-orange-400 text-orange-400" : "text-gray-200"}`} />
                                ))}
                            </div>
                            <span className="text-xs text-gray-400 ml-auto">
                                {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                        </div>
                        {review.comment && <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.comment}</p>}
                        <Link href={`/books/${review.book_id}`} className="text-xs font-bold text-primary hover:underline">
                            View Book →
                        </Link>
                    </div>
                    <button
                        onClick={() => deleteReview(review.book_id)}
                        className="self-start p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Delete review"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}

/* ─── My Scans Tab ───────────────────────────────────────────────── */
interface PhotoScan {
    id: string;
    detected_books: string[];
    recommendations: { title?: string; match_score?: number; in_our_store?: boolean; book_id?: string }[];
    created_at: string;
}

function MyScansTab() {
    const [scans, setScans] = useState<PhotoScan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        api.get("/vision/scans")
            .then((r) => setScans(r.data ?? []))
            .catch(() => setScans([]))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return (
        <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (scans.length === 0) return (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Camera className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No scans yet</h3>
            <p className="text-gray-500 mb-6">Upload a bookshelf photo on the home page to get AI-powered recommendations.</p>
            <Link href="/home" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-opacity-90 transition-all">
                <Camera size={16} /> Scan a Shelf
            </Link>
        </div>
    );

    return (
        <div className="space-y-4">
            {scans.map((scan) => {
                const isOpen = expanded === scan.id;
                const date = scan.created_at ? new Date(scan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
                return (
                    <div key={scan.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setExpanded(isOpen ? null : scan.id)}
                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Camera size={18} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-text text-sm">{scan.detected_books.length} books detected</p>
                                <p className="text-xs text-gray-400">{date}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {scan.recommendations.length > 0 && (
                                    <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                        {scan.recommendations.length} recs
                                    </span>
                                )}
                                <span className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="px-6 pb-5 border-t border-gray-50 pt-4 space-y-4">
                                {scan.detected_books.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Detected on Shelf</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {scan.detected_books.map((b, i) => (
                                                <span key={i} className="text-xs px-2.5 py-1 bg-secondary text-text rounded-full">{b}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {scan.recommendations.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Recommendations</p>
                                        <div className="space-y-2">
                                            {scan.recommendations.map((r, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                                                    <BookOpen size={14} className="text-gray-400 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        {r.book_id ? (
                                                            <Link href={`/books/${r.book_id}`} className="font-medium text-sm text-text hover:text-primary truncate block">
                                                                {r.title ?? "—"}
                                                            </Link>
                                                        ) : (
                                                            <p className="font-medium text-sm text-text truncate">{r.title ?? "—"}</p>
                                                        )}
                                                    </div>
                                                    {r.match_score != null && (
                                                        <span className="text-xs font-bold text-primary flex-shrink-0">
                                                            {Math.round(r.match_score * 100)}%
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Profile Page ───────────────────────────────────────────────── */
export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, login } = useAuth();
    const [activeTab, setActiveTab] = useState<"info" | "address" | "orders" | "reviews" | "connections" | "scans" | "potential">("info");
    const [refreshing, setRefreshing] = useState(false);
    const [refreshDone, setRefreshDone] = useState(false);

    const handleRefreshRecommendations = async () => {
        setRefreshing(true);
        setRefreshDone(false);
        try {
            await api.post("/recommendations/refresh");
            setRefreshDone(true);
            setTimeout(() => setRefreshDone(false), 3000);
        } catch {
            // sessizce geç
        } finally {
            setRefreshing(false);
        }
    };

    const handleLogout = () => {
        if (logout) {
            logout();
            router.push("/login?redirect=/home");
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 font-body">
                <Header />
                <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                    <p>Please log in to view your profile.</p>
                </div>
            </div>
        );
    }

    const menuItems = [
        { id: "info",        label: "Personal Information", icon: UserIcon },
        { id: "address",     label: "My Addresses",         icon: MapPin },
        { id: "orders",      label: "My Orders",            icon: ShoppingBag },
        { id: "connections", label: "My Connections",       icon: Users },
        { id: "potential",   label: "Potential Buddies",    icon: UserSearch },
        { id: "scans",       label: "My Scans",             icon: Camera },
        { id: "reviews",     label: "My Reviews",           icon: Star },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 font-body">
            <Header />

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">My Account</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                            {/* User Brief */}
                            <div className="p-6 bg-primary/5 border-b border-gray-100 text-center">
                                <div className="w-20 h-20 bg-secondary rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-text mb-3 border-4 border-white shadow-sm">
                                    {user.full_name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <h2 className="font-bold text-gray-800 truncate">{user.full_name}</h2>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>

                            {/* Navigation */}
                            <nav className="p-4 space-y-1">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id as any)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                                ? "bg-primary text-white font-bold shadow-md"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        <item.icon size={18} />
                                        {item.label}
                                    </button>
                                ))}

                                <div className="my-2 border-t border-gray-100" />

                                {/* Refresh Recommendations */}
                                <button
                                    onClick={handleRefreshRecommendations}
                                    disabled={refreshing}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-primary/10 hover:text-text transition-all font-medium disabled:opacity-60"
                                >
                                    {refreshDone ? (
                                        <CheckCircle2 size={18} className="text-green-600" />
                                    ) : (
                                        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                                    )}
                                    {refreshing ? "Updating..." : refreshDone ? "Updated!" : "Refresh Recommendations"}
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Right Content */}
                    <div className="flex-1">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === "info" && (
                                <ProfileInfo user={user} onUpdate={() => {}} />
                            )}
                            {activeTab === "address" && <AddressManager />}
                            {activeTab === "orders" && <OrderHistory />}
                            {activeTab === "connections" && <MyConnectionsTab />}
                            {activeTab === "potential" && <PotentialBuddiesTab />}
                            {activeTab === "scans" && <MyScansTab />}
                            {activeTab === "reviews" && <MyReviewsTab />}
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
