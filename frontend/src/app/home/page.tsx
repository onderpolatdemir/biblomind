"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants"; // Shared constants

type Book = {
    id: string;
    title: string;
    author: string;
    price: number;
    cover_url: string;
    // Add other fields as needed
};

export default function HomePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                // Fetch first 5 books
                const response = await api.get('/books?page=1&size=5');
                setBooks(response.data.items || []);
            } catch (error) {
                console.error("Failed to fetch books:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooks();
    }, []);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
                alert("Please upload a valid image (PNG, JPG)");
                return;
            }

            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);

            // Mock Upload Process
            setTimeout(() => {
                setUploadStatus("success");
            }, 1500);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleSeeAll = () => {
        if (CATEGORIES.length > 0) {
            const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
            router.push(randomCategory.href);
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
                    className="relative bg-secondary/30 rounded-[3rem] p-8 md:p-16 mb-24 overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">

                        {/* Left Content */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-heading font-bold text-text mb-6 leading-tight">
                                Let's see if we know <br /> you well enough?
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-xl leading-relaxed">
                                Confused about what to read? Upload a photo of your bookshelf and let us show you what you might love.
                            </p>

                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <button
                                    onClick={triggerFileUpload}
                                    className="group relative flex items-center gap-3 bg-text text-white px-8 py-4 rounded-full font-bold hover:bg-accent transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                >
                                    <span className="text-2xl">📷</span>
                                    <span>Upload a Bookshelf</span>
                                </button>

                                <input
                                    type="file"
                                    accept=".png,.jpg,.jpeg"
                                    hidden
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />

                                {/* Upload Preview & Status */}
                                {selectedImage && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-md"
                                    >
                                        <Image src={selectedImage} alt="Preview" fill className="object-cover" />
                                        {uploadStatus === 'success' && (
                                            <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center text-white font-bold text-xs">
                                                ✓
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            {/* Success Message Text */}
                            {uploadStatus === 'success' && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4 text-green-700 font-medium"
                                >
                                    Upload successful! Analyzing your library...
                                </motion.p>
                            )}
                        </div>

                        {/* Right Visual (Arched Images) */}
                        <div className="flex-1 w-full flex justify-center md:justify-end gap-4 relative h-80 md:h-96 items-end">
                            {/* Decorative Arches */}
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
                    </div>
                </motion.section>




            </main>
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-32 py-5" >
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

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {books.map((book) => (
                                <BookCard
                                    key={book.id}
                                    id={book.id}
                                    title={book.title}
                                    author={book.author || "Unknown Author"}
                                    rating={4.5} // Default rating if not available in this endpoint yet
                                    price={Number(book.price)}
                                    imageSrc={book.cover_url || "/hp.png"} // Fallback image
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
