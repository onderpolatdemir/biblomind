"use client";

import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Link from "next/link";
import {
    Brain, Camera, MessageCircle, Users, ShoppingCart,
    Star, Zap, Shield, BookOpen, Search, Sparkles, ArrowRight,
    Github, Database, Server, Layers
} from "lucide-react";

const FEATURES = [
    {
        icon: Brain,
        title: "AI-Powered Recommendations",
        description:
            "Our hybrid recommendation engine learns from every book you view, like, or purchase. Using OpenAI embeddings and cosine similarity, it builds a personal taste profile unique to you.",
        color: "bg-violet-100 text-violet-600",
    },
    {
        icon: Camera,
        title: "Bookshelf Scanner",
        description:
            "Take a photo of any bookshelf — at a friend's place, a library, or a store — and our Google Cloud Vision AI instantly detects the books and recommends similar titles from our catalog.",
        color: "bg-amber-100 text-amber-600",
    },
    {
        icon: MessageCircle,
        title: "Book Buddy Chatbot",
        description:
            "Chat with our AI assistant powered by GPT-4o. Ask for reading suggestions, get book summaries, or explore genres. It keeps track of your entire conversation history.",
        color: "bg-sky-100 text-sky-600",
    },
    {
        icon: Users,
        title: "Social Book Matching",
        description:
            "Discover readers who share your taste. Our compatibility engine compares reading preferences across users and connects you with your perfect Book Buddy.",
        color: "bg-rose-100 text-rose-600",
    },
    {
        icon: Search,
        title: "Semantic Search",
        description:
            "Powered by Elasticsearch with fuzzy matching, you can search by mood, theme, or vague descriptions — not just exact titles. Find what you're looking for even with typos.",
        color: "bg-emerald-100 text-emerald-600",
    },
    {
        icon: ShoppingCart,
        title: "Full E-Commerce",
        description:
            "Browse, add to cart, save favorites, manage addresses, and complete checkout with real payment integration. Track your orders end-to-end from the orders page.",
        color: "bg-orange-100 text-orange-600",
    },
];

const TECH_STACK = [
    { icon: Server, label: "FastAPI", sublabel: "Python backend" },
    { icon: Database, label: "PostgreSQL + pgvector", sublabel: "Relational DB + vector search" },
    { icon: Zap, label: "Elasticsearch", sublabel: "Full-text & fuzzy search" },
    { icon: Layers, label: "Next.js 14", sublabel: "React app router" },
    { icon: Brain, label: "OpenAI GPT-4o", sublabel: "Chat & embeddings" },
    { icon: Camera, label: "Google Cloud Vision", sublabel: "Book detection from photos" },
    { icon: Shield, label: "Redis", sublabel: "Session caching" },
    { icon: Sparkles, label: "Framer Motion", sublabel: "Animations" },
];

const HOW_IT_WORKS = [
    {
        step: "01",
        title: "Create Your Account",
        description: "Sign up in seconds and start exploring 1,000+ books across 20+ genres.",
    },
    {
        step: "02",
        title: "Interact With Books",
        description:
            "View, like, add to cart, or purchase books. Each action trains your personal preference model.",
    },
    {
        step: "03",
        title: "Get Smarter Recommendations",
        description:
            "The more you interact, the better your recommendations become. Your taste vector updates in real time.",
    },
    {
        step: "04",
        title: "Connect & Discover",
        description:
            "Find your Book Buddies, chat with the AI assistant, or scan a shelf to discover your next read.",
    },
];

