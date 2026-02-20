"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface FavoritesContextType {
    favorites: string[]; // List of Book IDs
    toggleFavorite: (bookId: string) => Promise<void>;
    isFavorite: (bookId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth(); // AuthContext only exposes user
    const [favorites, setFavorites] = useState<string[]>([]);

    // Fetch favorites when user logs in
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) {
                setFavorites([]);
                return;
            }

            const storedToken = localStorage.getItem("token");
            if (!storedToken) return;

            try {
                const res = await fetch("http://localhost:8000/api/users/me/favorites", {
                    headers: {
                        "Authorization": `Bearer ${storedToken}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Assuming data is an array of Book objects, we extract IDs
                    // Based on backend/app/api/users.py: response_model=List[BookResponse]
                    const ids = data.map((book: any) => book.id);
                    setFavorites(ids);
                }
            } catch (error) {
                console.error("Failed to fetch favorites", error);
            }
        };

        fetchFavorites();
    }, [user]);

    const toggleFavorite = async (bookId: string) => {
        if (!user) {
            // Logic to redirect to login is handled by the component usually, 
            // but we can enforce it here or just return.
            return;
        }

        const storedToken = localStorage.getItem("token");
        if (!storedToken) return;

        const isCurrentlyFavorite = favorites.includes(bookId);

        try {
            if (isCurrentlyFavorite) {
                // Remove
                const res = await fetch(`http://localhost:8000/api/users/me/favorites/${bookId}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${storedToken}`
                    }
                });
                if (res.ok || res.status === 204) {
                    setFavorites(prev => prev.filter(id => id !== bookId));
                }
            } else {
                // Add
                const res = await fetch(`http://localhost:8000/api/users/me/favorites/${bookId}`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${storedToken}`,
                        "Content-Type": "application/json"
                    }
                });
                if (res.ok) {
                    setFavorites(prev => [...prev, bookId]);
                }
            }
        } catch (error) {
            console.error("Error toggling favorite", error);
        }
    };

    const isFavorite = (bookId: string) => favorites.includes(bookId);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error("useFavorites must be used within a FavoritesProvider");
    }
    return context;
}
