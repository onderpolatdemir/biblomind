"use client";

import { useState, useEffect } from "react";
import { Address, AddressCreate } from "@/types/address";
import api from "@/lib/api";
import { Plus, Trash2, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddressManager() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newAddress, setNewAddress] = useState<AddressCreate>({
        name: "",
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Turkey"
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await api.get("/address/");
            setAddresses(res.data);
        } catch (error) {
            console.error("Failed to fetch addresses", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            await api.delete(`/address/${id}`);
            setAddresses(addresses.filter(addr => addr.id !== id));
        } catch (error: any) {
            console.error("Failed to delete address", error);
            alert(`Failed to delete address: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Remove trailing slash to ensure compatibility
            const res = await api.post("/address", newAddress);
            setAddresses([...addresses, res.data]);
            setIsAdding(false);
            setNewAddress({
                name: "",
                street: "",
                city: "",
                state: "",
                postal_code: "",
                country: "Turkey"
            });
        } catch (error: any) {
            console.error("Failed to add address", error);
            // Show specific error from backend if available
            alert(`Failed to add address: ${error.response?.data?.detail || error.message}`);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="text-primary" />
                    My Addresses
                </h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-opacity-90 transition-all"
                >
                    <Plus size={16} />
                    Add New
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <form onSubmit={handleAdd} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h3 className="text-lg font-bold mb-4 text-gray-700">New Address Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    placeholder="Address Title (e.g. Home)"
                                    value={newAddress.name}
                                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                    className="p-3 rounded-lg border border-gray-300 w-full"
                                    required
                                />
                                <input
                                    placeholder="Street Address"
                                    value={newAddress.street}
                                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                    className="p-3 rounded-lg border border-gray-300 w-full"
                                    required
                                />
                                <input
                                    placeholder="City"
                                    value={newAddress.city}
                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                    className="p-3 rounded-lg border border-gray-300 w-full"
                                    required
                                />
                                <input
                                    placeholder="State / Province"
                                    value={newAddress.state}
                                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                    className="p-3 rounded-lg border border-gray-300 w-full"
                                    required
                                />
                                <input
                                    placeholder="Postal Code"
                                    value={newAddress.postal_code}
                                    onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                                    className="p-3 rounded-lg border border-gray-300 w-full"
                                    required
                                />
                                <input
                                    placeholder="Country"
                                    value={newAddress.country}
                                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                                    className="p-3 rounded-lg border border-gray-300 w-full"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all"
                                >
                                    Save Address
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : addresses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                    <MapPin className="mx-auto w-12 h-12 text-gray-300 mb-2" />
                    <p>No addresses saved yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <div key={addr.id} className="relative p-5 border border-gray-200 rounded-xl hover:border-primary/50 hover:shadow-md transition-all group bg-white">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg text-gray-800">{addr.name}</span>
                                <button
                                    onClick={() => handleDelete(addr.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Delete Address"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="text-gray-600 text-sm space-y-1">
                                <p>{addr.street}</p>
                                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                                <p>{addr.country}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
