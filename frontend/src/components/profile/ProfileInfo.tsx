"use client";

import { useState, useRef } from "react";
import { User } from "@/types/user";
import api from "@/lib/api";
import { Save, User as UserIcon, Camera, BookOpen } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

interface ProfileInfoProps {
    user: User;
    onUpdate: (updatedUser: User) => void;
}

export default function ProfileInfo({ user, onUpdate }: ProfileInfoProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(user.full_name || "");
    const [username, setUsername] = useState(user.username || "");
    const [bio, setBio] = useState(user.bio || "");
    const [readingGoal, setReadingGoal] = useState(user.reading_goal?.toString() || "");
    const [isSaving, setIsSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await api.post("/users/me/avatar", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const newUrl = res.data.avatar_url;
            setAvatarUrl(newUrl);
            onUpdate({ ...user, avatar_url: newUrl });
        } catch {
            alert("Failed to upload avatar");
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.put("/users/me/profile", {
                full_name: fullName || undefined,
                username: username || undefined,
                bio: bio || undefined,
                reading_goal: readingGoal ? parseInt(readingGoal) : undefined,
            });
            onUpdate({ ...user, ...res.data });
            setIsEditing(false);
        } catch (error: any) {
            const detail = error?.response?.data?.detail;
            const msg = typeof detail === "string"
                ? detail
                : Array.isArray(detail)
                    ? detail.map((e: any) => e.msg).join(", ")
                    : "Failed to update profile";
            alert(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const avatarSrc = avatarUrl
        ? (avatarUrl.startsWith("http") ? avatarUrl : `${BACKEND_URL}${avatarUrl}`)
        : null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <UserIcon className="text-primary" />
                Personal Information
            </h2>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary border-4 border-white shadow-md flex items-center justify-center">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold text-text">
                                {user.full_name?.charAt(0).toUpperCase() || "U"}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-opacity-90 transition-all"
                    >
                        {avatarUploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Camera size={14} />
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                </div>
                <div>
                    <p className="font-bold text-gray-800">{user.full_name}</p>
                    {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
                    <p className="text-xs text-gray-400 mt-1">Click the camera icon to change your photo</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5 max-w-lg">
                {/* Email */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 border border-gray-100 font-medium cursor-not-allowed flex items-center gap-2">
                        {user.email}
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">Verified</span>
                    </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    ) : (
                        <div className="p-3 bg-white rounded-lg text-gray-800 border border-gray-200 font-medium">
                            {user.full_name || "Not set"}
                        </div>
                    )}
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</label>
                    {isEditing ? (
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400 font-medium">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="your_username"
                                pattern="[a-zA-Z0-9_]+"
                                className="w-full pl-8 pr-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    ) : (
                        <div className="p-3 bg-white rounded-lg text-gray-800 border border-gray-200 font-medium">
                            {user.username ? `@${user.username}` : "Not set"}
                        </div>
                    )}
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bio</label>
                    {isEditing ? (
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            maxLength={300}
                            placeholder="Tell others about your reading life..."
                            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        />
                    ) : (
                        <div className="p-3 bg-white rounded-lg text-gray-700 border border-gray-200 min-h-[3rem]">
                            {user.bio || <span className="text-gray-400">Not set</span>}
                        </div>
                    )}
                </div>

                {/* Reading Goal */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen size={12} /> Annual Reading Goal (books)
                    </label>
                    {isEditing ? (
                        <input
                            type="number"
                            value={readingGoal}
                            onChange={(e) => setReadingGoal(e.target.value)}
                            min={0}
                            max={365}
                            placeholder="e.g. 24"
                            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    ) : (
                        <div className="p-3 bg-white rounded-lg text-gray-800 border border-gray-200 font-medium">
                            {user.reading_goal ? `${user.reading_goal} books/year` : "Not set"}
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    {isEditing ? (
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
                            >
                                <Save size={18} />
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFullName(user.full_name || "");
                                    setUsername(user.username || "");
                                    setBio(user.bio || "");
                                    setReadingGoal(user.reading_goal?.toString() || "");
                                }}
                                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="px-6 py-2.5 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-all"
                        >
                            Update Information
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