const TEAM = [
    {
        name: "Kaan Yılmaz",
        role: "AI & Backend Engineer",
        description:
            "Built the entire backend infrastructure — FastAPI, PostgreSQL, pgvector, Elasticsearch, Redis, OpenAI, Vision API, recommendation engine, and social features.",
        initials: "KY",
        color: "bg-violet-100 text-violet-700",
    },
    {
        name: "Barış",
        role: "Frontend Engineer",
        description:
            "Crafted the user interface with Next.js, React, and Tailwind CSS — ensuring a smooth and modern experience across all devices.",
        initials: "B",
        color: "bg-sky-100 text-sky-700",
    },
    {
        name: "Önder",
        role: "E-Commerce Backend",
        description:
            "Developed the e-commerce backend: cart, orders, payment processing, address management, and admin dashboard APIs.",
        initials: "Ö",
        color: "bg-emerald-100 text-emerald-700",
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
    }),
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#f5f0e8] via-white to-[#eef7f0] py-24 px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-6"
                    >
                        <BookOpen size={16} />
                        Graduation Project · 2024–2025
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="font-heading text-5xl md:text-6xl font-bold text-text mb-6 leading-tight"
                    >
                        The Smartest Way to
                        <br />
                        <span className="text-primary">Discover Books</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        BibloMind is an AI-powered bookstore that learns your reading taste, scans physical shelves
                        with your camera, chats about books, and connects you with readers who love what you love.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="flex flex-wrap justify-center gap-4"
                    >
                        <Link
                            href="/home"
                            className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            Start Exploring <ArrowRight size={16} />
                        </Link>
                        <Link
                            href="/auth/register"
                            className="flex items-center gap-2 bg-white border border-gray-200 text-text font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            Create Account
                        </Link>
                    </motion.div>
                </div>

                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-100/50 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />
            </section>

            {/* Stats bar */}
            <section className="border-y border-gray-100 bg-white py-8">
                <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { value: "1,000+", label: "Books" },
                        { value: "20+", label: "Genres" },
                        { value: "4", label: "AI Services" },
                        { value: "40+", label: "API Endpoints" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                        >
                            <div className="font-heading text-3xl font-bold text-text">{stat.value}</div>
                            <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-8 max-w-7xl mx-auto">
                <div className="text-center mb-14">
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                        className="font-heading text-4xl font-bold text-text mb-4"
                    >
                        Everything You Need
                    </motion.h2>
                    <motion.p
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={1}
                        className="text-gray-400 max-w-xl mx-auto"
                    >
                        Six intelligent features working together to give you the best possible book discovery experience.
                    </motion.p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={f.title}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                                <f.icon size={22} />
                            </div>
                            <h3 className="font-heading font-bold text-lg text-text mb-2">{f.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-8 bg-[#f9f7f3]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <motion.h2
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            custom={0}
                            className="font-heading text-4xl font-bold text-text mb-4"
                        >
                            How It Works
                        </motion.h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {HOW_IT_WORKS.map((step, i) => (
                            <motion.div
                                key={step.step}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="text-center"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-heading font-bold text-xl flex items-center justify-center mx-auto mb-4">
                                    {step.step}
                                </div>
                                <h3 className="font-heading font-bold text-text mb-2">{step.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="py-20 px-8 max-w-5xl mx-auto">
                <div className="text-center mb-14">
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                        className="font-heading text-4xl font-bold text-text mb-4"
                    >
                        Built With
                    </motion.h2>
                    <motion.p
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={1}
                        className="text-gray-400 max-w-xl mx-auto"
                    >
                        A modern full-stack architecture combining the best tools for AI, search, and e-commerce.
                    </motion.p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {TECH_STACK.map((tech, i) => (
                        <motion.div
                            key={tech.label}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="flex flex-col items-center text-center p-5 border border-gray-100 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-all"
                        >
                            <tech.icon size={26} className="text-primary mb-3" />
                            <div className="font-semibold text-text text-sm">{tech.label}</div>
                            <div className="text-gray-400 text-xs mt-1">{tech.sublabel}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Team */}
            <section className="py-20 px-8 bg-[#f9f7f3]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-14">
                        <motion.h2
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            custom={0}
                            className="font-heading text-4xl font-bold text-text mb-4"
                        >
                            The Team
                        </motion.h2>
                        <motion.p
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            custom={1}
                            className="text-gray-400 max-w-xl mx-auto"
                        >
                            A three-person graduation project team combining AI, backend, and frontend expertise.
                        </motion.p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TEAM.map((member, i) => (
                            <motion.div
                                key={member.name}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-md transition-all"
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 font-heading font-bold text-xl ${member.color}`}>
                                    {member.initials}
                                </div>
                                <h3 className="font-heading font-bold text-text text-lg">{member.name}</h3>
                                <p className="text-primary text-sm font-semibold mb-3">{member.role}</p>
                                <p className="text-gray-400 text-sm leading-relaxed">{member.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-8 text-center">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={0}
                    className="max-w-2xl mx-auto"
                >
                    <h2 className="font-heading text-4xl font-bold text-text mb-4">
                        Ready to Find Your Next Favourite?
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Join BibloMind and let AI do the heavy lifting of finding your perfect read.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/auth/register"
                            className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            Get Started Free <ArrowRight size={16} />
                        </Link>
                        <Link
                            href="/categories/fiction"
                            className="flex items-center gap-2 bg-white border border-gray-200 text-text font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            Browse Books
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-8 px-8 text-center text-gray-400 text-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <BookOpen size={16} className="text-primary" />
                    <span className="font-heading font-bold text-text">biblomind</span>
                </div>
                <p>© 2025 BibloMind · Graduation Project · All rights reserved</p>
            </footer>
        </div>
    );
}
