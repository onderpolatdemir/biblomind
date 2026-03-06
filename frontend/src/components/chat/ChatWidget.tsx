"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Trash2, BookOpen, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    book_references?: BookRef[];
    created_at?: string;
}

interface BookRef {
    book_id: string;
    title: string;
    author: string;
    relevance_score?: number;
}

interface Conversation {
    id: string;
    title: string;
    created_at: string;
}

export default function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping]);

    useEffect(() => {
        if (isOpen && user) {
            fetchConversations();
        }
    }, [isOpen, user]);

    const fetchConversations = async () => {
        try {
            const res = await api.get("/chat/conversations");
            setConversations(res.data.conversations ?? res.data ?? []);
        } catch {
            // silent
        }
    };

    const loadConversation = async (convId: string) => {
        try {
            const res = await api.get(`/chat/conversations/${convId}`);
            const msgs: Message[] = (res.data.messages ?? []).map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                book_references: m.book_references,
                created_at: m.created_at,
            }));
            setMessages(msgs);
            setConversationId(convId);
            setShowHistory(false);
        } catch {
            // silent
        }
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const res = await api.post("/chat/message", {
                message: text,
                conversation_id: conversationId ?? null,
            });
            const data = res.data;
            if (!conversationId) {
                setConversationId(data.conversation_id);
                fetchConversations();
            }
            const botMsg: Message = {
                id: data.id ?? Date.now().toString() + "_bot",
                role: "assistant",
                content: data.content ?? data.response ?? "",
                book_references: data.book_references,
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString() + "_err",
                    role: "assistant",
                    content: "Sorry, something went wrong. Please try again.",
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const startNewChat = () => {
        setMessages([]);
        setConversationId(null);
        setShowHistory(false);
    };

    const deleteConversation = async (convId: string) => {
        try {
            await api.delete(`/chat/conversations/${convId}`);
            setConversations((prev) => prev.filter((c) => c.id !== convId));
            if (conversationId === convId) startNewChat();
        } catch {
            // silent
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!user) return null;

    return (
        <>
            {/* Floating button */}
            <motion.button
                onClick={() => setIsOpen((v) => !v)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-text text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Open chat"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <X size={22} />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <MessageCircle size={22} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed bottom-24 right-6 z-50 w-[360px] md:w-[400px] bg-white rounded-3xl shadow-2xl border border-secondary flex flex-col overflow-hidden"
                        style={{ maxHeight: "70vh" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-text text-white rounded-t-3xl flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <BookOpen size={18} />
                                <span className="font-heading font-bold text-base">Book Buddy</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowHistory((v) => !v)}
                                    className="text-white/70 hover:text-white transition-colors text-xs underline"
                                >
                                    History
                                </button>
                                <button
                                    onClick={startNewChat}
                                    className="text-white/70 hover:text-white transition-colors text-xs underline"
                                >
                                    New
                                </button>
                            </div>
                        </div>

                        {/* Conversation History Drawer */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-secondary/30 border-b border-secondary overflow-hidden flex-shrink-0"
                                >
                                    <div className="p-3 max-h-40 overflow-y-auto space-y-1">
                                        {conversations.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-2">No previous conversations</p>
                                        ) : (
                                            conversations.map((conv) => (
                                                <div key={conv.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 hover:bg-primary/10 transition-colors">
                                                    <button
                                                        onClick={() => loadConversation(conv.id)}
                                                        className="flex-1 text-left text-xs text-gray-700 font-medium truncate"
                                                    >
                                                        {conv.title || "Conversation"}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteConversation(conv.id)}
                                                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <BookOpen size={22} className="text-accent" />
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">Hi! I'm your Book Buddy.</p>
                                    <p className="text-xs text-gray-400 mt-1">Ask me to recommend a book, or tell me what you've enjoyed reading.</p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                            msg.role === "user"
                                                ? "bg-text text-white rounded-tr-sm"
                                                : "bg-secondary/50 text-gray-800 rounded-tl-sm"
                                        }`}
                                    >
                                        <p>{msg.content}</p>
                                        {msg.book_references && msg.book_references.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {msg.book_references.map((b) => (
                                                    <div key={b.book_id} className="flex items-center gap-1.5 text-xs bg-white/20 rounded-lg px-2 py-1">
                                                        <BookOpen size={11} />
                                                        <span className="font-medium truncate">{b.title}</span>
                                                        <span className="opacity-70">— {b.author}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-4 py-3">
                                        <div className="flex gap-1 items-center">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="flex-shrink-0 px-4 py-3 border-t border-secondary bg-white/80">
                            <div className="flex items-end gap-2 bg-secondary/30 rounded-2xl px-3 py-2">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about a book..."
                                    rows={1}
                                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none max-h-24 leading-relaxed"
                                    style={{ minHeight: "24px" }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || isTyping}
                                    className="w-8 h-8 bg-text text-white rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-accent transition-colors flex-shrink-0"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
