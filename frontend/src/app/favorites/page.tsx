"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { Heart } from "lucide-react";
import api from "@/lib/api";

interface Book {
    id: string;
    title: string;
    author: string;
    price: number;
    rating?: number;
    cover_url?: string;
    isbn?: string;
}

export default function FavoritesPage() {
    const { user } = useAuth();
    const { favorites: favoriteIds } = useFavorites();
    const router = useRouter();
    const [favorites, setFavorites] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFavorites = async () => {
        if (!user) {
            router.push("/auth/login");
            return;
        }
        try {
            const res = await api.get("/users/me/favorites");
            setFavorites(res.data ?? []);
        } catch {
            setFavorites([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    // favoriteIds değişince (toggle sonrası) listeyi yenile
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, favoriteIds.length]);

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

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="max-w-7xl mx-auto px-8 md:px-16 py-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                    <Link href="/home" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span className="font-bold text-text">Favorites</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <Heart className="w-8 h-8 text-red-500 fill-current" />
                    <h1 className="text-3xl font-heading font-bold text-text">My Favorites</h1>
                    <span className="text-gray-400 text-lg">({favorites.length})</span>
                </div>

                {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm text-4xl">
                            💔
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No favorites yet</h3>
                        <p className="text-gray-500 max-w-md mb-8">
                            You haven't added any books to your favorites list yet. Explore our collection and save items you love!
                        </p>
                        <Link
                            href="/home"
                            className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-primary/30"
                        >
                            Start Exploring
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {favorites.map((book) => (
                            <div key={book.id} className="h-full">
                                <BookCard
                                    id={book.id}
                                    title={book.title}
                                    author={book.author}
                                    price={Number(book.price)}
                                    rating={book.rating || 4.5}
                                    imageSrc={book.cover_url || "/book-placeholder.jpg"}
                                    onToggle={fetchFavorites}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
