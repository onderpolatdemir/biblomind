"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";

export default function PaymentPage() {
    const router = useRouter();
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Retrieve payment content from local storage
        const paymentContent = localStorage.getItem("paymentContent");

        if (!paymentContent) {
            router.push("/checkout");
            return;
        }

        // Render the HTML content (Iyzico script/form)
        if (contentRef.current) {
            // Setup a safe way to inject the script
            const container = contentRef.current;
            container.innerHTML = paymentContent;

            // Execute scripts in the injected HTML (innerHTML doesn't auto-execute scripts)
            const scripts = container.querySelectorAll("script");
            scripts.forEach((oldScript) => {
                const newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach((attr) => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                if (oldScript.parentNode) {
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                }
            });
        }

        // Cleanup on unmount (optional)
        return () => {
            // localStorage.removeItem("paymentContent"); // Uncomment if we want to clear it
        };
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Payment</h1>
                <div
                    id="iyzipay-checkout-form"
                    className="bg-white p-6 rounded-xl shadow-sm min-h-[400px] flex justify-center items-center"
                    ref={contentRef}
                >
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        </div>
    );
}
