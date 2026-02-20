"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import ExpandableSearchBar from "@/components/expandable-search-bar";
import {
    Book, Brain, Rocket, Sparkles, Search, ShoppingCart,
    Ghost, Heart, PenTool, Landmark, FlaskConical, House, LayoutGrid, Info,
    Leaf, Feather, Baby, User, Scroll
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants"; // Shared constants


export default function Header() {
    const router = useRouter();
    // Add window resize listener to adjust search bar width
    const [searchWidth, setSearchWidth] = useState(280);
    const { user, logout } = useAuth();
    const { cart } = useCart();
    const cartCount = cart?.total_items || 0;
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<{ id: string; title: string }[]>([]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSearchWidth(180); // Smaller on mobile
            } else if (window.innerWidth < 1024) {
                setSearchWidth(220); // Medium on tablet
            } else {
                setSearchWidth(280); // Default on desktop
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSearchChange = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/books?title=${encodeURIComponent(query)}&page_size=5`);

            if (response.ok) {
                const data = await response.json();
                // Map to ensure we have id and title (though API returns them)
                setSearchResults(data.items.map((book: any) => ({ id: book.id, title: book.title })));
            }
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults([]);
        }
    }, []);

    const handleBookSelect = (book: { id: string; title: string }) => {
        router.push(`/books/${book.id}`);
    };

    // Get user initial or default to 'U'
    const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';

    const handleLogout = () => {
        setIsDropdownOpen(false);
        // Call the logout function from AuthContext
        if (logout) {
            logout();
        }
    };

    return (
        <nav className="w-full flex justify-between items-center py-4 px-8 md:px-16 bg-white shadow-sm sticky top-0 z-50">
            {/* 1. Left: Hamburger (Mobile) & Logo */}
            <div className="flex items-center gap-4">
                {/* Hamburger Menu Button (Mobile Only) */}
                <button
                    className="md:hidden text-2xl text-text focus:outline-none"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    ☰
                </button>

                <Link href="/home" className="relative w-28 h-10 md:w-36 md:h-12">
                    <Image
                        src="/biblomind-logoo.png"
                        alt="BiblioMind Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </Link>
            </div>

            {/* 2. Center: Navigation Links (Desktop) */}
            <div className="hidden md:flex gap-8 items-center font-medium text-gray-600 h-full">


                <Link href="/home" className="hover:text-primary transition-colors py-4">
                    <div className="flex items-center gap-1">
                        <House />
                        Home
                    </div>
                </Link>


                {/* Categories Dropdown Trigger */}
                <div
                    className="relative h-full flex items-center"
                    onMouseEnter={() => setIsCategoriesOpen(true)}
                    onMouseLeave={() => setIsCategoriesOpen(false)}
                >


                    <div className="hover:text-primary transition-colors py-4 cursor-default">
                        <div className="flex items-center gap-1">
                            <LayoutGrid />
                            Categories
                        </div>

                    </div>



                    {/* Mega Menu Dropdown */}
                    <AnimatePresence>
                        {isCategoriesOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-[72px] left-0 w-full bg-white shadow-xl border-t border-gray-100 z-50 fixed left-0 right-0"
                                style={{ position: 'fixed', left: 0, right: 0 }}
                            >
                                <div className="max-w-7xl mx-auto px-8 md:px-16 py-8">
                                    <div className="grid grid-cols-4 lg:grid-cols-5 gap-4">
                                        {CATEGORIES.map((cat) => (
                                            <Link
                                                key={cat.name}
                                                href={cat.href}
                                                className="group flex flex-row items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-accent hover:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md"
                                            >
                                                <cat.icon className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors duration-300" />
                                                <span className="text-sm font-bold">{cat.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* <Link href="/shop" className="hover:text-primary transition-colors py-4">
                    <div className="flex items-center gap-1">
                        <Heart />
                        Shop
                    </div>
                </Link> */}
                <Link href="/favorites" className="hover:text-primary transition-colors py-4">
                    <div className="flex items-center gap-1">
                        <Heart />
                        Favorites
                    </div>

                </Link>
                <Link href="/about" className="hover:text-primary transition-colors py-4">
                    <div className="flex items-center gap-1">
                        <Info />
                        About
                    </div>
                </Link>
            </div>

            {/* 3. Right: Profile Icon & Dropdown */}
            <div className="relative">
                <div className="flex items-center gap-2">
                    <ExpandableSearchBar
                        expandDirection="left"
                        onSearch={(q) => console.log("Search:", q)}
                        onQueryChange={handleSearchChange}
                        onResultSelect={handleBookSelect}
                        results={searchResults}
                        className="mr-2 hover:border-primary"
                        width={searchWidth}
                    />
                    <Link
                        href="/checkout"
                        className="relative w-10 h-10 flex items-center justify-center rounded-full 
                        border border-gray-200 bg-primary 
                        hover:border-primary hover:text-white 
                        transition-all shadow-sm"
                    >
                        <ShoppingCart size={18} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] 
                     bg-accent text-white rounded-full 
                     flex items-center justify-center font-bold">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all focus:outline-none"
                    >
                        {/* Dynamic User Initial */}
                        <div className="w-full h-full bg-secondary flex items-center justify-center text-text font-bold">
                            {userInitial}
                        </div>
                    </button>
                    <p className="text-text font-bold">{user?.full_name}</p>
                </div>

                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden z-50"
                        >
                            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                Profile
                            </Link>
                            <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                Settings
                            </Link>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                Sign Out
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Sidebar Menu (Drawer) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 md:hidden flex flex-col p-6"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-heading font-bold text-text">Menu</h2>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-2xl text-gray-400 hover:text-red-500"
                                >
                                    &times;
                                </button>
                            </div>

                            <nav className="flex flex-col gap-6 font-medium text-lg text-gray-600">
                                <Link href="/home" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-3">
                                    <span>🏠</span> Home
                                </Link>
                                <Link href="/categories" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-3">
                                    <span>📚</span> Categories
                                </Link>
                                <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-3">
                                    <span>🛍️</span> Shop
                                </Link>
                                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-3">
                                    <span>ℹ️</span> About
                                </Link>
                                <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-3">
                                    <span>🛒</span> My Cart
                                </Link>
                                <Link href="/checkout" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-3">
                                    <span>💳</span> Checkout
                                </Link>
                            </nav>

                            <div className="mt-auto pt-8 border-t border-gray-100">
                                <p className="text-sm text-gray-400 text-center">BiblioMind © 2026</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav >
    );
}
