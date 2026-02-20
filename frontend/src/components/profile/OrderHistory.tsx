"use client";

import { useState, useEffect } from "react";
import { Order } from "@/types/order";
import api from "@/lib/api";
import { ShoppingBag, ChevronDown, ChevronUp, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get("/orders/");
            setOrders(res.data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleOrder = (id: string) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-800";
            case "PROCESSING": return "bg-blue-100 text-blue-800";
            case "SHIPPED": return "bg-purple-100 text-purple-800";
            case "DELIVERED": return "bg-green-100 text-green-800";
            case "CANCELLED": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ShoppingBag className="text-primary" />
                Order History
            </h2>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                    <ShoppingBag className="mx-auto w-12 h-12 text-gray-300 mb-2" />
                    <p>No orders found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/30">
                            <div
                                onClick={() => toggleOrder(order.id)}
                                className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-gray-50 transition-colors gap-4"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-bold text-lg text-gray-800">Order #{order.id.slice(0, 8)}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{order.items.length} Items</p>
                                        <p className="font-bold text-primary text-lg">${Number(order.total_price).toFixed(2)}</p>
                                    </div>
                                    {expandedOrder === order.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedOrder === order.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-200 bg-white px-6 py-4"
                                    >
                                        <div className="space-y-4">
                                            {order.shipping_address && (
                                                <div className="bg-gray-50 p-3 rounded-lg text-sm mb-4">
                                                    <p className="font-bold text-gray-700 mb-1">Shipping Audress:</p>
                                                    <p className="text-gray-600">{order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state}</p>
                                                </div>
                                            )}

                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                                                    <div className="relative w-16 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                        {item.book_cover_url ? (
                                                            <Image src={item.book_cover_url} alt={item.book_title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                                <Package size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-800 line-clamp-1">{item.book_title}</h4>
                                                        <p className="text-sm text-gray-500">{item.book_author}</p>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                                            <span className="font-bold text-primary">${Number(item.price).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
