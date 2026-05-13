"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import Link from "next/link";
import { Search, X, SlidersHorizontal, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/constants";
import api from "@/lib/api";

interface SearchBook {
    id: string;
    title: string;
    author: string;
    price: number;
    cover_url?: string;
    genres?: string[];
    rating?: number;
    _score?: number;
}

const SORT_OPTIONS = [
    { value: "relevance", label: "Most Relevant" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "rating", label: "Top Rated" },
];

const PAGE_SIZE = 20;

export default function SearchPageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <SearchPage />
        </Suspense>
    );
}

function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const initialQ = searchParams.get("q") ?? "";
    const initialGenre = searchParams.get("genre") ?? "";

    const [query, setQuery] = useState(initialQ);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
    const [genre, setGenre] = useState(initialGenre);
    const [sort, setSort] = useState("relevance");
    const [page, setPage] = useState(1);

    const [results, setResults] = useState<SearchBook[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showFilters, setShowFilters] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);

    // Debounce input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    // Reset to page 1 when search params change
    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, genre, sort]);

    // Sync URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (genre) params.set("genre", genre);
        router.replace(`/search?${params.toString()}`, { scroll: false });
    }, [debouncedQuery, genre, router]);

    const fetchResults = useCallback(async () => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            setTotal(0);
            setTotalPages(0);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number> = {
                q: debouncedQuery,
                page,
                page_size: PAGE_SIZE,
            };
            if (genre) params.genre = genre;

            const res = await api.get("/books/search", { params });
            let items: SearchBook[] = res.data.items ?? [];

            // Client-side sort for price / rating since ES returns by relevance
            if (sort === "price_asc") items = [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
            else if (sort === "price_desc") items = [...items].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
            else if (sort === "rating") items = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

            setResults(items);
            setTotal(res.data.total ?? 0);
            setTotalPages(res.data.total_pages ?? 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Search service is unavailable.";
            setError(msg);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedQuery, genre, sort, page]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const clearQuery = () => {
        setQuery("");
        inputRef.current?.focus();
    };

    const selectedSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-10">

                {/* Search Bar */}
                <div className="relative max-w-3xl mx-auto mb-8">
                    <div className="flex items-center gap-3 bg-white border-2 border-gray-200 focus-within:border-primary rounded-2xl px-5 py-3.5 shadow-sm transition-all">
                        <Search size={20} className="text-gray-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search books by title, author, topic…"
                            className="flex-1 bg-transparent text-text placeholder-gray-400 text-base outline-none"
                            autoFocus
                        />
                        {query && (
                            <button onClick={clearQuery} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    {/* AI hint */}
                    <p className="text-center mt-2 text-xs text-gray-400 flex items-center justify-center gap-1">
                        <Sparkles size={11} className="text-primary" />
                        Powered by Elasticsearch — supports fuzzy matching and semantic relevance
                    </p>
                </div>

                {/* Filter + Sort Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters((v) => !v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${showFilters ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-600 hover:border-primary/50"}`}
                    >
                        <SlidersHorizontal size={15} /> Filters
                    </button>

                    {/* Genre Pills */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex flex-wrap gap-2 overflow-hidden"
                            >
                                <button
                                    onClick={() => setGenre("")}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${!genre ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-600 hover:border-primary/50"}`}
                                >
                                    All
                                </button>
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.name}
                                        onClick={() => setGenre(genre === cat.name ? "" : cat.name)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${genre === cat.name ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-600 hover:border-primary/50"}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="ml-auto relative">
                        <button
                            onClick={() => setSortOpen((v) => !v)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:border-primary/50 transition-all"
                        >
                            {selectedSortLabel} <ChevronDown size={14} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                            {sortOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg py-1 z-20 min-w-[180px]"
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setSort(opt.value); setSortOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${sort === opt.value ? "text-primary font-bold bg-primary/5" : "text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Active filters chips */}
                {(genre) && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {genre && (
                            <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                                {genre}
                                <button onClick={() => setGenre("")}><X size={12} /></button>
                            </span>
                        )}
                    </div>
                )}

                {/* Results Header */}
                {debouncedQuery && !isLoading && (
                    <p className="text-sm text-gray-500 mb-6">
                        {total > 0
                            ? <><span className="font-bold text-text">{total.toLocaleString()} results</span> for &ldquo;{debouncedQuery}&rdquo;{genre ? ` in ${genre}` : ""}</>
                            : <>No results for &ldquo;{debouncedQuery}&rdquo;</>
                        }
                    </p>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 mb-8">
                        <p className="font-bold mb-1">Search unavailable</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Loading Skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className="aspect-[2/3] bg-gray-100 rounded-2xl animate-pulse" />
                                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State (no query) */}
                {!debouncedQuery && !isLoading && (
                    <div className="text-center py-20">
                        <Search size={56} className="text-gray-200 mx-auto mb-4" />
                        <h2 className="text-2xl font-heading font-bold text-text mb-2">Search the Library</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Type anything — a title, author, topic or even a misspelled word. Elasticsearch handles the rest.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {["dystopian fiction", "1984 Orwell", "magic realism", "self help"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setQuery(s)}
                                    className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-primary hover:text-primary transition-all font-medium"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Results */}
                {debouncedQuery && !isLoading && !error && results.length === 0 && (
                    <div className="text-center py-20">
                        <Search size={48} className="text-gray-200 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-text mb-2">No books found</h2>
                        <p className="text-gray-500 mb-6">Try different keywords or remove genre filters.</p>
                        {genre && (
                            <button onClick={() => setGenre("")} className="px-5 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-all text-sm">
                                Clear genre filter
                            </button>
                        )}
                    </div>
                )}

                {/* Results Grid */}
                {!isLoading && results.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                            {results.map((book) => (
                                <div key={book.id} className="relative">
                                    {book._score != null && book._score > 5 && (
                                        <div className="absolute top-2 left-2 z-10 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            Top Match
                                        </div>
                                    )}
                                    <BookCard
                                        id={book.id}
                                        title={book.title}
                                        author={book.author ?? ""}
                                        price={Number(book.price ?? 0)}
                                        rating={book.rating ?? 4}
                                        imageSrc={book.cover_url ?? "/book-placeholder.jpg"}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 transition-all"
                                >
                                    ← Prev
                                </button>
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    const p = page <= 4 ? i + 1 : page - 3 + i;
                                    if (p < 1 || p > totalPages) return null;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${p === page ? "bg-primary text-white" : "border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"}`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 transition-all"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
