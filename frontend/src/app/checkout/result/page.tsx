"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight, Home } from "lucide-react";
import Header from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";

export default function CheckoutResultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { refreshCart } = useCart();

    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const errorMessage = searchParams.get("errorMessage");

    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (status === "success") {
            setIsSuccess(true);
            // Refresh cart to show it's empty (since items moved to order)
            refreshCart();
        } else {
            setIsSuccess(false);
        }
    }, [status, refreshCart]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-3xl mx-auto px-4 py-16">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 text-center">
                    {isSuccess ? (
                        <>
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">Payment Successful!</h1>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                Thank you for your purchase. Your order has been confirmed and will be shipped soon.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/orders"
                                    className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-primary/30"
                                >
                                    View My Orders <ArrowRight size={18} />
                                </Link>
                                <Link
                                    href="/home"
                                    className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    <Home size={18} /> Back to Home
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <XCircle className="w-10 h-10 text-red-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">Payment Failed</h1>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                We couldn't process your payment.
                                {errorMessage && <span className="block mt-2 font-medium text-red-500">{errorMessage}</span>}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => router.push("/checkout")}
                                    className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-primary/30"
                                >
                                    Try Again <ArrowRight size={18} />
                                </button>
                                <Link
                                    href="/home"
                                    className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    <Home size={18} /> Back to Home
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
