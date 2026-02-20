"use client";

import { useState } from "react";
import { User } from "@/types/user";
import api from "@/lib/api";
import { Save, User as UserIcon } from "lucide-react";

interface ProfileInfoProps {
    user: User;
    onUpdate: (updatedUser: User) => void;
}

export default function ProfileInfo({ user, onUpdate }: ProfileInfoProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(user.full_name || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.put("/users/me/profile", {
                full_name: fullName
            });
            // Update successful
            onUpdate({ ...user, full_name: res.data.full_name });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <UserIcon className="text-primary" />
                Personal Information
            </h2>

            <form onSubmit={handleSave} className="space-y-6 max-w-lg">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 border border-gray-100 font-medium cursor-not-allowed flex items-center gap-2">
                        {user.email}
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">Verified</span>
                    </div>
                    <p className="text-xs text-gray-400">Email cannot be changed directly for security reasons.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
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

                <div className="pt-4">
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
