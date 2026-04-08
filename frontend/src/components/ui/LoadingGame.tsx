"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingGame() {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(20);
    const [targetPosition, setTargetPosition] = useState({ top: "50%", left: "50%" });
    const [caughtAnimation, setCaughtAnimation] = useState(false);

    // Slower movement (1500ms instead of 800ms)
    useEffect(() => {
        const moveInterval = setInterval(() => {
            const top = Math.floor(Math.random() * 70) + 15 + "%";
            const left = Math.floor(Math.random() * 70) + 15 + "%";
            setTargetPosition({ top, left });
        }, 1500);

        return () => clearInterval(moveInterval);
    }, []);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleCatch = () => {
        setScore((prev) => prev + 1);
        setCaughtAnimation(true);
        setTimeout(() => setCaughtAnimation(false), 300);

        // Move immediately upon catching
        const top = Math.floor(Math.random() * 70) + 15 + "%";
        const left = Math.floor(Math.random() * 70) + 15 + "%";
        setTargetPosition({ top, left });
    };

    return (
        <div className="w-full h-full min-h-[400px] bg-secondary/10 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center border-4 border-dashed border-secondary/50">
            <div className="absolute top-4 w-full px-8 flex justify-between items-center z-20">
                <div className="text-xl font-bold text-text bg-white/80 px-4 py-2 rounded-full shadow-sm">
                    Score: {score}
                </div>
                <div className="text-xl font-bold text-text bg-white/80 px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                    {timeLeft > 0 ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            {timeLeft}s
                        </>
                    ) : "Analyzing..."}
                </div>
            </div>

            <div className="text-center z-10 pointer-events-none mb-12">
                <h3 className="text-2xl md:text-3xl font-heading font-bold text-text mb-2">
                    {timeLeft > 0 ? "Catch the floating books while we analyze!" : "Almost there, matching your profile..."}
                </h3>
                <p className="text-gray-600">The AI vision model takes up to 30 seconds to read every spine.</p>
            </div>

            {/* The Game Area */}
            {timeLeft > 0 && (
                <div className="absolute inset-0 top-24 bottom-4 left-4 right-4 z-30 cursor-crosshair">
                    <motion.div
                        className="absolute cursor-pointer flex items-center justify-center"
                        style={{ fontSize: "5rem" }}
                        animate={{
                            top: targetPosition.top,
                            left: targetPosition.left,
                            rotate: caughtAnimation ? 360 : [-5, 5, -5],
                            scale: caughtAnimation ? [1, 1.5, 0] : 1
                        }}
                        transition={{
                            top: { type: "spring", stiffness: 60, damping: 15 },
                            left: { type: "spring", stiffness: 60, damping: 15 },
                            rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                            scale: { duration: 0.3 }
                        }}
                        onClick={handleCatch}
                    >
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                        >
                            📚
                        </motion.div>
                    </motion.div>
                </div>
            )}

            {/* Loading Spinner when game finishes before API */}
            {timeLeft === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 mt-8 bg-white/50 p-6 rounded-2xl backdrop-blur-sm"
                >
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-xl text-accent">Final Score: {score}!</p>
                    <p className="text-gray-500">Hold tight, the AI is synthesizing the matches...</p>
                </motion.div>
            )}
        </div>
    );
}
