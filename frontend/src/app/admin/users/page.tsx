"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Users, Search, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
    total_orders?: number;
    total_spent?: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                page_size: String(pageSize),
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
            });
            const res = await api.get(`/admin/users?${params}`);
            setUsers(res.data.users ?? res.data.items ?? []);
            setTotal(res.data.total ?? 0);
        } catch {
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-gray-800">Users</h1>
                <p className="text-gray-500 mt-1">{total} registered users</p>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Users size={40} className="mx-auto mb-3 text-gray-200" />
                        <p>No users found</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">User</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Joined</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Orders</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Total Spent</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user, i) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-bold text-text flex-shrink-0">
                                                {user.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-medium text-gray-800 truncate">{user.full_name || "—"}</p>
                                                    {user.is_admin && (
                                                        <ShieldCheck size={13} className="text-accent flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                                        {new Date(user.created_at).toLocaleDateString("en-US", {
                                            year: "numeric", month: "short", day: "numeric"
                                        })}
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">{user.total_orders ?? "—"}</td>
                                    <td className="px-5 py-3.5 font-bold text-accent">
                                        {user.total_spent != null ? `$${Number(user.total_spent).toFixed(2)}` : "—"}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                            user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}>
                                            {user.is_active ? "Active" : "Inactive"}
                                        </span>
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
