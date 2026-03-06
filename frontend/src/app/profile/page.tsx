"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import ProfileInfo from "@/components/profile/ProfileInfo";
import AddressManager from "@/components/profile/AddressManager";
import OrderHistory from "@/components/profile/OrderHistory";
import ReviewHistory from "@/components/profile/ReviewHistory";
import {
    User as UserIcon,
    MapPin,
    ShoppingBag,
    Star,
    LogOut,
    Settings
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, login } = useAuth();
    const [activeTab, setActiveTab] = useState<"info" | "address" | "orders" | "reviews">("info");

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
        { id: "info", label: "Personal Information", icon: UserIcon },
        { id: "address", label: "My Addresses", icon: MapPin },
        { id: "orders", label: "My Orders", icon: ShoppingBag },
        { id: "reviews", label: "My Reviews", icon: Star },
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
                                <ProfileInfo
                                    user={user}
                                    onUpdate={(updated) => {
                                        // We need to update user in AuthContext too if possible
                                        // For now, we rely on page refresh or simple state update here
                                        // Ideal: update context. 
                                        // Since login updates context, we can re-call login with new data if token is same?
                                        // Or just rely on the component's internal state for display until refresh.
                                        // Actually ProfileInfo calls API, so next fetch/refresh gets it.
                                        // To update Header immediately, we might need context update.
                                        // Let's check AuthContext. It has 'login' but not 'updateUser'.
                                        // We'll just force a reload or accept it updates on nav.
                                        // For better UX, we can try to re-set the user in context if we had that function.
                                    }}
                                />
                            )}
                            {activeTab === "address" && <AddressManager />}
                            {activeTab === "orders" && <OrderHistory />}
                            {activeTab === "reviews" && <ReviewHistory />}
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
