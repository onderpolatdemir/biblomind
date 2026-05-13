"use client";

import { useState, useRef } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import api from "@/lib/api";

interface PostComposerProps {
    communityId: string;
    onPost: () => void;
    authorInitial?: string;
}

export default function PostComposer({ communityId, onPost, authorInitial = "U" }: PostComposerProps) {
    const [content, setContent] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const form = new FormData();
            form.append("content", content.trim());
            if (image) form.append("image", image);
            await api.post(`/communities/${communityId}/posts`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setContent("");
            clearImage();
            onPost();
        } catch {
            alert("Failed to post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-text flex-shrink-0">
                    {authorInitial}
                </div>

                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share something with this community..."
                        maxLength={500}
                        rows={3}
                        className="w-full text-sm text-gray-700 resize-none outline-none border border-gray-200 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />

                    {imagePreview && (
                        <div className="relative mt-2 w-40 h-24 rounded-xl overflow-hidden">
                            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                            <button
                                onClick={clearImage}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                title="Add image"
                            >
                                <ImagePlus size={18} />
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            <span className="text-xs text-gray-400">{content.length}/500</span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim() || isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all"
                        >
                            <Send size={14} />
                            {isSubmitting ? "Posting..." : "Post"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}