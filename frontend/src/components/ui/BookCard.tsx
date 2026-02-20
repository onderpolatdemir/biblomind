"use client";

import { useFavorites } from "@/context/FavoritesContext";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BookCardProps {
    id: string;
    title: string;
    author: string;
    price: number;
    rating: number;
    imageSrc: string;
    variant?: "grid" | "list";
    onToggle?: () => void;
}

// ... inside component ...
export default function BookCard({ id, title, author, price, rating, imageSrc, variant = "grid", onToggle }: BookCardProps) {
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites(); // Use new hook
    const router = useRouter();
    const [isAdded, setIsAdded] = useState(false);

    // Derived state
    const isLiked = isFavorite(id);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        addToCart(id, 1);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1000);
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!user) {
            router.push("/auth/login");
            return;
        }

        await toggleFavorite(id);
        if (onToggle) {
            onToggle();
        }
    };

    const handleCardClick = () => {
        router.push(`/books/${id}`);
    };

    if (variant === "list") {
        return (
            <motion.div
                whileHover={{ y: -2 }}
                onClick={handleCardClick}
                className="flex flex-row bg-background rounded-xl shadow-md hover:shadow-md transition-all overflow-hidden border border-gray-100 h-48 w-full group cursor-pointer"
            >
                {/* Book Cover */}
                <div className="relative w-32 h-full bg-gray-50 flex-shrink-0">
                    <Image
                        src={imageSrc}
                        alt={title}
                        fill
                        className="object-cover transition-transform overflow-hidden duration-500 group-hover:scale-105"
                    />
                </div>

                {/* Right: Details */}
                <div className="flex-1 p-6 h-full flex flex-row gap-4">
                    <div className="flex-1 flex flex-col">
                        <div>
                            <h3 className="text-xl font-bold text-text line-clamp-1 font-heading group-hover:text-primary transition-colors">{title}</h3>
                            <p className="text-sm text-gray-500 mb-2">By: {author}</p>

                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-yellow-400 text-sm">★</span>
                                <span className="text-sm font-medium text-text">{rating}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-xs text-gray-400">In Stock</span>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 hidden md:block">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 min-w-[100px]">
                        <div className="text-xl font-bold text-accent">${price}</div>
                        <button
                            onClick={handleAddToCart}
                            className={`w-full py-1.5 px-3 rounded-lg text-white text-xs font-bold shadow hover:shadow-md transition-all ${isAdded ? "bg-green-500" : "bg-primary hover:bg-accent hover:bg-opacity-90"}`}
                        >
                            {isAdded ? "Added!" : "Buy"}
                        </button>
                        <button
                            onClick={handleLike}
                            className={`p-2 rounded-lg transition-colors ${isLiked ? "text-accent-500 bg-accent-50" : "text-gray-400 hover:text-accent-500 hover:bg-accent-50"}`}
                        >
                            <span className="sr-only">Like</span>
                            <Heart size={20} className={isLiked ? "fill-current" : ""} />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={handleCardClick}
            className="flex flex-col md:flex-row xl:flex-col bg-background rounded-xl shadow-lg hover:shadow-md transition-shadow overflow-hidden border border-gray-100 h-[28rem] w-full group cursor-pointer relative"
        >
            {/* Book Cover */}
            <div className="relative w-full md:w-32 xl:w-full h-64 md:h-full xl:h-64 bg-gray-50 flex-shrink-0 rounded-xl overflow-hidden">
                <Image
                    src={imageSrc}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Favorite Button (Grid View) - Absolute Positioned */}
                <button
                    onClick={handleLike}
                    className={`absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 z-10 group/btn ${isLiked ? "text-accent" : "text-gray-400 hover:text-accent"}`}
                >
                    <Heart size={18} className={`transition-colors ${isLiked ? "fill-current" : ""}`} />
                </button>
            </div>

            {/* Right: Details */}
            <div className="flex-1 p-4 flex flex-col justify-between h-full">
                <div>
                    <h3 className="text-lg font-bold text-text line-clamp-2 leading-tight mb-1 font-heading h-[3.00rem] group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1" title={author}>By: {author}</p>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-sm font-medium text-text">{rating}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-lg font-bold text-accent">${price}</span>
                    </div>
                </div>

                <button
                    onClick={handleAddToCart}
                    className={`w-full py-2 px-4 rounded-lg border border-gray-200 text-sm shadow-sm hover:shadow-md font-semibold text-text transition-all duration-200 ${isAdded ? "bg-green-500 text-white border-green-500" : "bg-primary hover:bg-accent hover:text-white hover:border-transparent"}`}
                >
                    {isAdded ? "Success!" : "Buy"}
                </button>
            </div>
        </motion.div>
    );
}
