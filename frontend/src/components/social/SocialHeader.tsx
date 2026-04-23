"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Home, Users, MessageCircle, Settings, Search, LogOut, ArrowLeft } from "lucide-react";

export default function SocialHeader() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U";

    const navItems = [
        { icon: Home, label: "Feed", href: "/social", id: "feed" },
        { icon: Users, label: "Communities", href: "/social/communities", id: "communities" },
        { icon: MessageCircle, label: "Chat", href: "/social", id: "chat" },
        { icon: Settings, label: "Settings", href: "/social", id: "settings" },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Search functionality — will integrate with backend later
    };

    return (
        <nav
            className="sticky top-0 z-50 w-full border-b"
            style={{
                backgroundColor: "var(--social-bg-secondary)",
                borderColor: "var(--social-border)",
            }}
        >
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between h-[68px]">
                {/* Left — Logo */}
                <div className="flex items-center gap-4">
                    <Link href="/social" className="relative w-[400px] h-[112px] flex-shrink-0">
                        <Image
                            src="/biblomind_social.png"
                            alt="BiblioMind Social"
                            fill
                            className="object-contain brightness-0 invert"
                            priority
                        />
                    </Link>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex items-center">
                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--social-text-muted)" }}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="#Explore"
                                className="social-input pl-9 w-[200px] lg:w-[260px] text-sm"
                            />
                        </div>
                    </form>
                </div>

                {/* Center — Nav Icons */}
                <div className="flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group"
                            style={{ color: "var(--social-text-muted)" }}
                            title={item.label}
                        >
                            <item.icon
                                size={22}
                                className="group-hover:scale-110 transition-transform duration-200"
                                style={{ color: "inherit" }}
                            />
                            <span
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full transition-all duration-200 group-hover:w-6"
                                style={{ backgroundColor: "var(--social-accent)" }}
                            />
                        </Link>
                    ))}
                </div>

                {/* Right — Profile */}
                <div className="flex items-center gap-3">
                    {/* Back to main app */}
                    <Link
                        href="/home"
                        className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        style={{
                            color: "var(--social-text-muted)",
                            border: "1px solid var(--social-border)",
                        }}
                        title="Back to BiblioMind"
                    >
                        <ArrowLeft size={14} />
                        Main App
                    </Link>

                    {/* User Avatar */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-9 h-9 rounded-full overflow-hidden border-2 transition-all"
                            style={{
                                borderColor: isProfileOpen
                                    ? "var(--social-accent)"
                                    : "var(--social-border-light)",
                            }}
                        >
                            <div
                                className="w-full h-full flex items-center justify-center text-sm font-bold"
                                style={{
                                    backgroundColor: "var(--social-card-elevated)",
                                    color: "var(--social-text)",
                                }}
                            >
                                {userInitial}
                            </div>
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden shadow-2xl z-50"
                                    style={{
                                        backgroundColor: "var(--social-card)",
                                        border: "1px solid var(--social-border)",
                                    }}
                                >
                                    <div
                                        className="px-4 py-3 border-b"
                                        style={{ borderColor: "var(--social-border)" }}
                                    >
                                        <p
                                            className="font-bold text-sm"
                                            style={{ color: "var(--social-text)" }}
                                        >
                                            {user?.full_name || "User"}
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{ color: "var(--social-text-muted)" }}
                                        >
                                            {user?.email}
                                        </p>
                                    </div>

                                    <Link
                                        href="/home"
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                                        style={{ color: "var(--social-text-secondary)" }}
                                    >
                                        <ArrowLeft size={14} />
                                        Back to BiblioMind
                                    </Link>

                                    <div
                                        className="border-t"
                                        style={{ borderColor: "var(--social-border)" }}
                                    />

                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            logout();
                                        }}
                                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors"
                                        style={{ color: "var(--social-danger)" }}
                                    >
                                        <LogOut size={14} />
                                        Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </nav>
    );
}
