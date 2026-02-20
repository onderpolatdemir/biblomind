"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CheckoutPage() {
    const { cart, isLoading, updateQuantity, removeFromCart, refreshCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/auth/login");
        } else {
            // Ensure fresh data on mount
            refreshCart();
        }
    }, [router, refreshCart]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="max-w-7xl mx-auto px-8 md:px-16 py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="max-w-7xl mx-auto px-8 md:px-16 py-12 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
                    <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
                    <Link
                        href="/categories"
                        className="inline-flex items-center gap-2 bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-primary/30"
                    >
                        Start Shopping <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                    <Link href="/home" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span className="font-bold text-text">Checkout</span>
                </div>

                <h1 className="text-3xl font-heading font-bold text-text mb-8">Shopping Cart ({cart.total_items} items)</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Items List */}
                    <div className="flex-1 space-y-4">
                        {cart.items.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                                {/* Product Image */}
                                <div className="relative w-24 h-32 md:w-32 md:h-40 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                                    <Image
                                        src={item.book?.cover_url || "/book-placeholder.jpg"}
                                        alt={item.book?.title || "Book Cover"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 w-full text-center md:text-left">
                                    <h3 className="text-lg font-bold text-text font-heading mb-1 w-full truncate">{item.book?.title}</h3>
                                    <p className="text-sm text-gray-500 mb-2">{item.book?.author}</p>
                                    <p className="text-sm text-green-600 font-medium mb-4">
                                        {item.book?.stock > 0 ? `In Stock (${item.book.stock} available)` : "Out of Stock"}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <div className="flex items-center bg-gray-100 rounded-lg">
                                            <button
                                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                disabled={item.quantity <= 1}
                                                className="p-2 text-gray-500 hover:text-text disabled:opacity-30 transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="font-bold w-8 text-center text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                disabled={item.quantity >= item.book?.stock}
                                                className="p-2 text-gray-500 hover:text-text disabled:opacity-30 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                            title="Remove item"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="text-right min-w-[100px]">
                                    <div className="text-xl font-bold text-accent">${Number(item.subtotal).toFixed(2)}</div>
                                    <div className="text-sm text-gray-400">${item.book?.price} each</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-96">
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-bold text-text mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">${Number(cart.total_price).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax (Estimated)</span>
                                    <span className="font-medium">${(Number(cart.total_price) * 0.08).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                                    <span className="font-bold text-lg text-text">Total</span>
                                    <span className="font-bold text-2xl text-accent pb-1">
                                        ${(Number(cart.total_price) * 1.08).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <button className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2">
                                Proceed to Checkout <ArrowRight size={20} />
                            </button>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                Secure checkout powered by Stripe
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
