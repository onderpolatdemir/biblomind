"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants"; // Shared constants
import LoadingGame from "@/components/ui/LoadingGame";
import { Camera, Sparkles, BookOpen, CheckCircle, XCircle } from "lucide-react";

type Book = {
    id: string;
    title: string;
    author: string;
    price: number;
    cover_url: string;
    rating?: number;
    reviews_count?: number;
    // Add other fields as needed
};

type ShelfRecommendation = {
    book: {
        id: string;
        title: string;
        author: string;
        price: number;
        cover_url: string;
    };
    match_score: number;
    explanation: string;
    in_our_store: boolean;
};

type ShelfResult = {
    analysis_id?: string;
    detected_books: string[];
    recommendations: ShelfRecommendation[];
    shelf_compatibility_score?: number;
};

type UploadStage = "idle" | "uploading" | "detecting" | "recommending" | "done" | "error";

const STAGE_LABELS: Record<UploadStage, string> = {
    idle: "",
    uploading: "Uploading photo...",
    detecting: "Detecting books on your shelf...",
    recommending: "Finding your perfect matches...",
    done: "Done! Here are your recommendations.",
    error: "Something went wrong. Please try again.",
};

const STAGE_PROGRESS: Record<UploadStage, number> = {
    idle: 0,
    uploading: 20,
    detecting: 55,
    recommending: 80,
    done: 100,
    error: 0,
};

