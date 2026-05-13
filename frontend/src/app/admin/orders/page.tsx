"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { ShoppingBag, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface AdminOrder {
    id: string;
    user_name: string;
    user_email: string;
    status: string;
    total_price: number;
    items_count: number;
    created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
    PENDING:   "bg-yellow-100 text-yellow-700",
    PAID:      "bg-blue-100 text-blue-700",
    SHIPPED:   "bg-purple-100 text-purple-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                page_size: String(pageSize),
                ...(filterStatus ? { status: filterStatus } : {}),
            });
            const res = await api.get(`/admin/orders?${params}`);
            setOrders(res.data.orders ?? res.data.items ?? []);
            setTotal(res.data.total ?? 0);
        } catch {
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, filterStatus]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
            );
        } catch {
            // silent
        } finally {
            setUpdatingId(null);
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-gray-800">Orders</h1>
                <p className="text-gray-500 mt-1">{total} total orders</p>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button
                    onClick={() => { setFilterStatus(""); setPage(1); }}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        filterStatus === "" ? "bg-[#2f2f2f] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                >
                    All
                </button>
                {STATUS_OPTIONS.map((s) => (
                    <button
                        key={s}
                        onClick={() => { setFilterStatus(s); setPage(1); }}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                            filterStatus === s ? "bg-[#2f2f2f] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}
                    >
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <ShoppingBag size={40} className="mx-auto mb-3 text-gray-200" />
                        <p>No orders found</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Order ID</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Customer</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Date</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Items</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Total</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((order) => (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                                        #{order.id.slice(0, 8).toUpperCase()}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-gray-800">{order.user_name || "—"}</p>
                                        <p className="text-xs text-gray-400">{order.user_email}</p>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                                        {new Date(order.created_at).toLocaleDateString("en-US", {
                                            year: "numeric", month: "short", day: "numeric"
                                        })}
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">{order.items_count ?? "—"}</td>
                                    <td className="px-5 py-3.5 font-bold text-accent">${Number(order.total_price).toFixed(2)}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="relative inline-block">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                                disabled={updatingId === order.id}
                                                className={`appearance-none pr-7 pl-2.5 py-1 rounded-full text-xs font-bold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-700"} disabled:opacity-60`}
                                            >
                                                {STATUS_OPTIONS.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
