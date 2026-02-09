"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

// Types matching backend schemas
export interface CartItem {
    id: string; // UUID
    book_id: string; // UUID
    quantity: number;
    price_at_addition: number;
    subtotal: number;
    book: {
        id: string;
        title: string;
        author: string;
        price: number;
        cover_url: string;
        stock: number;
    };
}

export interface Cart {
    id: string;
    items: CartItem[];
    total_price: number;
    total_items: number;
}

interface CartContextType {
    cart: Cart | null;
    isLoading: boolean;
    addToCart: (bookId: string, quantity?: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [cart, setCart] = useState<Cart | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCart = async () => {
        if (!user) {
            setCart(null);
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch("http://localhost:8000/api/cart/", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCart(data);
            }
        } catch (error) {
            console.error("Failed to fetch cart", error);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [user]);

    const addToCart = async (bookId: string, quantity: number = 1) => {
        const token = localStorage.getItem("token");
        if (!token) {
            // Usually redirect to login or show error
            // checks should be done in UI component
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/api/cart/add", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ book_id: bookId, quantity })
            });

            if (res.ok) {
                const updatedCart = await res.json();
                setCart(updatedCart);
            }
        } catch (error) {
            console.error("Failed to add to cart", error);
        }
    };

    const removeFromCart = async (itemId: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:8000/api/cart/item/${itemId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const updatedCart = await res.json();
                setCart(updatedCart);
            }
        } catch (error) {
            console.error("Failed to remove item", error);
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:8000/api/cart/item/${itemId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ quantity })
            });

            if (res.ok) {
                const updatedCart = await res.json();
                setCart(updatedCart);
            }
        } catch (error) {
            console.error("Failed to update quantity", error);
        }
    };

    const clearCart = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch("http://localhost:8000/api/cart/clear", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const updatedCart = await res.json();
                setCart(updatedCart);
            }
        } catch (error) {
            console.error("Failed to clear cart", error);
        }
    };

    return (
        <CartContext.Provider value={{
            cart,
            isLoading,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            refreshCart: fetchCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
