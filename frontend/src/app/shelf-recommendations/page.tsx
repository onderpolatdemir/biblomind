"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import api from "@/lib/api";

type ShelfAnalysisHistory = {
    id: string;
    image_path: string;
    created_at: string;
    total_books: number;
    total_recommendations: number;
    shelf_analysis: any;
};

export default function ShelfRecommendationsGallery() {
    const router = useRouter();
    const [history, setHistory] = useState<ShelfAnalysisHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get("/vision/vision/shelf-analyses");
                setHistory(response.data);
            } catch (error) {
                console.error("Failed to fetch shelf analysis history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

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

    return (
        <div className="min-h-screen bg-background flex flex-col font-body">
            <Header />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text mb-4">
                            My Shelf Analyses
                        </h1>
                        <p className="text-lg text-gray-600">
                            A history of the bookshelves you've analyzed. Click on a photo to see the specific recommendations generated for it.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push("/")}
                        className="bg-accent text-white px-8 py-3 rounded-full font-bold hover:bg-accent/90 transition-all font-body whitespace-nowrap shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    >
                        + Analyze New Shelf
                    </button>
                </motion.div>

                {history.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    >
                        {history.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => router.push(`/shelf-recommendations/${item.id}`)}
                                className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-secondary/20 flex flex-col h-[350px]"
                            >
                                <div className="relative w-full h-48 bg-secondary/10 overflow-hidden">
                                    <Image
                                        src={`http://localhost:8000${item.image_path}`}
                                        alt="Bookshelf"
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        unoptimized // using dev server
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <p className="text-white font-bold">View Results &rarr;</p>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-text line-clamp-1">
                                            {item.total_recommendations} Recommendations
                                        </h3>
                                        <span className="text-xs font-medium bg-secondary/30 text-accent px-2 py-1 rounded-md">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-auto">
                                        {item.total_books} books detected in photo.
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-secondary/10 rounded-[3rem] p-12 text-center flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-secondary"
                    >
                        <div className="text-6xl mb-6 opacity-80">📸</div>
                        <h2 className="text-3xl font-heading font-bold text-text mb-4">
                            You haven't analyzed any shelves yet!
                        </h2>
                        <p className="text-gray-500 mb-8 max-w-md text-lg">
                            Upload a photo of your bookshelf from the home page, and our AI will build a personalized gallery of recommendations for you here.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="bg-text text-white px-8 py-3 rounded-full font-bold hover:bg-text/90 transition-all font-body text-lg"
                        >
                            Try it out
                        </button>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
