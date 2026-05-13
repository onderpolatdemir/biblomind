"use client";

import { useFavorites } from "@/context/FavoritesContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import { Star, Heart, Share2, Minus, Plus, ShoppingCart, User, MessageSquare, Edit2, AlertCircle, Send, Trash2, Pencil } from "lucide-react";
import api from "@/lib/api";

type ReviewEligibility = {
    can_review: boolean;
    has_reviewed: boolean;
    existing_review: BookReview | null;
};

interface BookReview {
    id: string;
    user_id: string;
    book_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    updated_at: string;
    user_name: string;
}

// Types
interface Book {
    id: string;
    title: string;
    author: string;
    description: string;
    price: number;
    cover_url: string;
    isbn: string;
    genres: string[];
    rating?: number;
    reviews_count?: number;
    stock: number;
}

interface ReviewItem {
    id: string;
    user_id: string;
    book_id: string;
    rating: number;
    comment?: string;
    reviewer_name?: string;
    created_at: string;
}

interface BookReviewsData {
    reviews: ReviewItem[];
    total: number;
    average_rating: number;
    rating_distribution: Record<number, number>;
}

interface SimilarBook {
    id: string;
    title: string;
    author: string;
    cover_url?: string;
    price?: number;
    similarity_score: number;
}

export default function BookDetailPage() {
    const params = useParams();
    const { id } = params;
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites(); // Use new hook
    const router = useRouter();

    const [book, setBook] = useState<Book | null>(null);
    const [similarBooks, setSimilarBooks] = useState<SimilarBook[]>([]);
    const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isAdded, setIsAdded] = useState(false);
    const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");


    const [reviews, setReviews] = useState<BookReview[]>([]);
    const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
    const [reviewError, setReviewError] = useState("");

    // Reviews state
    const [reviewsData, setReviewsData] = useState<BookReviewsData | null>(null);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [myRating, setMyRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [myComment, setMyComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);

    const isLiked = book ? isFavorite(book.id) : false; // Derived state

    const fetchReviews = useCallback(async () => {
        if (!id) return;
        setIsLoadingReviews(true);
        try {
            const res = await api.get(`/reviews/books/${id}/reviews`);
            setReviewsData(res.data);
            // Pre-fill form if user already has a review
            if (user) {
                const mine = res.data.reviews.find((r: ReviewItem) => r.user_id === user.id);
                if (mine) {
                    setEditingReview(mine);
                    setMyRating(mine.rating);
                    setMyComment(mine.comment ?? "");
                }
            }
        } catch {
            setReviewsData(null);
        } finally {
            setIsLoadingReviews(false);
        }
    }, [id, user]);

    const submitReview = async () => {
        if (!user) { router.push("/auth/login"); return; }
        if (myRating === 0) return;
        setIsSubmittingReview(true);
        try {
            await api.post(`/reviews/books/${id}/reviews`, { rating: myRating, comment: myComment || null });
            setReviewSuccess(true);
            setTimeout(() => setReviewSuccess(false), 2000);
            fetchReviews();
        } catch {
            // ignore
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const deleteMyReview = async () => {
        if (!id) return;
        try {
            await api.delete(`/reviews/books/${id}/reviews`);
            setEditingReview(null);
            setMyRating(0);
            setMyComment("");
            fetchReviews();
        } catch {
            // ignore
        }
    };

    const handleAddToCart = () => {
        if (book) {
            addToCart(book.id, quantity);
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
        }
    };

    const handleLike = async () => {
        if (!user) {
            router.push("/auth/login");
            return;
        }

        if (book) {
            await toggleFavorite(book.id);
        }
    };

    useEffect(() => {
        const fetchBookData = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/books/${id}`);
                if (!res.ok) throw new Error("Book not found");
                const data = await res.json();
                setBook(data);

                // Fetch reviews
                fetchReviews();

                // Fetch review eligibility (has the user purchased this book?)
                if (user) {
                    try {
                        const eligRes = await api.get(`/reviews/book/${id}/eligibility`);
                        setEligibility(eligRes.data);
                    } catch {
                        setEligibility(null);
                    }
                }
            } catch (error) {
                console.error("Error fetching book:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchReviews = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/reviews/book/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data.items || []);
                }
            } catch (error) {
                console.error("Failed to fetch reviews", error);
            }
        };

        const fetchEligibility = async () => {
            if (!user) return;
            try {
                const res = await api.get<ReviewEligibility>(`/reviews/book/${id}/eligibility`);
                setEligibility(res.data);
                if (res.data.has_reviewed && res.data.existing_review) {
                    setReviewForm({
                        rating: res.data.existing_review.rating,
                        comment: res.data.existing_review.comment || ""
                    });
                }
            } catch (error) {
                console.error("Failed to fetch review eligibility", error);
            }
        };

        if (id) {
            fetchBookData();
            if (user) {
                fetchEligibility();
            }
        }
    }, [id, user]);

    const handleReviewSubmit = async () => {
        if (!user) {
            router.push("/auth/login");
            return;
        }

        if (reviewForm.rating === 0) {
            setReviewError("Please select a rating.");
            return;
        }

        setIsSubmittingReview(true);
        setReviewError("");

        try {
            if (eligibility?.has_reviewed && eligibility.existing_review) {
                // Update
                await api.put(`/reviews/${eligibility.existing_review.id}`, {
                    rating: reviewForm.rating,
                    comment: reviewForm.comment
                });
            } else {
                // Create
                await api.post(`/reviews/book/${id}`, {
                    rating: reviewForm.rating,
                    comment: reviewForm.comment
                });
            }

            // Refetch all reviews and eligibility
            setIsReviewFormOpen(false);
            const res = await fetch(`http://localhost:8000/api/reviews/book/${id}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.items || []);
            }
            if (user) {
                const eligRes = await api.get<ReviewEligibility>(`/reviews/book/${id}/eligibility`);
                setEligibility(eligRes.data);
            }

        } catch (error: any) {
            console.error("Failed to submit review", error);
            setReviewError(error.response?.data?.detail || "Failed to submit review.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const formatUsername = (name: string) => {
        if (!name) return "Anonymous";
        if (name.length <= 3) return name + "***";
        return name.slice(0, 3) + "***";
    };

    // Similar books: ayrı useEffect ile AI benzerlik endpoint'inden çek
    useEffect(() => {
        if (!id) return;
        setIsLoadingSimilar(true);
        api.get(`/recommendations/similar/${id}?limit=4`)
            .then((res) => {
                setSimilarBooks(res.data?.similar_books ?? []);
            })
            .catch(async () => {
                // embedding yoksa genre bazlı fallback
                try {
                    const fallback = await fetch(`http://localhost:8000/api/books?page_size=5`);
                    if (fallback.ok) {
                        const data = await fallback.json();
                        const items = (data.items ?? []).filter((b: Book) => b.id !== id).slice(0, 4);
                        setSimilarBooks(items.map((b: Book) => ({ ...b, similarity_score: 0 })));
                    }
                } catch { /* sessizce geç */ }
            })
            .finally(() => setIsLoadingSimilar(false));
    }, [id]);

    // view etkileşimini kaydet (kullanıcı giriş yapmışsa)
    useEffect(() => {
        if (!id || !user) return;
        api.post("/users/me/interactions", {
            book_id: id,
            interaction_type: "view",
        }).catch(() => {/* sessizce geç */ });
    }, [id, user]);

    // Reviews tab açıldığında yükle
    useEffect(() => {
        if (activeTab === "reviews") {
            fetchReviews();
        }
    }, [activeTab, fetchReviews]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="max-w-7xl mx-auto px-8 md:px-16 py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="max-w-7xl mx-auto px-8 md:px-16 py-12 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Book not found</h1>
                    <Link href="/home" className="text-primary hover:underline mt-4 inline-block">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    // Mock data for fields missing in backend
    const mockDetails = {
        publisher: "Vipress Inc.",
        publishedDate: "August 10th 2026",
        format: "Paperback",
        pages: 450,
        language: "English",
    };

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                    <Link href="/home" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/categories" className="hover:text-primary transition-colors">Books</Link>
                    <span>/</span>
                    <span className="font-bold text-text line-clamp-1">{book.title}</span>
                </nav>

                {/* Main Product Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Left: Content Info (Title, Desc, Price) - Swapped order to match provided design typically having text left or right? 
                        Wait, the design image shows Text Left, Images Right... or Text Left, Big Image Center??
                        Actually design shows: Title/Desc Left | Big Image Center | Thumbnails Right?
                        Standard E-com is usually Image Left | Details Right.
                        Let's verify the user image "attached photo".
                        The image shows:
                        Left Col: Rating, Title, Author, Description, Price, Actions
                        Center/Right Col: Three visuals (Main Cover, and some lifestyle shots/thumbnails)
                        Let's stick to a 2-column layout: Left (Details), Right (Visuals) to match the distinct look of the provided design.
                    */}

                    {/* Left Column: Details */}
                    <div className="flex flex-col order-2 lg:order-1">
                        {/* Rating */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                                <span className="text-sm font-bold text-orange-700">{book.rating ? Number(book.rating).toFixed(1) : "-"}</span>
                            </div>
                            <button onClick={() => setActiveTab("reviews")} className="text-sm text-gray-500 underline cursor-pointer hover:text-primary transition-colors">
                                {reviewsData ? `${reviewsData.total} Reviews` : "Reviews"}
                            </button>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text mb-2 leading-tight">
                            {book.title}
                        </h1>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
                                {/* Placeholder for author image */}
                                <User className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500" />
                            </div>
                            <span className="text-lg text-gray-700 font-medium">{book.author}</span>
                        </div>

                        <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                            {book.description || "No description available for this book."}
                        </p>

                        <div className="flex items-end gap-4 mb-8">
                            <span className="text-4xl font-bold text-primary">${book.price}</span>
                            {/* Mock original price for discount effect */}
                            <span className="text-xl text-gray-400 line-through mb-1">${(book.price * 1.2).toFixed(2)}</span>
                            <span className="mb-1 px-2 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded">-20%</span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-4 mb-8">
                            {/* Quantity */}
                            <div className="flex items-center bg-gray-100 rounded-xl px-2">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-3 text-gray-500 hover:text-text transition-colors"
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="p-3 text-gray-500 hover:text-text transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Add to Cart */}
                            <button
                                onClick={handleAddToCart}
                                className={`flex-1 text-white font-bold text-lg py-3 px-8 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 min-w-[200px] ${isAdded ? "bg-green-500" : "bg-primary"}`}
                            >
                                <ShoppingCart size={20} />
                                {isAdded ? "ADDED!" : "BUY"}
                            </button>

                            {/* Wishlist */}
                            <button
                                onClick={handleLike}
                                className={`p-3 rounded-xl border transition-all ${isLiked ? "border-accent text-accent bg-gray-200" : "border-gray-200 text-gray-400 hover:text-accent hover:border-accent"}`}
                            >
                                <Heart size={24} className={isLiked ? "fill-current" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Visuals */}
                    <div className="order-1 lg:order-2 flex gap-4 h-[500px] lg:h-[600px]">
                        {/* Main Cover (Center in design concept) */}
                        <div className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl group">
                            <Image
                                src={book.cover_url || "/book-placeholder.jpg"}
                                alt={book.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                            {/* Overlay Text from Design (Mocked) */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-white">
                                <p className="text-opacity-80 text-white text-sm uppercase tracking-widest mb-2">Editor's Choice</p>
                                <h3 className="font-heading text-2xl font-bold">Best Seller 2026</h3>
                            </div>
                        </div>

                        {/* Thumbnails Strip (Right in design concept) */}
                        <div className="flex flex-col gap-4 w-24 hidden md:flex">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer opacity-70 hover:opacity-100 transition-opacity border-2 border-transparent hover:border-primary">
                                    <Image
                                        src={book.cover_url || "/book-placeholder.jpg"}
                                        alt={`View ${i}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>



                {/* Tabs: Details / Reviews */}
                <div className="mb-10">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
                        {(["details", "reviews"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-lg font-bold text-sm capitalize transition-all ${activeTab === tab
                                    ? "bg-white text-text shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {tab === "reviews" && reviewsData ? `Reviews (${reviewsData.total})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Details Tab */}
                    {activeTab === "details" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-5">
                                <h3 className="text-2xl font-heading font-bold text-text mb-6">Book Details</h3>
                                <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
                                    <div className="space-y-4">
                                        {[
                                            { label: "Book Title", value: book.title },
                                            { label: "Author", value: book.author },
                                            { label: "Categories", value: book.genres?.slice(0, 3).join(", ") || "N/A" },
                                            { label: "ISBN", value: book.isbn || "N/A" },
                                            { label: "Edition Language", value: mockDetails.language },
                                            { label: "Book Format", value: `${mockDetails.format}, ${mockDetails.pages} Pages` },
                                            { label: "Date Published", value: mockDetails.publishedDate },
                                            { label: "Publisher", value: mockDetails.publisher },
                                        ].map(({ label, value }, i, arr) => (
                                            <div key={label} className={`flex justify-between py-3 ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}>
                                                <span className="text-gray-500 font-medium">{label}</span>
                                                <span className="text-text font-bold text-right max-w-[55%]">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === "reviews" && (
                        <div className="space-y-8">
                            {/* Summary Bar */}
                            {reviewsData && reviewsData.total > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                                    <div className="text-center min-w-[120px]">
                                        <div className="text-6xl font-bold text-text mb-2">{reviewsData.average_rating.toFixed(1)}</div>
                                        <div className="flex justify-center gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviewsData.average_rating) ? "fill-orange-400 text-orange-400" : "text-gray-200"}`} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500">{reviewsData.total} reviews</p>
                                    </div>
                                    <div className="flex-1 w-full space-y-2">
                                        {[5, 4, 3, 2, 1].map((s) => {
                                            const cnt = reviewsData.rating_distribution[s] ?? 0;
                                            const pct = reviewsData.total > 0 ? (cnt / reviewsData.total) * 100 : 0;
                                            return (
                                                <div key={s} className="flex items-center gap-3 text-sm">
                                                    <span className="font-bold w-3">{s}</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="w-8 text-right font-medium text-gray-500">{cnt}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Write Review Form */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h4 className="font-heading font-bold text-text text-lg mb-4 flex items-center gap-2">
                                    {editingReview ? <><Pencil size={16} className="text-primary" /> Edit Your Review</> : "Write a Review"}
                                </h4>
                                {!user ? (
                                    <p className="text-gray-500 text-sm">
                                        <Link href="/auth/login" className="text-primary font-bold hover:underline">Log in</Link> to leave a review.
                                    </p>
                                ) : eligibility && !eligibility.can_review && !eligibility.has_reviewed ? (
                                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 flex items-start gap-3">
                                        <AlertCircle className="text-orange-500 mt-0.5 flex-shrink-0" size={20} />
                                        <div>
                                            <h4 className="font-bold text-orange-800 mb-1">Review locked</h4>
                                            <p className="text-orange-700 text-sm">You must purchase this book before you can leave a review.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Star Picker */}
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button
                                                    key={s}
                                                    onMouseEnter={() => setHoverRating(s)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setMyRating(s)}
                                                    className="p-0.5"
                                                >
                                                    <Star className={`w-7 h-7 transition-colors ${s <= (hoverRating || myRating) ? "fill-orange-400 text-orange-400" : "text-gray-200"}`} />
                                                </button>
                                            ))}
                                            {myRating > 0 && (
                                                <span className="ml-2 text-sm font-bold text-gray-600 self-center">
                                                    {["", "Poor", "Fair", "Good", "Great", "Excellent"][myRating]}
                                                </span>
                                            )}
                                        </div>
                                        <textarea
                                            value={myComment}
                                            onChange={(e) => setMyComment(e.target.value)}
                                            placeholder="Share your thoughts about this book (optional)..."
                                            rows={3}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-text placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={submitReview}
                                                disabled={isSubmittingReview || myRating === 0}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all text-sm"
                                            >
                                                <Send size={14} />
                                                {isSubmittingReview ? "Saving..." : reviewSuccess ? "Saved!" : editingReview ? "Update Review" : "Post Review"}
                                            </button>
                                            {editingReview && (
                                                <button
                                                    onClick={deleteMyReview}
                                                    className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-all text-sm"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Review List */}
                            {isLoadingReviews ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
                                </div>
                            ) : reviewsData && reviewsData.reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviewsData.reviews.map((review) => (
                                        <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                                                    {review.reviewer_name?.charAt(0)?.toUpperCase() ?? "?"}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-text text-sm">{review.reviewer_name ?? "Anonymous"}</span>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-orange-400 text-orange-400" : "text-gray-200"}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-gray-400 ml-auto">
                                                            {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                        </span>
                                                    </div>
                                                    {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="font-medium">No reviews yet. Be the first to review!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Similar Books */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-8">
                        <h3 className="text-2xl font-heading font-bold text-text">Similar Books</h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">AI Powered</span>
                    </div>

                    {isLoadingSimilar ? (
                        <div className="flex gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex-1 h-72 bg-gray-100 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : similarBooks.length === 0 ? (
                        <p className="text-gray-400 text-sm">No similar books found.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {similarBooks.map((related) => (
                                <div key={related.id} className="relative">
                                    {related.similarity_score > 0 && (
                                        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-2 py-1 rounded-full shadow-sm border border-primary/20">
                                            {Math.round(related.similarity_score * 100)}% match
                                        </div>
                                    )}
                                    <BookCard
                                        id={related.id}
                                        title={related.title}
                                        author={related.author || ""}
                                        price={Number(related.price ?? 0)}
                                        rating={4.5}
                                        imageSrc={related.cover_url || "/book-placeholder.jpg"}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
