"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Star, ChevronDown, ChevronUp, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface UserReview {
    id: string;
    book_id: string;
    book_title: string;
    book_author: string | null;
    book_cover_url: string | null;
    rating: number;
    comment: string | null;
    created_at: string;
    updated_at: string;
}

interface ReviewListResponse {
    total: number;
    items: UserReview[];
    page: number;
    size: number;
}

export default function ReviewHistory() {
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedReview, setExpandedReview] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.get<ReviewListResponse>("/reviews/me");
            setReviews(res.data.items || []);
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleReview = (id: string) => {
        setExpandedReview(expandedReview === id ? null : id);
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        fill={star <= rating ? "currentColor" : "none"}
                        className={star <= rating ? "text-yellow-500" : "text-gray-300"}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Star className="text-primary fill-primary/10" />
                My Reviews
            </h2>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                    <Star className="mx-auto w-12 h-12 text-gray-300 mb-2" />
                    <p>You haven't written any reviews yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/30">
                            <div
                                onClick={() => toggleReview(review.id)}
                                className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-gray-50 transition-colors gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative w-12 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                                        {review.book_cover_url ? (
                                            <Image src={review.book_cover_url} alt={review.book_title} fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <Package size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-800 line-clamp-1">{review.book_title}</h4>
                                        <p className="text-sm text-gray-500 mb-1">{review.book_author || "Unknown Author"}</p>
                                        <div className="flex items-center gap-2">
                                            {renderStars(review.rating)}
                                            <span className="text-xs text-gray-400">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 mt-2 md:mt-0 self-end md:self-auto">
                                    {expandedReview === review.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedReview === review.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-200 bg-white px-6 py-4"
                                    >
                                        <div className="space-y-2">
                                            <p className="font-semibold text-gray-700">Your Review:</p>
                                            {review.comment ? (
                                                <p className="text-gray-600 bg-gray-50 p-4 rounded-xl text-sm italic border border-gray-100">
                                                    "{review.comment}"
                                                </p>
                                            ) : (
                                                <p className="text-gray-500 text-sm italic">No written comment provided.</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
