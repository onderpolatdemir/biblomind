"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import { Plus, X, ImagePlus, Shield, Check, XCircle, ChevronDown } from "lucide-react";
import api from "@/lib/api";

const BACKEND_URL = "http://localhost:8000";

interface Member {
    user_id: string;
    full_name: string;
    username: string | null;
    avatar_url: string | null;
    role: string;
    joined_at: string;
}

interface JoinRequest {
    id: string;
    user_id: string;
    full_name: string;
    username: string | null;
    avatar_url: string | null;
    status: string;
    created_at: string;
}

export default function CreateCommunityPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const isEditMode = !!editId;

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
    const [loadingEdit, setLoadingEdit] = useState(false);

    // RBAC state
    const [members, setMembers] = useState<Member[]>([]);
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [membersLoaded, setMembersLoaded] = useState(false);

    // Fetch community data for edit mode
    const fetchCommunity = useCallback(async () => {
        if (!editId) return;
        setLoadingEdit(true);
        try {
            const res = await api.get(`/communities/${editId}`);
            const c = res.data;
            setName(c.name || "");
            setDescription(c.description || "");
            setPrivacy(c.privacy || "public");
            setTags(c.category_tags || []);
            setRules(c.rules?.length > 0 ? c.rules : [""]);
            if (c.profile_photo_url) {
                setProfilePreview(
                    c.profile_photo_url.startsWith("http") ? c.profile_photo_url : `${BACKEND_URL}${c.profile_photo_url}`
                );
            }
            if (c.banner_photo_url) {
                setBannerPreview(
                    c.banner_photo_url.startsWith("http") ? c.banner_photo_url : `${BACKEND_URL}${c.banner_photo_url}`
                );
            }
        } catch {
            setError("Failed to load community data.");
        } finally {
            setLoadingEdit(false);
        }
    }, [editId]);

    // Fetch members for RBAC management
    const fetchMembers = useCallback(async () => {
        if (!editId || membersLoaded) return;
        try {
            const res = await api.get(`/communities/${editId}/members?limit=100`);
            setMembers(res.data.members ?? []);
            setMembersLoaded(true);
        } catch {}
    }, [editId, membersLoaded]);

    // Fetch join requests (for private communities)
    const fetchJoinRequests = useCallback(async () => {
        if (!editId) return;
        try {
            const res = await api.get(`/notifications/`);
            const joinNotifs = (res.data || []).filter(
                (n: any) => n.type === "community_join_request" && n.entity_id
            );
            setJoinRequests(
                joinNotifs.map((n: any) => ({
                    id: n.entity_id,
                    user_id: "",
                    full_name: n.actor_name || "Unknown",
                    username: n.actor_username || null,
                    avatar_url: n.actor_avatar || null,
                    status: "pending",
                    created_at: n.created_at,
                }))
            );
        } catch {}
    }, [editId]);

    useEffect(() => {
        if (isEditMode) {
            fetchCommunity();
            fetchMembers();
            fetchJoinRequests();
        }
    }, [isEditMode, fetchCommunity, fetchMembers, fetchJoinRequests]);

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

            if (isEditMode) {
                await api.put(`/communities/${editId}`, form, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                router.push(`/social/communities/${editId}`);
            } else {
                const res = await api.post("/communities/", form, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                router.push(`/social/communities/${res.data.id}`);
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail || `Failed to ${isEditMode ? "update" : "create"} community.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        if (!editId) return;
        try {
            await api.put(`/communities/${editId}/members/${userId}/role`, { role: newRole });
            setMembers((prev) =>
                prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
            );
        } catch {}
    };

    const approveRequest = async (requestId: string) => {
        try {
            await api.post(`/communities/join-requests/${requestId}/approve`);
            setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
            // Refresh members
            setMembersLoaded(false);
            fetchMembers();
        } catch {}
    };

    const rejectRequest = async (requestId: string) => {
        try {
            await api.post(`/communities/join-requests/${requestId}/reject`);
            setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
        } catch {}
    };

    if (loadingEdit) {
        return (
            <div className="min-h-screen bg-gray-50/50 font-body">
                <Header />
                <div className="flex justify-center py-32">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 font-body">
            <Header />
            <main className="max-w-2xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">
                    {isEditMode ? "Edit Community" : "Create Community"}
                </h1>

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

                    {/* ─── RBAC: Manage Members (edit mode only) ─── */}
                    {isEditMode && members.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Shield size={16} className="text-primary" /> Manage Members
                            </h2>
                            <div className="space-y-3">
                                {members.map((m) => {
                                    const avatarSrc = m.avatar_url
                                        ? m.avatar_url.startsWith("http")
                                            ? m.avatar_url
                                            : `${BACKEND_URL}${m.avatar_url}`
                                        : null;
                                    const isCreator = m.role === "creator";

                                    return (
                                        <div
                                            key={m.user_id}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden flex items-center justify-center font-bold text-text text-sm flex-shrink-0">
                                                {avatarSrc ? (
                                                    <img src={avatarSrc} alt={m.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    m.full_name?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-800 truncate">{m.full_name}</p>
                                                {m.username && (
                                                    <p className="text-xs text-primary">@{m.username}</p>
                                                )}
                                            </div>
                                            {isCreator ? (
                                                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                                                    Creator
                                                </span>
                                            ) : (
                                                <div className="relative">
                                                    <select
                                                        value={m.role}
                                                        onChange={(e) => updateRole(m.user_id, e.target.value)}
                                                        className="appearance-none text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-7 font-bold text-gray-700 cursor-pointer hover:border-primary transition-colors outline-none"
                                                    >
                                                        <option value="member">Member</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ─── Pending Join Requests (edit mode + private communities) ─── */}
                    {isEditMode && joinRequests.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="font-bold text-gray-700 mb-4">
                                Pending Join Requests ({joinRequests.length})
                            </h2>
                            <div className="space-y-3">
                                {joinRequests.map((req) => {
                                    const avatarSrc = req.avatar_url
                                        ? req.avatar_url.startsWith("http")
                                            ? req.avatar_url
                                            : `${BACKEND_URL}${req.avatar_url}`
                                        : null;

                                    return (
                                        <div
                                            key={req.id}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden flex items-center justify-center font-bold text-text text-sm flex-shrink-0">
                                                {avatarSrc ? (
                                                    <img src={avatarSrc} alt={req.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    req.full_name?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-800 truncate">{req.full_name}</p>
                                                {req.username && (
                                                    <p className="text-xs text-primary">@{req.username}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => approveRequest(req.id)}
                                                    className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                    title="Approve"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => rejectRequest(req.id)}
                                                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                    title="Reject"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-opacity-90 disabled:opacity-60 transition-all text-lg"
                    >
                        {isSubmitting
                            ? isEditMode
                                ? "Saving..."
                                : "Creating..."
                            : isEditMode
                              ? "Save Changes"
                              : "Create Community"}
                    </button>
                </form>
            </main>
        </div>
    );
}