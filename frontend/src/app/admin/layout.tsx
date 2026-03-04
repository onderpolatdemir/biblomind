"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard, BookOpen, ShoppingBag, Users, LogOut, ChevronRight
} from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/books",     label: "Books",     icon: BookOpen },
    { href: "/admin/orders",    label: "Orders",    icon: ShoppingBag },
    { href: "/admin/users",     label: "Users",     icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && (!user || !user.is_admin)) {
            router.replace("/home");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user?.is_admin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex font-body">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-[#2f2f2f] text-white flex flex-col min-h-screen">
                {/* Logo */}
                <div className="px-6 py-6 border-b border-white/10">
                    <Link href="/admin/dashboard" className="flex items-center gap-3">
                        <div className="relative w-32 h-10">
                            <Image src="/biblomind-logoo.png" alt="BiblioMind" fill className="object-contain brightness-0 invert" />
                        </div>
                    </Link>
                    <p className="text-xs text-white/40 mt-1 ml-0.5">Admin Panel</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname.startsWith(href + "/");
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? "bg-white/10 text-white"
                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={18} />
                                    {label}
                                </div>
                                {isActive && <ChevronRight size={14} className="text-white/40" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User + Logout */}
                <div className="px-4 py-5 border-t border-white/10">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm font-bold">
                            {user.full_name?.charAt(0).toUpperCase() ?? "A"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
                            <p className="text-xs text-white/40 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); router.push("/"); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/5 hover:text-red-400 transition-all"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 min-w-0 bg-gray-50/50">
                {children}
            </div>
        </div>
    );
}
