"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { Users, BookOpen, Globe, UserPlus, Check } from "lucide-react";
import api from "@/lib/api";

const BACKEND_URL = "http://localhost:8000";

interface PublicProfile {
    id: string;
    full_name: string;
    username: string;
    bio: string | null;
    avatar_url: string | null;
    reading_goal: number | null;
    buddy_count: number;
    community_count: number;
    post_count: number;
}

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        if (!username) return;
        api.get(`/users/profile/${username}`)
            .then((r) => setProfile(r.data))
            .catch((e) => {
                if (e?.response?.status === 404) setNotFound(true);
            })
            .finally(() => setIsLoading(false));
    }, [username]);

    const handleConnect = async () => {
        if (!profile) return;
        setConnecting(true);
        try {
            await api.post(`/social/connect/${profile.id}`);
            setConnected(true);
        } catch {
            // ignore — might already be connected
            setConnected(true);
        } finally {
            setConnecting(false);
        }
    };

    const isOwnProfile = user?.username === username;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 font-body">
                <Header />
                <div className="flex justify-center items-center py-32">
                    <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 font-body">
                <Header />
                <div className="max-w-xl mx-auto px-4 py-32 text-center">
                    <p className="text-2xl font-bold text-gray-700 mb-2">User not found</p>
                    <p className="text-gray-400 mb-6">@{username} doesn't exist or hasn't set a username yet.</p>
                    <Link href="/book-buddies" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-opacity-90 transition-all">
                        <Users size={16} /> Find Book Buddies
                    </Link>
                </div>
            </div>
        );
    }

    const avatarSrc = profile.avatar_url
        ? (profile.avatar_url.startsWith("http") ? profile.avatar_url : `${BACKEND_URL}${profile.avatar_url}`)
        : null;

    return (
        <div className="min-h-screen bg-gray-50/50 font-body">
            <Header />
            <main className="max-w-3xl mx-auto px-4 py-12">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    {/* Top bar */}
                    <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/40" />
                    <div className="px-8 pb-8">
                        <div className="flex items-end gap-5 -mt-12 mb-5">
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0">
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-text">
                                        {profile.full_name?.charAt(0).toUpperCase() || "?"}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                                <h1 className="text-2xl font-bold text-gray-900 truncate">{profile.full_name}</h1>
                                <p className="text-primary font-medium">@{profile.username}</p>
                            </div>
                            {!isOwnProfile && (
                                <button
                                    onClick={handleConnect}
                                    disabled={connecting || connected}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex-shrink-0 ${connected
                                        ? "bg-green-100 text-green-700"
                                        : "bg-primary text-white hover:bg-opacity-90"
                                        }`}
                                >
                                    {connected ? <Check size={16} /> : <UserPlus size={16} />}
                                    {connected ? "Request Sent" : connecting ? "Sending..." : "Connect"}
                                </button>
                            )}
                            {isOwnProfile && (
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-primary text-primary hover:bg-primary/5 transition-all"
                                >
                                    Edit Profile
                                </Link>
                            )}
                        </div>

                        {profile.bio && (
                            <p className="text-gray-600 leading-relaxed mb-5">{profile.bio}</p>
                        )}

                        {/* Stats */}
                        <div className="flex gap-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{profile.buddy_count}</p>
                                <p className="text-xs text-gray-500 font-medium">Book Buddies</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{profile.community_count}</p>
                                <p className="text-xs text-gray-500 font-medium">Communities</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{profile.post_count}</p>
                                <p className="text-xs text-gray-500 font-medium">Posts</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reading Goal */}
                {profile.reading_goal && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen size={18} className="text-primary" />
                            <h3 className="font-bold text-gray-800">Reading Goal</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">
                            Aiming to read <span className="font-bold text-primary">{profile.reading_goal} books</span> this year
                        </p>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: "20%" }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Progress tracking coming soon</p>
                    </div>
                )}
            </main>
        </div>
    );
}
