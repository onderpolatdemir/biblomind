"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface Book {
    id: string;
    title: string;
    author: string;
    price: number;
    stock: number;
    genres: string[];
    cover_url?: string;
    isbn?: string;
    description?: string;
}

interface BookForm {
    title: string;
    author: string;
    price: string;
    stock: string;
    genres: string;
    cover_url: string;
    isbn: string;
    description: string;
}

const EMPTY_FORM: BookForm = {
    title: "", author: "", price: "", stock: "", genres: "",
    cover_url: "", isbn: "", description: "",
};

export default function AdminBooksPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [form, setForm] = useState<BookForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchBooks = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                page_size: String(pageSize),
                ...(debouncedSearch ? { title: debouncedSearch } : {}),
            });
            const res = await api.get(`/books?${params}`);
            setBooks(res.data.items ?? []);
            setTotal(res.data.total ?? 0);
        } catch {
            setBooks([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { fetchBooks(); }, [fetchBooks]);

    const openAdd = () => { setEditingBook(null); setForm(EMPTY_FORM); setShowModal(true); };
    const openEdit = (book: Book) => {
        setEditingBook(book);
        setForm({
            title: book.title,
            author: book.author,
            price: String(book.price),
            stock: String(book.stock),
            genres: (book.genres ?? []).join(", "),
            cover_url: book.cover_url ?? "",
            isbn: book.isbn ?? "",
            description: book.description ?? "",
        });
        setShowModal(true);
    };

    const saveBook = async () => {
        if (!form.title.trim() || !form.author.trim()) return;
        setSaving(true);
        const payload = {
            title: form.title.trim(),
            author: form.author.trim(),
            price: parseFloat(form.price) || 0,
            stock: parseInt(form.stock) || 0,
            genres: form.genres.split(",").map((g) => g.trim()).filter(Boolean),
            cover_url: form.cover_url.trim() || null,
            isbn: form.isbn.trim() || null,
            description: form.description.trim() || null,
        };
        try {
            if (editingBook) {
                await api.put(`/books/${editingBook.id}`, payload);
            } else {
                await api.post("/books", payload);
            }
            setShowModal(false);
            fetchBooks();
        } catch (e: any) {
            alert(e?.response?.data?.detail ?? "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const deleteBook = async (id: string) => {
        try {
            await api.delete(`/books/${id}`);
            setDeleteId(null);
            fetchBooks();
        } catch (e: any) {
            alert(e?.response?.data?.detail ?? "Delete failed");
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gray-800">Books</h1>
                    <p className="text-gray-500 mt-1">{total} books in catalog</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-[#2f2f2f] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-accent transition-all shadow-sm"
                >
                    <Plus size={16} /> Add Book
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by title..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : books.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <BookOpen size={40} className="mx-auto mb-3 text-gray-200" />
                        <p>No books found</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Title</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Author</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Price</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Stock</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Genres</th>
                                <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {books.map((book) => (
                                <tr key={book.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3.5 font-medium text-gray-800 max-w-[200px] truncate">{book.title}</td>
                                    <td className="px-5 py-3.5 text-gray-600 max-w-[140px] truncate">{book.author}</td>
                                    <td className="px-5 py-3.5 font-bold text-accent">${Number(book.price).toFixed(2)}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`font-medium ${book.stock === 0 ? "text-red-500" : book.stock < 5 ? "text-orange-500" : "text-green-600"}`}>
                                            {book.stock}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-wrap gap-1">
                                            {(book.genres ?? []).slice(0, 2).map((g) => (
                                                <span key={g} className="px-2 py-0.5 bg-secondary text-text text-xs rounded-full">{g}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(book)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(book.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-white disabled:opacity-40 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-white disabled:opacity-40 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <h2 className="font-heading font-bold text-gray-800 text-lg">
                                    {editingBook ? "Edit Book" : "Add New Book"}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                                {[
                                    { label: "Title *", key: "title", placeholder: "Book title" },
                                    { label: "Author *", key: "author", placeholder: "Author name" },
                                    { label: "ISBN", key: "isbn", placeholder: "978-..." },
                                    { label: "Cover URL", key: "cover_url", placeholder: "https://..." },
                                    { label: "Genres (comma separated)", key: "genres", placeholder: "Fiction, Classic" },
                                ].map(({ label, key, placeholder }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                                        <input
                                            value={form[key as keyof BookForm]}
                                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
                                        />
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Price ($)", key: "price", placeholder: "19.99" },
                                        { label: "Stock", key: "stock", placeholder: "100" },
                                    ].map(({ label, key, placeholder }) => (
                                        <div key={key}>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                                            <input
                                                type="number"
                                                value={form[key as keyof BookForm]}
                                                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                                placeholder={placeholder}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                        placeholder="Short description..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={saveBook}
                                    disabled={saving || !form.title.trim() || !form.author.trim()}
                                    className="flex-1 py-2.5 rounded-full bg-[#2f2f2f] text-white text-sm font-bold hover:bg-accent transition-all disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : editingBook ? "Save Changes" : "Add Book"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm */}
            <AnimatePresence>
                {deleteId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDeleteId(null)}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center"
                        >
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={22} className="text-red-600" />
                            </div>
                            <h3 className="font-heading font-bold text-gray-800 mb-2">Delete this book?</h3>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button onClick={() => deleteBook(deleteId)} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-700">
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
