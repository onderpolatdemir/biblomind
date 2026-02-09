"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function LoginPage() {
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState('');
    const { login } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data: any) => {
        setErrorMessage('');

        const formData = new URLSearchParams();
        formData.append('username', data.username);
        formData.append('password', data.password);

        try {
            const response = await api.post('/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            // Use context login to update state and redirect
            const { access_token, user } = response.data;
            login(access_token, user);

        } catch (error: any) {
            if (error.response?.status === 401) {
                setErrorMessage("Invalid email or password");
            } else {
                setErrorMessage(error.response?.data?.detail || "Something went wrong. Please try again.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-1/2 h-full bg-secondary/20 rounded-r-[10rem] -z-10 -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full -z-10 translate-x-1/3 translate-y-1/3 blur-3xl" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 z-10"
            >
                <div className="flex flex-col items-center mb-6">
                    <Link href="/" replace className="relative w-40 h-14 md:w-40 md:h-20 mb-2">
                        <Image src="/biblomind-logoo.png" alt="Logo" fill className="object-contain" />
                    </Link>
                    <h2 className="text-3xl font-bold text-text mb-2">Welcome Back</h2>
                    <p className="text-gray-500 text-center">Sign in to continue your reading journey.</p>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg text-center font-medium shadow-sm overflow-hidden"
                        >
                            ⚠️ {errorMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Email or Username</label>
                        <input
                            {...register("username", { required: true })}
                            type="text"
                            disabled={isSubmitting}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all disabled:opacity-50"
                            placeholder="hello@example.com"
                        />
                        {errors.username && <span className="text-red-500 text-sm mt-1">Username is required</span>}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-text">Password</label>
                            <Link href="#" className="text-xs text-accent hover:underline">Forgot password?</Link>
                        </div>
                        <input
                            {...register("password", { required: true })}
                            type="password"
                            disabled={isSubmitting}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all disabled:opacity-50"
                            placeholder="••••••••"
                        />
                        {errors.password && <span className="text-red-500 text-sm mt-1">Password is required</span>}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-secondary text-text font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </motion.button>
                </form>

                <p className="mt-8 text-center text-gray-600 text-sm">
                    Don't have an account?{" "}
                    <Link href="/auth/register" replace className="text-accent font-semibold hover:underline">
                        Register
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
