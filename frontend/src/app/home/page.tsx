"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { Camera } from "lucide-react";

type Book = {
    id: string;
    title: string;
    author: string;
    price: number;
    cover_url: string;
    rating?: number;
    reviews_count?: number;
};

export default function HomePage() {
    const router = useRouter();
    const [books, setBooks] = useState<Book[]>([]);
    const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await api.get("/recommendations?strategy=hybrid&limit=6");
                const items = response.data.recommendations ?? response.data.items ?? [];
                setRecommendedBooks(items.map((r: any) => r.book ?? r));
            } catch {
                try {
                    const fallback = await api.get("/books?page=1&page_size=6");
                    setRecommendedBooks(fallback.data.items ?? []);
                } catch {
                    setRecommendedBooks([]);
                }
            } finally {
                setIsLoadingRecs(false);
            }
        };
        fetchRecommendations();
    }, []);

    const handleSeeAll = () => {
        if (CATEGORIES.length > 0) {
            router.push(CATEGORIES[0].href);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-body">
            <Header />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-12">

                {/* Hero / Upload Container */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                    className="relative bg-secondary/30 rounded-[3rem] p-8 md:p-16 mb-24 overflow-hidden min-h-[500px] flex items-center justify-center"
                >
                    <motion.div
                        key="hero"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col md:flex-row items-center gap-12 relative z-10 w-full"
                    >
                        {/* Left Content */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-heading font-bold text-text mb-6 leading-tight">
                                Let's see if we know <br /> you well enough?
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-xl leading-relaxed">
                                Confused about what to read? Upload a photo of your bookshelf and let AI find your perfect next book.
                            </p>

                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <button
                                    onClick={() => router.push("/shelf-recommendations")}
                                    className="group relative flex items-center gap-3 bg-text text-white px-8 py-4 rounded-full font-bold hover:bg-accent transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 z-20"
                                >
                                    <Camera size={22} />
                                    <span>Try Shelf Match</span>
                                </button>
                            </div>
                        </div>

                        {/* Right Visual */}
                        <div className="flex-1 w-full flex justify-center md:justify-end gap-4 relative h-80 md:h-96 items-end">
                            <div className="relative w-32 h-64 md:w-40 md:h-80 bg-white rounded-t-full shadow-lg overflow-hidden transform translate-y-8">
                                <Image src="/lotr.png" alt="Book 1" fill className="object-cover opacity-90 hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="relative w-40 h-72 md:w-48 md:h-96 bg-white rounded-t-full shadow-2xl overflow-hidden z-10 -ml-8 border-4 border-secondary">
                                <Image src="/nutuk.png" alt="Book 2" fill className="object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="relative w-32 h-64 md:w-40 md:h-80 bg-white rounded-t-full shadow-lg overflow-hidden transform translate-y-8 -ml-8">
                                <Image src="/hp.png" alt="Book 3" fill className="object-cover opacity-90 hover:scale-105 transition-transform duration-500" />
                            </div>
                        </div>
                    </motion.div>
                </motion.section>

                {/* Browse by Category */}
                <section className="mb-16">
                    <div className="flex justify-between items-end mb-8">
                        <h2 className="text-3xl font-heading font-bold text-text">Browse by Category</h2>
                        <a href="/categories" className="text-accent font-medium hover:underline">
                            All categories &rarr;
                        </a>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {CATEGORIES.slice(0, 10).map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <a
                                    key={cat.name}
                                    href={cat.href}
                                    className="group flex flex-col items-center gap-2 py-5 px-3 bg-white border border-gray-100 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-all text-center shadow-sm hover:shadow-md"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <Icon size={18} className="text-primary" />
                                    </div>
                                    <span className="text-sm font-semibold text-text leading-tight">{cat.name}</span>
                                </a>
                            );
                        })}
                    </div>
                </section>

                {/* Recommended For You Section */}
                <section>
                    <div className="flex justify-between items-end mb-8">
                        <h2 className="text-3xl font-heading font-bold text-text">Recommended For You</h2>
                        <button
                            onClick={handleSeeAll}
                            className="text-accent font-medium hover:underline"
                        >
                            See all &rarr;
                        </button>
                    </div>

                    {isLoadingRecs ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedBooks.map((book) => (
                                <BookCard
                                    key={book.id}
                                    id={book.id}
                                    title={book.title}
                                    author={book.author || "Unknown Author"}
                                    rating={book.rating || 4.5}
                                    reviews_count={book.reviews_count}
                                    price={Number(book.price)}
                                    imageSrc={book.cover_url || "/hp.png"}
                                />
                            ))}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
