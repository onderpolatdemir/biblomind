"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ImagePlus, Send } from "lucide-react";

interface PostComposerProps {
    onPost?: (content: string, imageFile?: File) => void;
    placeholder?: string;
}

export default function PostComposer({
    onPost,
    placeholder = "Tell your friends about your thoughts...",
}: PostComposerProps) {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U";

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handlePost = () => {
        if (!content.trim() && !imageFile) return;
        onPost?.(content.trim(), imageFile || undefined);
        setContent("");
        setImagePreview(null);
        setImageFile(null);
    };

    return (
        <div className="social-card p-4">
            <div className="flex items-start gap-3">
                {/* User Avatar */}
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                        backgroundColor: "var(--social-card-elevated)",
                        color: "var(--social-text)",
                    }}
                >
                    {userInitial}
                </div>

                {/* Input Area */}
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={placeholder}
                        rows={2}
                        className="social-textarea w-full text-sm resize-none border-none bg-transparent p-0 focus:ring-0 focus:shadow-none"
                        style={{
                            color: "var(--social-text-secondary)",
                            minHeight: "48px",
                            boxShadow: "none",
                        }}
                    />

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="relative mt-2 rounded-xl overflow-hidden max-h-[200px] inline-block">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-h-[200px] rounded-xl object-cover"
                            />
                            <button
                                onClick={() => {
                                    setImagePreview(null);
                                    setImageFile(null);
                                }}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{
                                    backgroundColor: "rgba(0,0,0,0.7)",
                                    color: "var(--social-text)",
                                }}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Action Row */}
                    <div
                        className="flex items-center justify-between mt-3 pt-3 border-t"
                        style={{ borderColor: "var(--social-border)" }}
                    >
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer p-2 rounded-lg transition-colors hover:bg-[var(--social-card-hover)]">
                                <ImagePlus
                                    size={18}
                                    style={{ color: "var(--social-text-muted)" }}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleImageSelect}
                                />
                            </label>
                        </div>

                        <button
                            onClick={handlePost}
                            disabled={!content.trim() && !imageFile}
                            className="social-btn-primary flex items-center gap-1.5 text-xs"
                        >
                            <Send size={14} />
                            Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
