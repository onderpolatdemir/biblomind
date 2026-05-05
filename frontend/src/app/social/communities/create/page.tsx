"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Plus, X, ImagePlus } from "lucide-react";
import api from "@/lib/api";

export default function CreateCommunityPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [privacy, setPrivacy] = useState<"public" | "private">("public");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [rules, setRules] = useState<string[]>([""]);
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [bannerPhoto, setBannerPhoto] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t)) {
            setTags((prev) => [...prev, t]);
        }
        setTagInput("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Community name is required.");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const data = {
                name: name.trim(),
                description: description.trim() || null,
                privacy,
                category_tags: tags,
                rules: rules.filter((r) => r.trim()),
            };
            const form = new FormData();
            form.append("data", JSON.stringify(data));
            if (profilePhoto) form.append("profile_photo", profilePhoto);
            if (bannerPhoto) form.append("banner_photo", bannerPhoto);

            const res = await api.post("/communities/", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            router.push(`/social/communities/${res.data.id}`);
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Failed to create community.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-body">
            <Header />
            <main className="max-w-2xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">Create Community</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h2 className="font-bold text-gray-700">Visuals</h2>
                        <div className="flex gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 block mb-1">Profile Photo</label>
                                <label className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 hover:border-primary flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
                                    {profilePreview ? (
                                        <img src={profilePreview} className="w-full h-full object-cover" alt="profile" />
                                    ) : (
                                        <ImagePlus size={20} className="text-gray-400" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) {
                                                setProfilePhoto(f);
                                                setProfilePreview(URL.createObjectURL(f));
                                            }
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500 block mb-1">Banner Image</label>
                                <label className="w-full h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
                                    {bannerPreview ? (
                                        <img src={bannerPreview} className="w-full h-full object-cover" alt="banner" />
                                    ) : (
                                        <ImagePlus size={20} className="text-gray-400" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) {
                                                setBannerPhoto(f);
                                                setBannerPreview(URL.createObjectURL(f));
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h2 className="font-bold text-gray-700">Basic Info</h2>

                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Community Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Sci-Fi Lovers"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="What is this community about?"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-2">Privacy</label>
                            <div className="flex gap-3">
                                {(["public", "private"] as const).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPrivacy(p)}
                                        className={`px-5 py-2 rounded-xl text-sm font-bold capitalize border-2 transition-all ${
                                            privacy === p
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-gray-200 text-gray-500"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="font-bold text-gray-700 mb-3">Category Tags</h2>

                        <div className="flex gap-2 flex-wrap mb-3">
                            {tags.map((t) => (
                                <span
                                    key={t}
                                    className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full"
                                >
                                    {t}
                                    <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))}>
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                                placeholder="Add a tag..."
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm transition-all"
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-opacity-90"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold text-gray-700">Community Rules</h2>
                            <button
                                type="button"
                                onClick={() => setRules((prev) => [...prev, ""])}
                                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                            >
                                <Plus size={12} /> Add Rule
                            </button>
                        </div>

                        <div className="space-y-2">
                            {rules.map((rule, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-sm text-gray-400 font-bold mt-3 flex-shrink-0">{i + 1}.</span>
                                    <input
                                        type="text"
                                        value={rule}
                                        onChange={(e) =>
                                            setRules((prev) => prev.map((r, j) => (j === i ? e.target.value : r)))
                                        }
                                        placeholder="Describe this rule..."
                                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm transition-all"
                                    />
                                    {rules.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setRules((prev) => prev.filter((_, j) => j !== i))}
                                            className="text-gray-300 hover:text-red-400"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-opacity-90 disabled:opacity-60 transition-all text-lg"
                    >
                        {isSubmitting ? "Creating..." : "Create Community"}
                    </button>
                </form>
            </main>
        </div>
    );
}