export default function HomePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
    const [shelfResult, setShelfResult] = useState<ShelfResult | null>(null);
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

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
            alert("Please upload a valid image (PNG, JPG, WEBP)");
            return;
        }

        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
        setUploadStatus("loading");
        setUploadStage("uploading");
        setShelfResult(null);

        // Real API Call to Vision Model
        try {
            await new Promise((r) => setTimeout(r, 600));
            setUploadStage("detecting");

            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post("/vision/match-shelf", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 60000, // Important: Allow long timeout since vision analysis takes 10+ seconds
            });

            setUploadStage("recommending");
            await new Promise((r) => setTimeout(r, 500));

            setUploadStatus("success");
            setUploadStage("done");
            setShelfResult(response.data);

        } catch (error: any) {
            console.error("Failed to analyze bookshelf:", error);
            setUploadStatus("error");
            setUploadStage("error");
            alert(error.response?.data?.detail || "Failed to analyze your bookshelf. Please try again.");

        }

    };

    const handleSeeAll = () => {
        if (CATEGORIES.length > 0) {
            router.push(CATEGORIES[0].href);
        }
    };

    const triggerFileUpload = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const resetUpload = () => {
        setSelectedImage(null);
        setUploadStatus("idle");
        setUploadStage("idle");
        setShelfResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    return (
        <div className="min-h-screen bg-background flex flex-col font-body">
            <Header />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-12">

                {/* Hero / Upload Container / Game Container */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                    className="relative bg-secondary/30 rounded-[3rem] p-8 md:p-16 mb-24 overflow-hidden min-h-[500px] flex items-center justify-center"
                >
                    <AnimatePresence mode="wait">
                        {uploadStatus === "loading" ? (
                            <motion.div
                                key="game"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full h-full relative z-20"
                            >
                                <LoadingGame />
                            </motion.div>
                        ) : (
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
                                            onClick={triggerFileUpload}
                                            disabled={uploadStage !== "idle" && uploadStage !== "error" && uploadStage !== "done"}
                                            className="group relative flex items-center gap-3 bg-text text-white px-8 py-4 rounded-full font-bold hover:bg-accent transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none z-20"
                                        >
                                            <Camera size={22} />
                                            <span>{uploadStatus === "success" ? "Redirecting..." : "Upload a Bookshelf"}</span>
                                        </button>

                                        <input
                                            type="file"
                                            accept=".png,.jpg,.jpeg,.webp"
                                            hidden
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                        />

                                        {selectedImage && uploadStage === "done" && (
                                            <button
                                                onClick={resetUpload}
                                                className="text-sm text-gray-500 hover:text-accent underline transition-colors"
                                            >
                                                Try another photo
                                            </button>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <AnimatePresence>
                                        {uploadStage !== "idle" && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="mt-6 max-w-md"
                                            >
                                                {uploadStage === "error" ? (
                                                    <div className="flex items-center gap-2 text-red-600 font-medium">
                                                        <XCircle size={18} />
                                                        <span>{STAGE_LABELS.error}</span>
                                                    </div>
                                                ) : uploadStage === "done" ? (
                                                    <div className="flex items-center gap-2 text-green-700 font-medium">
                                                        <CheckCircle size={18} />
                                                        <span>{STAGE_LABELS.done}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-gray-600 mb-2 font-medium">{STAGE_LABELS[uploadStage]}</p>
                                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-accent rounded-full"
                                                                initial={{ width: "0%" }}
                                                                animate={{ width: `${STAGE_PROGRESS[uploadStage]}%` }}
                                                                transition={{ duration: 0.6, ease: "easeOut" }}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Right Visual */}
                                <div className="flex-1 w-full flex justify-center md:justify-end gap-4 relative h-80 md:h-96 items-end">
                                    {selectedImage ? (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="relative w-64 h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
                                        >
                                            <Image src={selectedImage} alt="Your shelf" fill className="object-cover" />
                                        </motion.div>
                                    ) : (
                                        <>
                                            <div className="relative w-32 h-64 md:w-40 md:h-80 bg-white rounded-t-full shadow-lg overflow-hidden transform translate-y-8">
                                                <Image src="/lotr.png" alt="Book 1" fill className="object-cover opacity-90 hover:scale-105 transition-transform duration-500" />
                                            </div>
                                            <div className="relative w-40 h-72 md:w-48 md:h-96 bg-white rounded-t-full shadow-2xl overflow-hidden z-10 -ml-8 border-4 border-secondary">
                                                <Image src="/nutuk.png" alt="Book 2" fill className="object-cover hover:scale-105 transition-transform duration-500" />
                                            </div>
                                            <div className="relative w-32 h-64 md:w-40 md:h-80 bg-white rounded-t-full shadow-lg overflow-hidden transform translate-y-8 -ml-8">
                                                <Image src="/hp.png" alt="Book 3" fill className="object-cover opacity-90 hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                {/* Shelf Analysis Results */}
                <AnimatePresence>
                    {shelfResult && uploadStage === "done" && (
                        <motion.section
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-16"
                        >
                            {/* Detected Books */}
                            {shelfResult.detected_books?.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-2xl font-heading font-bold text-text mb-4 flex items-center gap-2">
                                        <BookOpen size={22} className="text-accent" />
                                        Books Detected on Your Shelf
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {shelfResult.detected_books.map((title, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 bg-secondary text-text text-sm font-medium rounded-full border border-gray-200"
                                            >
                                                {title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations from shelf */}
                            {shelfResult.recommendations?.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-heading font-bold text-text mb-6 flex items-center gap-2">
                                        <Sparkles size={22} className="text-accent" />
                                        Books We Think You'll Love
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {shelfResult.recommendations.map((rec) => (
                                            <div key={rec.book.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                                <BookCard
                                                    id={rec.book.id}
                                                    title={rec.book.title}
                                                    author={rec.book.author}
                                                    price={Number(rec.book.price)}
                                                    rating={Math.round(rec.match_score * 5 * 10) / 10}
                                                    imageSrc={rec.book.cover_url || "/hp.png"}
                                                />
                                                {rec.explanation && (
                                                    <div className="px-4 pb-4">
                                                        <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                                                            {rec.explanation}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="px-4 pb-3 flex items-center justify-between">
                                                    <span className="text-xs text-accent font-bold">
                                                        {Math.round(rec.match_score * 100)}% match
                                                    </span>
                                                    {!rec.in_our_store && (
                                                        <span className="text-xs text-gray-400">Not in store</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {shelfResult.analysis_id && (
                                        <div className="mt-8 text-center">
                                            <button
                                                onClick={() => router.push(`/shelf-recommendations/${shelfResult.analysis_id}`)}
                                                className="inline-flex items-center gap-2 bg-text text-white font-bold px-8 py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-md mx-auto"
                                            >
                                                View Detailed Analysis
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>

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
