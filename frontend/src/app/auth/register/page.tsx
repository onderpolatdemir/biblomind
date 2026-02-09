"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
    const router = useRouter();
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data: any) => {
        setSubmitStatus('idle');
        try {
            // API call to register
            await api.post('/auth/register', {
                email: data.email,
                password: data.password,
                full_name: data.fullName
            });

            setSubmitStatus('success');

            // Navigate to login after 1 second
            setTimeout(() => {
                router.replace('/auth/login');
            }, 1500);

        } catch (error: any) {
            setSubmitStatus('error');
            setErrorMessage(error.response?.data?.detail || "Registration failed. Please try again.");
        }
    };

    const password = watch("password");

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 rounded-l-[10rem] -z-10 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full -z-10 -translate-x-1/3 translate-y-1/3 blur-3xl" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 relative z-10"
            >
                <div className="flex flex-col items-center mb-6">
                    <Link href="/" replace className="relative w-40 h-14 md:w-40 md:h-20 mb-2">
                        <Image src="/biblomind-logoo.png" alt="Logo" fill className="object-contain" />
                    </Link>
                    <h2 className="text-3xl font-bold text-text mb-2">Create Account</h2>
                    <p className="text-gray-500 text-center">Join us to discover your next favorite book.</p>
                </div>

                {/* Feedback Messages */}
                <AnimatePresence mode="wait">
                    {submitStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg text-center font-medium shadow-sm"
                        >
                            🎉 Success! Redirecting to login...
                        </motion.div>
                    )}

                    {submitStatus === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg text-center font-medium shadow-sm"
                        >
                            ⚠️ {errorMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Full Name</label>
                        <input
                            {...register("fullName", { required: true })}
                            type="text"
                            disabled={isSubmitting}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                            placeholder="John Doe"
                        />
                        {errors.fullName && <span className="text-red-500 text-sm mt-1">Full name is required</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Email</label>
                        <input
                            {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
                            type="email"
                            disabled={isSubmitting}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                            placeholder="hello@example.com"
                        />
                        {errors.email && <span className="text-red-500 text-sm mt-1">Valid email is required</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Password</label>
                        <input
                            {...register("password", { required: true, minLength: 8 })}
                            type="password"
                            disabled={isSubmitting}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                            placeholder="••••••••"
                        />
                        {errors.password && <span className="text-red-500 text-sm mt-1">Password must be at least 8 chars</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Confirm Password</label>
                        <input
                            {...register("confirmPassword", {
                                required: true,
                                validate: (value) => value === password || "Passwords do not match",
                            })}
                            type="password"
                            disabled={isSubmitting}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <span className="text-red-500 text-sm mt-1">{errors.confirmPassword.message as string}</span>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-primary text-text font-bold rounded-lg shadow-md hover:shadow-lg transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                    </motion.button>
                </form>

                <p className="mt-6 text-center text-gray-600 text-sm">
                    Already have an account?{" "}
                    <Link href="/auth/login" replace className="text-accent font-semibold hover:underline">
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
