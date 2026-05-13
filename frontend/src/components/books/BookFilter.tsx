"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Book, Brain, Rocket, Sparkles, Search,
    Ghost, Heart, PenTool, Landmark, FlaskConical,
    Leaf, Feather, Baby, User, Scroll, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { CATEGORIES } from "@/lib/constants";

interface BookFilterProps {
    selectedCategory: string;
    onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
    title: string | null;
    author: string | null;
    minPrice: number;
    maxPrice: number;
}

const INITIAL_VISIBLE = 8;

export default function BookFilter({ selectedCategory, onFilterChange }: BookFilterProps) {
    const [showAllCategories, setShowAllCategories] = useState(false);

    // State for filters
    const [titleSearch, setTitleSearch] = useState("");
    const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
    const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
    const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);

    const [authorSearch, setAuthorSearch] = useState("");
    const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
    const [authorSuggestions, setAuthorSuggestions] = useState<string[]>([]);
    const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);

    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]); // Max price assumed 1000 for sliding

    // Debounce for title search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (titleSearch.length >= 3 && !selectedTitle) {
                try {
                    const response = await fetch(`http://localhost:8000/api/books?title=${titleSearch}&page_size=10`);
                    if (response.ok) {
                        const data = await response.json();
                        const titles = Array.from(new Set(data.items.map((b: any) => b.title))).slice(0, 5) as string[];
                        setTitleSuggestions(titles);
                        setIsTitleDropdownOpen(true);
                    }
                } catch (error) {
                    console.error("Failed to fetch titles", error);
                }
            } else {
                setTitleSuggestions([]);
                setIsTitleDropdownOpen(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [titleSearch, selectedTitle]);

    // Debounce for author search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (authorSearch.length >= 3 && !selectedAuthor) {
                try {
                    // Fetch authors from API (simulated or real endpoint)
                    // For now, using books endpoint to get unique authors could be heavy, 
                    // ideally we'd have an /authors endpoint or just search books and dedupe
                    const response = await fetch(`http://localhost:8000/api/books?author=${authorSearch}&page_size=10`);
                    // Note: API filters by title/author/genre. We might need a specific author search.
                    // Let's assume we search books and extract authors for now.
                    if (response.ok) {
                        const data = await response.json();
                        const authors = Array.from(new Set(data.items.map((b: any) => b.author))).slice(0, 5) as string[];
                        setAuthorSuggestions(authors);
                        setIsAuthorDropdownOpen(true);
                    }
                } catch (error) {
                    console.error("Failed to fetch authors", error);
                }
            } else {
                setAuthorSuggestions([]);
                setIsAuthorDropdownOpen(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [authorSearch, selectedAuthor]);

    const handleTitleSelect = (title: string) => {
        setSelectedTitle(title);
        setTitleSearch(title);
        setIsTitleDropdownOpen(false);
    };

    const clearTitle = () => {
        setSelectedTitle(null);
        setTitleSearch("");
    };

    const handleAuthorSelect = (author: string) => {
        setSelectedAuthor(author);
        setAuthorSearch(author);
        setIsAuthorDropdownOpen(false);
    };

    const clearAuthor = () => {
        setSelectedAuthor(null);
        setAuthorSearch("");
    };

    const handleApplyFilters = () => {
        onFilterChange({
            title: selectedTitle,
            author: selectedAuthor,
            minPrice: priceRange[0],
            maxPrice: priceRange[1]
        });
    };

    return (
        <aside className="relative w-full md:w-64 flex-shrink-0 space-y-8 pr-6">
            {/* 1. Categories */}
            <div>
                <h3 className="font-heading font-bold text-xl mb-4 flex items-center justify-between">
                    Categories
                    <span className="text-primary text-2xl">⌄</span>
                </h3>
                <div className="space-y-1">
                    <AnimatePresence initial={false}>
                        {CATEGORIES.slice(0, showAllCategories ? CATEGORIES.length : INITIAL_VISIBLE).map((cat) => {
                            const isSelected = selectedCategory.toLowerCase() === cat.href.split("/").pop();
                            return (
                                <motion.div
                                    key={cat.name}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden"
                                >
                                    <Link
                                        href={cat.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isSelected
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-text"
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full border flex-shrink-0 ${isSelected ? "bg-primary border-primary" : "border-gray-300"}`} />
                                        <span className="text-sm">{cat.name}</span>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {CATEGORIES.length > INITIAL_VISIBLE && (
                        <button
                            onClick={() => setShowAllCategories((v) => !v)}
                            className="text-primary text-sm font-bold mt-2 hover:underline flex items-center gap-1"
                        >
                            {showAllCategories
                                ? `− Show Less`
                                : `+ ${CATEGORIES.length - INITIAL_VISIBLE} More Categories`}
                        </button>
                    )}
                </div>
            </div>

            <hr className="my-6 border-t border-grey-200" />


            {/* 4. Book Name Search */}
            <div className="relative">
                <h3 className="font-heading font-bold text-xl mb-4">Book Name</h3>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search book..."
                        value={titleSearch}
                        onChange={(e) => setTitleSearch(e.target.value)}
                        disabled={!!selectedTitle}
                        className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary transition-colors ${selectedTitle ? 'bg-gray-100 text-gray-500' : ''}`}
                    />
                    {selectedTitle && (
                        <button
                            onClick={clearTitle}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                        >
                            <X size={16} />
                        </button>
                    )}

                    <AnimatePresence>
                        {isTitleDropdownOpen && titleSuggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 w-full bg-white shadow-lg rounded-lg border border-gray-100 mt-1 z-20 max-h-48 overflow-y-auto"
                            >
                                {titleSuggestions.map((title) => (
                                    <button
                                        key={title}
                                        onClick={() => handleTitleSelect(title)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        {title}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <hr className="my-6 border-t border-grey-200" />


            {/* 4. Author Search */}
            <div className="relative">
                <h3 className="font-heading font-bold text-xl mb-4">Author</h3>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search author..."
                        value={authorSearch}
                        onChange={(e) => setAuthorSearch(e.target.value)}
                        disabled={!!selectedAuthor}
                        className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary transition-colors ${selectedAuthor ? 'bg-gray-100 text-gray-500' : ''}`}
                    />
                    {selectedAuthor && (
                        <button
                            onClick={clearAuthor}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                        >
                            <X size={16} />
                        </button>
                    )}

                    <AnimatePresence>
                        {isAuthorDropdownOpen && authorSuggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 w-full bg-white shadow-lg rounded-lg border border-gray-100 mt-1 z-20 max-h-48 overflow-y-auto"
                            >
                                {authorSuggestions.map((author) => (
                                    <button
                                        key={author}
                                        onClick={() => handleAuthorSelect(author)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        {author}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <hr className="my-6 border-t border-grey-200" />

            {/* 6. Price Range */}
            <div>
                <h3 className="font-heading font-bold text-xl mb-4 flex items-center justify-between">
                    Price Range
                    <span className="text-primary text-2xl">⌄</span>
                </h3>
                <input
                    type="range"
                    min="0"
                    max="300"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2">
                    <span className="px-3 py-1 bg-gray-100 rounded text-xs font-bold text-text">${priceRange[0]}</span>
                    <span className="px-3 py-1 bg-primary/10 rounded text-xs font-bold text-primary">${priceRange[1]}</span>
                </div>
            </div>
            <hr className="my-6 border-t border-grey-200" />

            {/* 7. Action Buttons */}
            <div className="pt-4 space-y-3">
                <button
                    onClick={handleApplyFilters}
                    className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg"
                >
                    Search
                </button>
                <button
                    onClick={() => {
                        setSelectedTitle(null);
                        setTitleSearch("");
                        setSelectedAuthor(null);
                        setAuthorSearch("");
                        setPriceRange([0, 1000]);
                        onFilterChange({ title: null, author: null, minPrice: 0, maxPrice: 1000 });
                    }}
                    className="w-full bg-white border border-gray-200 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all"
                >
                    Reset Filter
                </button>
            </div>
            <div className="absolute top-0 right-0 h-full w-px bg-gray-200" />
        </aside>
    );
}
