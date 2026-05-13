"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AddressModal from "@/components/checkout/AddressModal";
import { Address } from "@/types/address";

export default function CheckoutPage() {
    const { cart, isLoading, updateQuantity, removeFromCart, refreshCart } = useCart();
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const router = useRouter();

    const handleAddressSelect = (address: Address) => {
        setShowAddressModal(false);
        handlePayment(address);
    };

    const handlePayment = async (shippingAddress?: Address) => {
        if (!cart || !user) return;

        // If no address passed, open modal to force selection
        if (!shippingAddress) {
            setShowAddressModal(true);
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Create/Get Pending Order
            const token = localStorage.getItem("token");

            // Create order from cart
            const orderRes = await fetch("http://localhost:8000/api/orders/create", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    shipping_address: {
                        full_name: user.full_name,
                        address: shippingAddress.street,
                        city: shippingAddress.city,
                        state: shippingAddress.state,
                        country: shippingAddress.country,
                        postal_code: shippingAddress.postal_code,
                        description: shippingAddress.name // Using 'name' (e.g. Home) as description
                    }
                })
            });

            if (!orderRes.ok) throw new Error("Failed to create order");
            const orderData = await orderRes.json();

            // 2. Initialize Payment
            const paymentRes = await fetch("http://localhost:8000/api/payment/initialize", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    order_id: orderData.id
                })
            });

            if (!paymentRes.ok) throw new Error("Failed to initialize payment");
            const paymentData = await paymentRes.json();

            // 3. Render Payment Page
            if (paymentData.payment_page_url.startsWith("http")) {
                window.location.href = paymentData.payment_page_url;
            } else {
                // Store HTML content and redirect to payment rendering page
                localStorage.setItem("paymentContent", paymentData.payment_page_url);
                router.push("/checkout/payment");
            }

        } catch (error) {
            console.error("Payment error:", error);
            alert("Payment initialization failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/auth/login");
        } else {
            // Ensure fresh data on mount
            refreshCart();
        }
    }, [router, refreshCart]);

    useEffect(() => {
        if (cart && cart.items.length > 0) {
            const cartBookIds = cart.items.map(i => i.book?.id).filter(Boolean);
            if (cartBookIds.length > 0) {
                fetch("http://localhost:8000/api/recommendations/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(cartBookIds)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.recommendations) {
                        setRecommendations(data.recommendations);
                    }
                })
                .catch(err => console.error("Error fetching checkout recommendations:", err));
            }
        }
    }, [cart]);

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

                            <button
                                onClick={() => setShowAddressModal(true)}
                                disabled={isProcessing}
                                className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        Proceed to Checkout <ArrowRight size={20} />
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                Secure checkout powered by Stripe
                            </p>
                        </div>
                    </div>
                </div>

                {/* Frequently Bought Together / Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mt-16 animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold font-heading text-text flex items-center md:justify-start justify-center gap-2">
                                You Might Also Like
                            </h2>
                            <p className="text-sm text-gray-500 text-center md:text-left mt-1">
                                Add these highly recommended books to your current order
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                            {recommendations.map((rec) => (
                                <Link 
                                    key={rec.book.id} 
                                    href={`/books/${rec.book.id}`} 
                                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="relative w-28 h-40 md:w-32 md:h-48 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                                        <Image
                                            src={rec.book.cover_url || "/book-placeholder.jpg"}
                                            alt={rec.book.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <h3 className="text-sm font-bold text-text mb-1 w-full truncate text-center group-hover:text-primary transition-colors">{rec.book.title}</h3>
                                    <p className="text-xs text-gray-500 mb-2 truncate text-center w-full">{rec.book.author}</p>
                                    <div className="text-sm font-bold text-accent mb-3">${Number(rec.book.price).toFixed(2)}</div>
                                    <div className="mt-auto text-[11px] text-gray-500 text-center px-2 bg-blue-50/50 rounded-md py-2 line-clamp-3 w-full border border-blue-100/50 italic leading-relaxed">
                                        "{rec.explanation}"
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <AddressModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onSelect={handleAddressSelect}
            />
        </div>
    );
}
