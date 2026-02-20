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
import { Star, Heart, Share2, Minus, Plus, ShoppingCart, User } from "lucide-react";

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
            } catch (error) {
                console.error("Error fetching book:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchBookData();
        }
    }, [id]);

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
                                <span className="text-sm font-bold text-orange-700">{book.rating || 4.5}</span>
                            </div>
                            <span className="text-sm text-gray-500 underline cursor-pointer">{mockDetails.reviews_count} Reviews</span>
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
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                            {/* Big Score */}
                            <div className="text-center md:text-left min-w-[120px]">
                                <div className="text-6xl font-bold text-text mb-2">4.7</div>
                                <div className="flex justify-center md:justify-start gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className="w-4 h-4 fill-orange-400 text-orange-400" />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500">out of 5</p>
                            </div>

                            {/* Bars */}
                            <div className="flex-1 w-full space-y-3">
                                {[
                                    { stars: 5, pct: "85%" },
                                    { stars: 4, pct: "10%" },
                                    { stars: 3, pct: "3%" },
                                    { stars: 2, pct: "1%" },
                                    { stars: 1, pct: "1%" },
                                ].map((row) => (
                                    <div key={row.stars} className="flex items-center gap-3 text-sm">
                                        <span className="font-bold w-3">{row.stars}</span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-400 rounded-full" style={{ width: row.pct }}></div>
                                        </div>
                                        <span className="w-8 text-right font-medium text-gray-500">{row.pct}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center md:justify-start">
                            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md font-bold text-text transition-all">
                                View reviews ↓
                            </button>
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
