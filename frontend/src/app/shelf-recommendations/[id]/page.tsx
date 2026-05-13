"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import api from "@/lib/api";

type RecommendationData = {
    title: string;
    author: string;
    match_score: number;
    reason: string;
    in_our_store: boolean;
    book_id: string; // The UUID
    price: number;
    cover_url: string;
};

type FullBookData = {
    id: string;
    title: string;
    author: string;
    price: number;
    cover_url: string;
    rating?: number;
    reviews_count?: number;
};

export default function ShelfAnalysisDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [originalResponse, setOriginalResponse] = useState<any>(null);
    const [realBooks, setRealBooks] = useState<{ rec: RecommendationData; bookData: FullBookData | null }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysisDetail = async () => {
            if (!id) return;

            try {
                // Fetch the saved JSON for this exact analysis
                const res = await api.get(`/vision/shelf-analyses/${id}`);
                const parsed = res.data;
                setOriginalResponse(parsed);

                const recs: RecommendationData[] = parsed.recommendations || [];

                // Fetch real DB data for every recommended book
                const fetchedBooks = await Promise.all(
                    recs.map(async (rec) => {
                        try {
                            if (!rec.book_id) return { rec, bookData: null };
                            const response = await api.get(`/books/${rec.book_id}`);
                            return { rec, bookData: response.data };
                        } catch (err) {
                            console.error(`Failed to fetch real book data for ${rec.book_id}`, err);
                            return { rec, bookData: null };
                        }
                    })
                );

                setRealBooks(fetchedBooks.filter(item => item.bookData !== null)); // Only show valid books
            } catch (e) {
                console.error("Failed to fetch shelf analysis detail", e);
                // Redirect back to gallery on error (e.g., 404)
                router.push("/shelf-recommendations");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysisDetail();
    }, [id, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col font-body">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!originalResponse) {
        return null; // Should redirect from the catch block
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-body">
            <Header />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-12">

                {/* Back button */}
                <button
                    onClick={() => router.push('/shelf-recommendations')}
                    className="mb-8 flex items-center text-gray-500 hover:text-accent font-medium transition-colors"
                >
                    &larr; Back to Gallery
                </button>

                <div className="flex flex-col lg:flex-row gap-12 mb-16">
                    {/* Left: Original Photo */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-1/3"
                    >
                        <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                            <Image
                                src={`http://localhost:8000${originalResponse.image_path}`}
                                alt="Your Bookshelf"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    </motion.div>

                    {/* Right: Analysis & Text */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-2/3 flex flex-col justify-center text-center lg:text-left"
                    >
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text mb-6">
                            Bookshelf Match Results
                        </h1>
                        <div className="bg-secondary/20 p-8 rounded-3xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/30 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <p className="text-xl text-text font-medium leading-relaxed italic relative z-10">
                                "{originalResponse.shelf_analysis?.reading_style || "A fascinating mix of genres and authors."}"
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-4">
                            {originalResponse.shelf_analysis?.dominant_genres?.slice(0, 3).map((genre: string, idx: number) => (
                                <span key={idx} className="bg-accent/10 text-accent font-bold px-4 py-2 rounded-full text-sm">
                                    {genre}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            {originalResponse.detected_books?.length || 0} books were identified from this image.
                        </p>
                    </motion.div>
                </div>

                <div className="w-full h-px bg-secondary/30 mb-16"></div>

                <h2 className="text-3xl font-heading font-bold text-text mb-8 text-center md:text-left">
                    Custom Recommendations For You
                </h2>

                {realBooks.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    >
                        {realBooks.map(({ rec, bookData }) => (
                            <div key={rec.book_id} className="flex flex-col">
                                <BookCard
                                    id={bookData!.id}
                                    title={bookData!.title}
                                    author={bookData!.author}
                                    rating={bookData!.rating || 5}
                                    reviews_count={bookData!.reviews_count || 1}
                                    price={Number(bookData!.price) || 29.99}
                                    imageSrc={bookData!.cover_url || "/hp.png"}
                                />
                                <div className="mt-4 p-4 bg-white border border-secondary/30 rounded-xl text-sm text-gray-700 shadow-sm flex-1">
                                    <span className="font-bold text-accent mr-2">Why this?</span>
                                    {rec.reason}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-secondary/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]"
                    >
                        <div className="text-5xl mb-6 opacity-80">🌱</div>
                        <h2 className="text-xl font-bold text-text mb-4">
                            We need to know you better!
                        </h2>
                        <p className="text-gray-500 max-w-md mb-6 leading-relaxed">
                            It looks like your reading profile is completely empty. To give you accurate, personalized recommendations from this bookshelf, we first need to understand your taste.
                        </p>
                        <ul className="text-left text-gray-600 mb-8 space-y-2">
                            <li>❤️ Add some books to your favorites</li>
                            <li>🛒 Order books you've read before</li>
                            <li>⭐ Rate or review books</li>
                        </ul>
                        <button
                            onClick={() => router.push('/shop')}
                            className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-primary/90 transition-all font-body"
                        >
                            Explore Books
                        </button>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
