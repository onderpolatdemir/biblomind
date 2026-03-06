"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Info } from "lucide-react";

interface Book {
    id: string;
    title: string;
    author: string;
    price: number;
    rating?: number;
    reviews_count?: number;
    cover_url?: string;
    stock?: number;
}

interface RecommendationResponse {
    book: Book;
    score: number;
    explanation: string;
    match_reasons?: string[];
}

export default function RecommendationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
    const [hasHistory, setHasHistory] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRecommendations = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const recRes = await fetch("http://localhost:8000/api/recommendations?limit=20&strategy=hybrid", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (recRes.ok) {
                const data = await recRes.json();
                // The API returns { recommendations: [...], user_has_history: bool, ... }
                const items = data.recommendations || [];
                setRecommendations(items);
                setHasHistory(data.user_has_history);
            } else {
                console.error("Failed to fetch recommendations");
                setHasHistory(false);
            }
        } catch (error) {
            console.error("Error in recommendations pipeline:", error);
            setHasHistory(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, [router]);

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
        <div className="min-h-screen bg-white font-body">
            <Header />

            <main className="max-w-7xl mx-auto px-8 md:px-16 py-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                    <Link href="/home" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span className="font-bold text-text">Recommendations</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-heading font-bold text-text">For You</h1>
                </div>

                {recommendations.length === 0 ? (
                    hasHistory === false ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-primary/5 rounded-3xl border border-primary/20">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm text-4xl text-primary">
                                <Info size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">We need to know you better!</h3>
                            <p className="text-gray-600 max-w-lg mb-8 leading-relaxed">
                                Your recommendation list is currently empty because you don't have enough history.
                                To give you personalized AI-powered book recommendations, we need to understand your taste.
                                Start exploring our catalog, and add some books to your <b>Favorites</b> or place an <b>Order</b>!
                            </p>
                            <Link
                                href="/categories"
                                className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-primary/30"
                            >
                                Explore Books
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-3xl border border-gray-100">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm text-4xl">
                                📚
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Finding your next read...</h3>
                            <p className="text-gray-500 max-w-md mb-8">
                                We are analyzing your preferences to find the best books for you. Please check back later!
                            </p>
                        </div>
                    )
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {recommendations.map((rec) => (
                            <div key={rec.book.id} className="flex flex-col group relative h-full">
                                <div className="flex-grow flex flex-col">
                                    <BookCard
                                        id={rec.book.id}
                                        title={rec.book.title}
                                        author={rec.book.author || "Unknown"}
                                        price={Number(rec.book.price) || 0}
                                        rating={rec.book.rating || 4.5}
                                        reviews_count={rec.book.reviews_count || 0}
                                        imageSrc={rec.book.cover_url || "/book-placeholder.jpg"}
                                    />
                                </div>
                                {rec.explanation && (
                                    <div className="mt-4 bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 flex items-start gap-3 shadow-sm flex-shrink-0">
                                        <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
                                        <p className="leading-relaxed font-medium">{rec.explanation}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
