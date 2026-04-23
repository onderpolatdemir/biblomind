"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ImagePlus, ArrowLeft, Plus, X, Globe, Lock,
    BookOpen, Link2, MapPin, Shield, Sparkles, Check
} from "lucide-react";
import { CreateCommunityForm, CommunityPrivacy } from "@/types/social";
import { CATEGORIES } from "@/lib/constants";

const AVAILABLE_TAGS = CATEGORIES.map((c) => c.name);

export default function CreateCommunityPage() {
    const router = useRouter();
    const bannerRef = useRef<HTMLInputElement>(null);
    const profileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<CreateCommunityForm>({
        name: "",
        description: "",
        profile_photo: null,
        profile_photo_preview: "",
        banner_photo: null,
        banner_photo_preview: "",
        category_tags: [],
        privacy: "public",
        rules: [],
        related_books: [],
        website: "",
        location: "",
    });

    const [newRule, setNewRule] = useState("");
    const [newBookTitle, setNewBookTitle] = useState("");
    const [newBookAuthor, setNewBookAuthor] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreated, setIsCreated] = useState(false);

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setForm((prev) => ({
            ...prev,
            banner_photo: file,
            banner_photo_preview: URL.createObjectURL(file),
        }));
    };

    const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setForm((prev) => ({
            ...prev,
            profile_photo: file,
            profile_photo_preview: URL.createObjectURL(file),
        }));
    };

    const toggleTag = (tag: string) => {
        setForm((prev) => ({
            ...prev,
            category_tags: prev.category_tags.includes(tag)
                ? prev.category_tags.filter((t) => t !== tag)
                : [...prev.category_tags, tag],
        }));
    };

    const addRule = () => {
        if (!newRule.trim()) return;
        setForm((prev) => ({
            ...prev,
            rules: [...prev.rules, newRule.trim()],
        }));
        setNewRule("");
    };

    const removeRule = (idx: number) => {
        setForm((prev) => ({
            ...prev,
            rules: prev.rules.filter((_, i) => i !== idx),
        }));
    };

    const addBook = () => {
        if (!newBookTitle.trim()) return;
        setForm((prev) => ({
            ...prev,
            related_books: [
                ...prev.related_books,
                { title: newBookTitle.trim(), author: newBookAuthor.trim() },
            ],
        }));
        setNewBookTitle("");
        setNewBookAuthor("");
    };

    const removeBook = (idx: number) => {
        setForm((prev) => ({
            ...prev,
            related_books: prev.related_books.filter((_, i) => i !== idx),
        }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.description.trim()) return;
        setIsSubmitting(true);

        // Simulate API call
        await new Promise((r) => setTimeout(r, 1500));

        setIsSubmitting(false);
        setIsCreated(true);

        // Redirect after short celebration
        setTimeout(() => {
            router.push("/social/communities");
        }, 2000);
    };

    const isValid = form.name.trim().length > 0 && form.description.trim().length > 0;

    // ── Success state ──
    if (isCreated) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                    style={{ backgroundColor: "var(--social-accent-dim)" }}
                >
                    <Check size={40} style={{ color: "var(--social-accent)" }} />
                </motion.div>
                <h2
                    className="text-2xl font-heading font-bold mb-2"
                    style={{ color: "var(--social-text)" }}
                >
                    Community Created! 🎉
                </h2>
                <p className="text-sm" style={{ color: "var(--social-text-muted)" }}>
                    Redirecting you to communities...
                </p>
            </motion.div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors"
                    style={{ color: "var(--social-text-muted)" }}
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <h1
                    className="text-3xl font-heading font-bold mb-1"
                    style={{ color: "var(--social-text)" }}
                >
                    Create a Community
                </h1>
                <p className="text-sm" style={{ color: "var(--social-text-muted)" }}>
                    Build a space for readers who share your passion.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
            >
                {/* ── Banner Upload ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        Banner Photo
                    </label>
                    <div
                        className="upload-zone relative h-40 flex items-center justify-center overflow-hidden"
                        onClick={() => bannerRef.current?.click()}
                    >
                        {form.banner_photo_preview ? (
                            <>
                                <img
                                    src={form.banner_photo_preview}
                                    alt="Banner preview"
                                    className="w-full h-full object-cover rounded-xl"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                                    <p className="text-sm font-bold" style={{ color: "var(--social-text)" }}>
                                        Change Banner
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <ImagePlus size={32} className="mx-auto mb-2" style={{ color: "var(--social-text-muted)" }} />
                                <p className="text-sm font-medium" style={{ color: "var(--social-text-muted)" }}>
                                    Click to upload banner (recommended 1200×400)
                                </p>
                            </div>
                        )}
                        <input
                            ref={bannerRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleBannerUpload}
                        />
                    </div>
                </div>

                {/* ── Profile Photo Upload ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        Profile Photo
                    </label>
                    <div className="flex items-center gap-4">
                        <div
                            className="upload-zone w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                            onClick={() => profileRef.current?.click()}
                        >
                            {form.profile_photo_preview ? (
                                <img
                                    src={form.profile_photo_preview}
                                    alt="Profile preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <ImagePlus size={24} style={{ color: "var(--social-text-muted)" }} />
                            )}
                        </div>
                        <p className="text-xs" style={{ color: "var(--social-text-muted)" }}>
                            Square image recommended. This will be displayed as the community icon.
                        </p>
                        <input
                            ref={profileRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleProfileUpload}
                        />
                    </div>
                </div>

                {/* ── Name ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        Community Name <span style={{ color: "var(--social-danger)" }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Lord of the Rings Lovers"
                        className="social-input w-full"
                        maxLength={100}
                    />
                </div>

                {/* ── Description ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        Description <span style={{ color: "var(--social-danger)" }}>*</span>
                    </label>
                    <textarea
                        value={form.description}
                        onChange={(e) =>
                            setForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Tell people what this community is about..."
                        className="social-textarea w-full"
                        rows={4}
                        maxLength={500}
                    />
                    <p
                        className="text-xs mt-1 text-right"
                        style={{ color: "var(--social-text-muted)" }}
                    >
                        {form.description.length}/500
                    </p>
                </div>

                {/* ── Category Tags ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        Category Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`social-tag text-xs transition-all ${
                                    form.category_tags.includes(tag) ? "social-tag-active" : ""
                                }`}
                            >
                                {form.category_tags.includes(tag) && (
                                    <Check size={10} className="mr-1" />
                                )}
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Privacy ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        Privacy
                    </label>
                    <div className="flex gap-3">
                        {(["public", "private"] as CommunityPrivacy[]).map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setForm((prev) => ({ ...prev, privacy: opt }))}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex-1"
                                style={{
                                    backgroundColor:
                                        form.privacy === opt
                                            ? "var(--social-accent-dim)"
                                            : "var(--social-bg-secondary)",
                                    border: `1px solid ${
                                        form.privacy === opt
                                            ? "var(--social-accent)"
                                            : "var(--social-border)"
                                    }`,
                                    color:
                                        form.privacy === opt
                                            ? "var(--social-accent)"
                                            : "var(--social-text-muted)",
                                }}
                            >
                                {opt === "public" ? <Globe size={16} /> : <Lock size={16} />}
                                {opt === "public" ? "Public — Anyone can join" : "Private — Invite only"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Community Rules ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2 flex items-center gap-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        <Shield size={14} style={{ color: "var(--social-accent)" }} />
                        Community Rules
                    </label>

                    {form.rules.length > 0 && (
                        <div className="flex flex-col gap-2 mb-3">
                            {form.rules.map((rule, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 p-3 rounded-xl"
                                    style={{ backgroundColor: "var(--social-bg-secondary)" }}
                                >
                                    <span
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                        style={{
                                            backgroundColor: "var(--social-accent-dim)",
                                            color: "var(--social-accent)",
                                        }}
                                    >
                                        {i + 1}
                                    </span>
                                    <p
                                        className="text-sm flex-1"
                                        style={{ color: "var(--social-text-secondary)" }}
                                    >
                                        {rule}
                                    </p>
                                    <button
                                        onClick={() => removeRule(i)}
                                        className="p-1 rounded-md transition-colors"
                                        style={{ color: "var(--social-danger)" }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newRule}
                            onChange={(e) => setNewRule(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addRule()}
                            placeholder="Add a rule..."
                            className="social-input flex-1 text-sm"
                        />
                        <button
                            onClick={addRule}
                            disabled={!newRule.trim()}
                            className="social-btn-outline px-3 disabled:opacity-30"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Related Books ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2 flex items-center gap-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        <BookOpen size={14} style={{ color: "var(--social-accent)" }} />
                        Related Books
                    </label>

                    {form.related_books.length > 0 && (
                        <div className="flex flex-col gap-2 mb-3">
                            {form.related_books.map((book, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ backgroundColor: "var(--social-bg-secondary)" }}
                                >
                                    <BookOpen size={14} style={{ color: "var(--social-accent)" }} />
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="text-sm font-semibold truncate"
                                            style={{ color: "var(--social-text)" }}
                                        >
                                            {book.title}
                                        </p>
                                        {book.author && (
                                            <p
                                                className="text-xs truncate"
                                                style={{ color: "var(--social-text-muted)" }}
                                            >
                                                by {book.author}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeBook(i)}
                                        className="p-1 rounded-md transition-colors"
                                        style={{ color: "var(--social-danger)" }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newBookTitle}
                            onChange={(e) => setNewBookTitle(e.target.value)}
                            placeholder="Book title"
                            className="social-input flex-1 text-sm"
                        />
                        <input
                            type="text"
                            value={newBookAuthor}
                            onChange={(e) => setNewBookAuthor(e.target.value)}
                            placeholder="Author"
                            className="social-input w-36 text-sm"
                        />
                        <button
                            onClick={addBook}
                            disabled={!newBookTitle.trim()}
                            className="social-btn-outline px-3 disabled:opacity-30"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Website ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2 flex items-center gap-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        <Link2 size={14} style={{ color: "var(--social-text-muted)" }} />
                        Website / External Link
                    </label>
                    <input
                        type="url"
                        value={form.website}
                        onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                        placeholder="https://example.com"
                        className="social-input w-full text-sm"
                    />
                </div>

                {/* ── Location ── */}
                <div>
                    <label
                        className="block text-sm font-bold mb-2 flex items-center gap-2"
                        style={{ color: "var(--social-text)" }}
                    >
                        <MapPin size={14} style={{ color: "var(--social-text-muted)" }} />
                        Location (optional)
                    </label>
                    <input
                        type="text"
                        value={form.location}
                        onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Worldwide, Istanbul, Online"
                        className="social-input w-full text-sm"
                    />
                </div>

                {/* ── Submit ── */}
                <div
                    className="pt-6 border-t flex items-center justify-between"
                    style={{ borderColor: "var(--social-border)" }}
                >
                    <button
                        onClick={() => router.back()}
                        className="social-btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                        className="social-btn-primary flex items-center gap-2 px-8 py-3"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Create Community
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
