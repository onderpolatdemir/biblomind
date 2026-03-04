"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import api from "@/lib/api";
import { ShoppingBag, ChevronDown, ChevronUp, Package, MapPin } from "lucide-react";
import Image from "next/image";
import { Order } from "@/types/order";

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    PAID: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_STEPS = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>("ALL");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get("/orders/");
            setOrders(res.data ?? []);
        } catch {
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

    const filters = ["ALL", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

    const filtered = activeFilter === "ALL"
        ? orders
        : orders.filter((o) => o.status === activeFilter);

    const stepIndex = (status: string) => STATUS_STEPS.indexOf(status);

    return (
        <div className="min-h-screen bg-gray-50/50 font-body">
            <Header />

            <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">My Orders</h1>
                    <p className="text-gray-500 mb-8">Track and manage all your purchases.</p>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
                        {filters.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                    activeFilter === f
                                        ? "bg-text text-white shadow-sm"
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-text"
                                }`}
                            >
                                {f === "ALL" ? "All Orders" : f.charAt(0) + f.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Orders List */}
                    {isLoading ? (
                        <div className="flex justify-center py-24">
                            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-heading font-bold text-gray-600 mb-2">No orders found</h3>
                            <p className="text-gray-400 text-sm">
                                {activeFilter === "ALL" ? "You haven't placed any orders yet." : `No ${activeFilter.toLowerCase()} orders.`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((order, i) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                                >
                                    {/* Order Row */}
                                    <div
                                        onClick={() => toggle(order.id)}
                                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 cursor-pointer hover:bg-gray-50/50 transition-colors gap-4"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-heading font-bold text-gray-800">
                                                    Order #{order.id.slice(0, 8).toUpperCase()}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                {new Date(order.created_at).toLocaleDateString("en-US", {
                                                    year: "numeric", month: "long", day: "numeric"
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Progress dots */}
                                            <div className="hidden md:flex items-center gap-1">
                                                {STATUS_STEPS.map((s, idx) => (
                                                    <div key={s} className="flex items-center gap-1">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${
                                                            idx <= stepIndex(order.status) ? "bg-accent" : "bg-gray-200"
                                                        }`} />
                                                        {idx < STATUS_STEPS.length - 1 && (
                                                            <div className={`w-6 h-0.5 ${
                                                                idx < stepIndex(order.status) ? "bg-accent" : "bg-gray-200"
                                                            }`} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm text-gray-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                                                <p className="font-bold text-accent text-lg">${Number(order.total_price).toFixed(2)}</p>
                                            </div>
                                            {expandedId === order.id
                                                ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
                                                : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                                            }
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    <AnimatePresence initial={false}>
                                        {expandedId === order.id && (
                                            <motion.div
                                                key="detail"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden border-t border-gray-100"
                                            >
                                                <div className="px-5 py-5 space-y-5">
                                                    {/* Shipping address */}
                                                    {order.shipping_address && (
                                                        <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 text-sm">
                                                            <MapPin size={16} className="text-accent mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="font-bold text-gray-700 mb-0.5">Shipping Address</p>
                                                                <p className="text-gray-500">
                                                                    {order.shipping_address.street}, {order.shipping_address.city}
                                                                    {order.shipping_address.state ? `, ${order.shipping_address.state}` : ""}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Items */}
                                                    <div className="space-y-3">
                                                        {order.items.map((item) => (
                                                            <div key={item.id} className="flex items-center gap-4">
                                                                <div className="relative w-12 h-18 bg-secondary rounded-lg overflow-hidden flex-shrink-0" style={{ height: "72px" }}>
                                                                    {item.book_cover_url ? (
                                                                        <Image src={item.book_cover_url} alt={item.book_title} fill className="object-cover" />
                                                                    ) : (
                                                                        <div className="flex items-center justify-center h-full">
                                                                            <Package size={20} className="text-gray-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.book_title}</p>
                                                                    <p className="text-xs text-gray-500">{item.book_author}</p>
                                                                </div>
                                                                <div className="text-right flex-shrink-0">
                                                                    <p className="text-xs text-gray-400">×{item.quantity}</p>
                                                                    <p className="font-bold text-accent text-sm">${Number(item.price).toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Totals */}
                                                    <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm">
                                                        <div className="flex justify-between text-gray-500">
                                                            <span>Subtotal</span>
                                                            <span>${Number(order.subtotal ?? order.total_price).toFixed(2)}</span>
                                                        </div>
                                                        {order.shipping_cost != null && (
                                                            <div className="flex justify-between text-gray-500">
                                                                <span>Shipping</span>
                                                                <span>{Number(order.shipping_cost) === 0 ? "Free" : `$${Number(order.shipping_cost).toFixed(2)}`}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-100">
                                                            <span>Total</span>
                                                            <span>${Number(order.total_price).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
