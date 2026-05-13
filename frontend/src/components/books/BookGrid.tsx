"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import BookCard from "@/components/ui/BookCard";

// Define strict interface matching our API response
interface Book {
    id: string;
    title: string;
    author: string;
    price: number;
    rating?: number; // Optional as API might not return it yet
    reviews_count?: number;
    cover_url?: string;
}

interface BookGridProps {
    books: Book[];
    isLoading: boolean;
}

export default function BookGrid({ books: initialBooks, isLoading, genre }: BookGridProps & { genre: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // State for client-side pagination
    const [displayedBooks, setDisplayedBooks] = useState<Book[]>(initialBooks);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Reset state when initialBooks changes (e.g. filters applied)
    useEffect(() => {
        setDisplayedBooks(initialBooks);
        setPage(1);
        setHasMore(initialBooks.length === 20); // If less than 20, probably no more pages
    }, [initialBooks]);

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (value === "newest") {
            params.set("sort_by", "created_at");
            params.set("sort_order", "desc");
        } else if (value === "price_asc") {
            params.set("sort_by", "price");
            params.set("sort_order", "asc");
        } else if (value === "price_desc") {
            params.set("sort_by", "price");
            params.set("sort_order", "desc");
        }

        router.push(`?${params.toString()}`);
    };

    const handleLoadMore = async () => {
        setLoadingMore(true);
        const nextPage = page + 1;
        const params = new URLSearchParams(searchParams.toString());

        // Ensure genre is set
        params.set("genre", genre);
        params.set("page", nextPage.toString());
        params.set("page_size", "20");

        try {
            const res = await fetch(`http://localhost:8000/api/books?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                const newBooks = data.items || [];

                if (newBooks.length > 0) {
                    setDisplayedBooks(prev => [...prev, ...newBooks]);
                    setPage(nextPage);
                    setHasMore(newBooks.length === 20);
                } else {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error("Failed to load more books", error);
        } finally {
            setLoadingMore(false);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-96 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (displayedBooks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-4xl">
                    📚
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No books found</h3>
                <p className="text-gray-500 max-w-md">
                    We couldn't find any books matching your criteria. Try adjusting your filters.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-500 text-sm">
                    Showing <span className="font-bold text-text">{displayedBooks.length}</span> books
                </p>

                <div className="flex gap-2">
                    <select
                        onChange={handleSortChange}
                        className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-primary"
                        defaultValue="newest"
                    >
                        <option value="newest">Newest</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                    </select>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded shadow-sm transition-colors ${viewMode === "grid" ? "bg-white text-primary" : "text-gray-400 hover:text-text"}`}
                        >
                            {/* Grid Icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded shadow-sm transition-colors ${viewMode === "list" ? "bg-white text-primary" : "text-gray-400 hover:text-text"}`}
                        >
                            {/* List Icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            </div>

            <motion.div
                layout
                className={`gap-6 ${viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col space-y-4"
                    }`}
            >
                {displayedBooks.map((book) => (
                    <div key={book.id} className="h-full">
                        <BookCard
                            id={book.id}
                            title={book.title}
                            author={book.author}
                            price={Number(book.price)}
                            rating={book.rating}
                            reviews_count={book.reviews_count}
                            imageSrc={book.cover_url || "/book-placeholder.jpg"}
                        // variant={viewMode} // If BookCard supports variant
                        />
                    </div>
                ))}
            </motion.div>

            {hasMore && (
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="bg-primary/10 text-primary font-bold py-3 px-8 rounded-xl hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                    >
                        {loadingMore ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}
        </div>
    );
}
