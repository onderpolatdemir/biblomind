"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Users, BookOpen, ShoppingBag, DollarSign, TrendingUp, Clock } from "lucide-react";

interface AdminStats {
    total_users: number;
    total_books: number;
    total_orders: number;
    total_revenue: number;
    orders_today: number;
    recent_orders: RecentOrder[];
    top_selling_books: TopBook[];
}

interface RecentOrder {
    id: string;
    user_name: string;
    total_price: number;
    status: string;
    created_at: string;
}

interface TopBook {
    id: string;
    title: string;
    author: string;
    total_sold: number;
    revenue: number;
}

const STATUS_STYLES: Record<string, string> = {
    PENDING:   "bg-yellow-100 text-yellow-700",
    PAID:      "bg-blue-100 text-blue-700",
    SHIPPED:   "bg-purple-100 text-purple-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get("/admin/stats")
            .then((r) => setStats(r.data))
            .catch(() => setStats(null))
            .finally(() => setIsLoading(false));
    }, []);

    const statCards = stats ? [
        { label: "Total Users",   value: stats.total_users,                    icon: Users,       color: "bg-blue-50 text-blue-600" },
        { label: "Total Books",   value: stats.total_books,                    icon: BookOpen,    color: "bg-green-50 text-green-600" },
        { label: "Total Orders",  value: stats.total_orders,                   icon: ShoppingBag, color: "bg-purple-50 text-purple-600" },
        { label: "Total Revenue", value: `$${Number(stats.total_revenue).toFixed(2)}`, icon: DollarSign, color: "bg-orange-50 text-orange-600" },
    ] : [];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back. Here's what's happening.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-24">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !stats ? (
                <div className="text-center py-16 text-gray-400">Failed to load stats.</div>
            ) : (
                <div className="space-y-8">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                        {statCards.map((card, i) => (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium mb-1">{card.label}</p>
                                        <p className="text-3xl font-heading font-bold text-gray-800">{card.value}</p>
                                    </div>
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                                        <card.icon size={20} />
                                    </div>
                                </div>
                                {card.label === "Total Orders" && stats.orders_today > 0 && (
                                    <p className="text-xs text-green-600 font-medium mt-3 flex items-center gap-1">
                                        <TrendingUp size={12} /> +{stats.orders_today} today
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Orders */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-heading font-bold text-gray-800 mb-5 flex items-center gap-2">
                                <Clock size={18} className="text-accent" /> Recent Orders
                            </h2>
                            <div className="space-y-3">
                                {stats.recent_orders?.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-4 text-center">No orders yet</p>
                                ) : (
                                    stats.recent_orders?.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{order.user_name || "Customer"}</p>
                                                <p className="text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                                                    {order.status}
                                                </span>
                                                <span className="font-bold text-accent text-sm">${Number(order.total_price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Top Selling Books */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-heading font-bold text-gray-800 mb-5 flex items-center gap-2">
                                <TrendingUp size={18} className="text-accent" /> Top Selling Books
                            </h2>
                            <div className="space-y-3">
                                {stats.top_selling_books?.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-4 text-center">No sales data yet</p>
                                ) : (
                                    stats.top_selling_books?.map((book, i) => (
                                        <div key={book.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                            <span className="text-lg font-heading font-bold text-gray-300 w-6 flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
                                                <p className="text-xs text-gray-400 truncate">{book.author}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs text-gray-400">{book.total_sold} sold</p>
                                                <p className="text-sm font-bold text-accent">${Number(book.revenue).toFixed(0)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
