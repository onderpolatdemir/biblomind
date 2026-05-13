"use client";

import { useEffect, useState } from "react";
import { X, Plus, MapPin, Check } from "lucide-react";
import { Address, AddressCreate } from "@/types/address";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (address: Address) => void;
}

export default function AddressModal({ isOpen, onClose, onSelect }: AddressModalProps) {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<"list" | "add">("list");

    // Form State
    const [newAddress, setNewAddress] = useState<AddressCreate>({
        name: "",
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Turkey"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch addresses when modal opens
    useEffect(() => {
        if (isOpen && user) {
            fetchAddresses();
        }
    }, [isOpen, user]);

    const fetchAddresses = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/address/");
            setAddresses(res.data);
            if (res.data.length === 0) {
                setView("add"); // Auto-switch to add if no addresses
            }
        } catch (error) {
            console.error("Failed to fetch addresses", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post("/address/", newAddress);

            // With axios (api instance), a successful response is usually in the 2xx range and throws on error by default
            const createdAddress = res.data;
            setAddresses([...addresses, createdAddress]);
            setView("list");
            // Reset form
            setNewAddress({
                name: "",
                street: "",
                city: "",
                state: "",
                postal_code: "",
                country: "Turkey"
            });
        } catch (error) {
            console.error("Error adding address:", error);
            alert("Error adding address");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">
                        {view === "list" ? "Select Delivery Address" : "Add New Address"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : view === "list" ? (
                        <div className="space-y-4">
                            {addresses.map((addr) => (
                                <div
                                    key={addr.id}
                                    onClick={() => onSelect(addr)}
                                    className="border border-gray-200 rounded-xl p-4 hover:border-primary hover:bg-blue-50/30 cursor-pointer transition-all group relative"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 p-2 bg-gray-100 rounded-full text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{addr.name}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {addr.street}, {addr.city}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {addr.postal_code}, {addr.state}, {addr.country}
                                            </p>
                                        </div>
                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-primary text-white p-1 rounded-full">
                                                <Check size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setView("add")}
                                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                Add New Address
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleAddAddress} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Name (e.g. Home, Office)</label>
                                <input
                                    type="text"
                                    required
                                    value={newAddress.name}
                                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Home"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                <textarea
                                    required
                                    value={newAddress.street}
                                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="123 Main St, Apt 4B"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAddress.city}
                                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="New York"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAddress.state}
                                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="NY"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAddress.postal_code}
                                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="10001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAddress.country}
                                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Turkey"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setView("list")}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-70"
                                >
                                    {isSubmitting ? "Saving..." : "Save Address"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
