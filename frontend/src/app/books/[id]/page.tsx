"use client";

import { useFavorites } from "@/context/FavoritesContext"; // Add import
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BookCard from "@/components/ui/BookCard";
import { Star, Heart, Share2, Minus, Plus, ShoppingCart, User, MessageSquare, Edit2, AlertCircle } from "lucide-react";
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

export default function BookDetailPage() {
    const params = useParams();
    const { id } = params;
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites(); // Use new hook
    const router = useRouter();

    const [book, setBook] = useState<Book | null>(null);
    const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isAdded, setIsAdded] = useState(false);
    const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");

    const [reviews, setReviews] = useState<BookReview[]>([]);
    const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState("");

    const isLiked = book ? isFavorite(book.id) : false; // Derived state

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
                // Fetch main book details
                const res = await fetch(`http://localhost:8000/api/books/${id}`);
                if (!res.ok) throw new Error("Book not found");
                const data = await res.json();
                setBook(data);

                // Fetch related books (mocking by just fetching latest 4 books for now)
                // In a real app, we'd filter by genre or author
                const relatedRes = await fetch(`http://localhost:8000/api/books?page_size=4`);
                if (relatedRes.ok) {
                    const relatedData = await relatedRes.json();
                    setRelatedBooks(relatedData.items.filter((b: Book) => b.id !== id));
                }

                // Fetch reviews
                fetchReviews();
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
        reviews_count: 127
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
                            <span className="text-sm text-gray-500 underline cursor-pointer">{book.reviews_count || 0} Review{book.reviews_count !== 1 ? 's' : ''}</span>
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

                {/* Details & Specs Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
                    {/* Specs Table */}
                    <div className="lg:col-span-5">
                        <h3 className="text-2xl font-heading font-bold text-text mb-6">Details</h3>
                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
                            <div className="space-y-4">
                                <div className="flex justify-between py-3 border-b border-gray-200">
                                    <span className="text-gray-500 font-medium">Book Title</span>
                                    <span className="text-text font-bold text-right">{book.title}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-200">
                                    <span className="text-gray-500 font-medium">Author</span>
                                    <span className="text-text font-bold text-right">{book.author}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-200">
                                    <span className="text-gray-500 font-medium">Categories</span>
                                    <span className="text-text font-bold text-right">{book.genres?.slice(0, 3).join(", ") || "N/A"}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-200">
                                    <span className="text-gray-500 font-medium">ISBN</span>
                                    <span className="text-text font-bold text-right">{book.isbn || "N/A"}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-200">
                                    <span className="text-gray-500 font-medium">Edition Language</span>
                                    <span className="text-text font-bold text-right">{mockDetails.language}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-200">
                                    <span className="text-gray-500 font-medium">Book Format</span>
                                    <span className="text-text font-bold text-right">{mockDetails.format}, {mockDetails.pages} Pages</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-200">
                                    <span className="text-gray-500 font-medium">Date Published</span>
                                    <span className="text-text font-bold text-right">{mockDetails.publishedDate}</span>
                                </div>
                                <div className="flex justify-between py-3">
                                    <span className="text-gray-500 font-medium">Publisher</span>
                                    <span className="text-text font-bold text-right">{mockDetails.publisher}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Visualization (Right side logic) */}
                    <div className="lg:col-span-1"></div> {/* Spacer */}
                    <div className="lg:col-span-6">
                        <h3 className="text-2xl font-heading font-bold text-text mb-6">Customer Reviews</h3>
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center mb-8">
                            {/* Big Score */}
                            <div className="text-center md:text-left min-w-[120px]">
                                <div className="text-6xl font-bold text-text mb-2">{(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)}</div>
                                <div className="flex justify-center md:justify-start gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)) ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500">{reviews.length} reviews</p>
                            </div>

                            {/* Bars */}
                            <div className="flex-1 w-full space-y-3">
                                {[
                                    { stars: 5 },
                                    { stars: 4 },
                                    { stars: 3 },
                                    { stars: 2 },
                                    { stars: 1 },
                                ].map((row) => {
                                    const count = reviews.filter(r => r.rating === row.stars).length;
                                    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                                    return (
                                        <div key={row.stars} className="flex items-center gap-3 text-sm">
                                            <span className="font-bold w-3">{row.stars}</span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }}></div>
                                            </div>
                                            <span className="w-8 text-right font-medium text-gray-500">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Review Action Area */}
                        <div className="mb-8">
                            {user ? (
                                eligibility ? (
                                    eligibility.can_review || eligibility.has_reviewed ? (
                                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                            {!isReviewFormOpen ? (
                                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-800">
                                                            {eligibility.has_reviewed ? "Update your review" : "Share your thoughts"}
                                                        </h4>
                                                        <p className="text-gray-500 text-sm">
                                                            {eligibility.has_reviewed ? "You have already reviewed this book." : "Help others by sharing your experience."}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsReviewFormOpen(true)}
                                                        className="px-6 py-2.5 bg-text text-white font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-sm w-full md:w-auto flex items-center justify-center gap-2"
                                                    >
                                                        {eligibility.has_reviewed ? <Edit2 size={18} /> : <MessageSquare size={18} />}
                                                        {eligibility.has_reviewed ? "Update Review" : "Add Review"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-lg text-gray-800">
                                                            {eligibility.has_reviewed ? "Edit Review" : "Write a Review"}
                                                        </h4>
                                                        <button
                                                            onClick={() => setIsReviewFormOpen(false)}
                                                            className="text-gray-400 hover:text-gray-600 font-medium text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>

                                                    {reviewError && (
                                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100">
                                                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                                            <p>{reviewError}</p>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                                                >
                                                                    <Star
                                                                        size={28}
                                                                        fill={star <= reviewForm.rating ? "currentColor" : "none"}
                                                                        className={star <= reviewForm.rating ? "text-orange-400" : "text-gray-300"}
                                                                    />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Review (Optional)</label>
                                                        <textarea
                                                            value={reviewForm.comment}
                                                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                            className="w-full bg-white border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow outline-none resize-none"
                                                            rows={4}
                                                            placeholder="What did you like or dislike? What should others know?"
                                                        ></textarea>
                                                    </div>

                                                    <div className="flex justify-end pt-2">
                                                        <button
                                                            onClick={handleReviewSubmit}
                                                            disabled={isSubmittingReview}
                                                            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[150px]"
                                                        >
                                                            {isSubmittingReview ? (
                                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                eligibility.has_reviewed ? "Save Changes" : "Submit Review"
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 flex items-start gap-3">
                                            <AlertCircle className="text-orange-500 mt-0.5 flex-shrink-0" size={20} />
                                            <div>
                                                <h4 className="font-bold text-orange-800 mb-1">Review locked</h4>
                                                <p className="text-orange-700 text-sm">You have to buy this book if you want to review this book.</p>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex justify-center py-4 text-gray-400">Loading eligibility...</div>
                                )
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                                    <p className="text-gray-600 mb-4 font-medium">Please sign in to write a review for this book.</p>
                                    <Link href="/auth/login" className="inline-block px-6 py-2 bg-text text-white font-bold rounded-lg hover:bg-opacity-90 transition-all">
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Reviews List */}
                        <div className="space-y-6">
                            {reviews.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <MessageSquare className="mx-auto text-gray-300 w-12 h-12 mb-3" />
                                    <p className="text-gray-500 font-medium">No reviews yet.</p>
                                    <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
                                </div>
                            ) : (
                                reviews.map((review) => {
                                    const isEdited = new Date(review.updated_at).getTime() > new Date(review.created_at).getTime() + 1000;
                                    return (
                                        <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {review.user_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{formatUsername(review.user_name)}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                            <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                                            {isEdited && (
                                                                <span className="italic text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">(Edited)</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star
                                                            key={star}
                                                            size={14}
                                                            fill={star <= review.rating ? "currentColor" : "none"}
                                                            className={star <= review.rating ? "text-orange-400" : "text-gray-300"}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="text-gray-700 leading-relaxed mt-4">
                                                    {review.comment}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Books */}
                <div className="mb-8">
                    <h3 className="text-2xl font-heading font-bold text-text mb-8">Related books</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedBooks.map((related) => (
                            <div key={related.id} className="block h-full">
                                <BookCard
                                    id={related.id}
                                    title={related.title}
                                    author={related.author}
                                    price={Number(related.price)}
                                    rating={related.rating || 4.5}
                                    imageSrc={related.cover_url || "/book-placeholder.jpg"}
                                />
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}
