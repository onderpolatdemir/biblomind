"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import LoadingGame from "@/components/ui/LoadingGame";
import { Camera, Sparkles, BookOpen, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";

type ShelfRecommendation = {
    title: string;
    author: string;
    match_score: number;
    reason: string;
    in_our_store: boolean;
    book_id: string | null;
    price: number | null;
    cover_url: string | null;
};

type DetectedBook = {
    title: string;
    author: string;
    confidence: number;
    genres: string[];
    original_ocr: string;
};

type ShelfResult = {
    analysis_id?: string;
    detected_books: DetectedBook[];
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

type ShelfAnalysisHistory = {
    id: string;
    image_path: string;
    created_at: string;
    total_books: number;
    total_recommendations: number;
    shelf_analysis: any;
};

export default function ShelfRecommendationsPage() {
    const router = useRouter();
    const [history, setHistory] = useState<ShelfAnalysisHistory[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
    const [shelfResult, setShelfResult] = useState<ShelfResult | null>(null);

    const fetchHistory = async () => {
        try {
            const response = await api.get("/vision/shelf-analyses");
            setHistory(response.data);
        } catch (error) {
            console.error("Failed to fetch shelf analysis history:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchHistory();
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
                timeout: 60000, 
            });

            setUploadStage("recommending");
            await new Promise((r) => setTimeout(r, 500));

            setUploadStatus("success");
            setUploadStage("done");
            setShelfResult(response.data);
            
            // Refresh history after a successful upload
            fetchHistory();

        } catch (error: any) {
            console.error("Failed to analyze bookshelf:", error);
            setUploadStatus("error");
            setUploadStage("error");
            alert(error.response?.data?.detail || "Failed to analyze your bookshelf. Please try again.");
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
                
                {/* 1. Upload Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative bg-secondary/30 rounded-[3rem] p-8 md:p-16 mb-16 overflow-hidden min-h-[500px] flex items-center justify-center"
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
                                        Shelf Match Analysis
                                    </h1>
                                    <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-xl leading-relaxed">
                                        Upload a photo of your bookshelf and let our AI extract the titles to find your perfect next read based on your personal taste.
                                    </p>

                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <button
                                            onClick={triggerFileUpload}
                                            disabled={uploadStage !== "idle" && uploadStage !== "error" && uploadStage !== "done"}
                                            className="group relative flex items-center gap-3 bg-text text-white px-8 py-4 rounded-full font-bold hover:bg-accent transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none z-20"
                                        >
                                            <Camera size={22} />
                                            <span>{uploadStatus === "success" ? "Upload another shelf" : "Upload a Bookshelf"}</span>
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
                                                Clear results
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

                {/* 2. Shelf Analysis Live Results */}
                <AnimatePresence>
                    {shelfResult && uploadStage === "done" && (
                        <motion.section
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-24"
                        >
                            {/* Detected Books */}
                            {shelfResult.detected_books?.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-2xl font-heading font-bold text-text mb-4 flex items-center gap-2">
                                        <BookOpen size={22} className="text-accent" />
                                        Books Detected on Your Shelf
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {shelfResult.detected_books.map((book, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 bg-secondary text-text text-sm font-medium rounded-full border border-gray-200"
                                            >
                                                {book.title}{book.author ? ` — ${book.author}` : ""}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No recommendations notice */}
                            {shelfResult.detected_books?.length > 0 && !(shelfResult.recommendations?.length > 0) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-secondary/20 border border-secondary/40 rounded-2xl px-6 py-5 flex items-start gap-4 mb-8"
                                >
                                    <span className="text-2xl mt-0.5">🔍</span>
                                    <div>
                                        <p className="font-bold text-text text-base mb-1">
                                            We couldn't find any recommendations for you yet.
                                        </p>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            To personalize your shelf matches, we need to learn your reading taste first. Try adding books to your{" "}
                                            <a href="/favorites" className="text-accent font-semibold hover:underline">favorites</a>,
                                            rating a few books, or placing an order — then come back and scan your shelf again!
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Recommendations from shelf */}
                            {shelfResult.recommendations?.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-heading font-bold text-text mb-6 flex items-center gap-2">
                                        <Sparkles size={22} className="text-accent" />
                                        Books We Think You'll Love
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {shelfResult.recommendations.map((rec, i) => (
                                            <div key={rec.book_id ?? i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                                <BookCard
                                                    id={rec.book_id ?? ""}
                                                    title={rec.title}
                                                    author={rec.author}
                                                    price={Number(rec.price ?? 0)}
                                                    rating={Math.round(rec.match_score * 5 * 10) / 10}
                                                    imageSrc={rec.cover_url || "/hp.png"}
                                                />
                                                {rec.reason && (
                                                    <div className="px-4 pb-4">
                                                        <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                                                            {rec.reason}
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
                                                View Detailed Analysis Page
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* 3. Shelf Analyses History Gallery */}
                <section>
                    <div className="mb-8">
                        <h2 className="text-3xl font-heading font-bold text-text mb-2">
                            My Shelf Analyses
                        </h2>
                        <p className="text-lg text-gray-600">
                            A history of the bookshelves you've analyzed in the past.
                        </p>
                    </div>

                    {isLoadingHistory ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : history.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
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
                                            unoptimized
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
                            className="bg-secondary/10 rounded-[3rem] p-12 text-center flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-secondary"
                        >
                            <div className="text-6xl mb-6 opacity-80">📸</div>
                            <h3 className="text-2xl font-heading font-bold text-text mb-2">
                                No history found
                            </h3>
                            <p className="text-gray-500 max-w-md text-base">
                                Once you upload a photo of your bookshelf above, it will be saved here for you to review later.
                            </p>
                        </motion.div>
                    )}
                </section>

            </main>
        </div>
    );
}
