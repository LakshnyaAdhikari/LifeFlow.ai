"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useTheme } from "next-themes";

export default function ScrollButton() {
    const [scrolledHalf, setScrolledHalf] = useState(false);
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            // If scrolled more than 40% of the page
            setScrolledHalf(currentScroll > scrollHeight * 0.4);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const smoothScrollTo = (targetY: number, duration: number) => {
        const startY = window.scrollY;
        const difference = targetY - startY;
        const startTime = performance.now();

        const step = (currentTime: number) => {
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Ease out cubic function for smoother finish
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            window.scrollTo(0, startY + difference * easeProgress);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    const handleScrollAction = () => {
        const target = scrolledHalf ? 0 : document.documentElement.scrollHeight;
        smoothScrollTo(target, 2500); // 2.5 seconds for a very slow, premium feel
    };

    if (!mounted) return null;

    const isDark = (resolvedTheme ?? theme) === "dark";

    return (
        <motion.button
            onClick={handleScrollAction}
            className={`fixed right-8 bottom-12 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl backdrop-blur-lg border-2 transition-all duration-500 ${isDark
                ? "bg-teal-950/40 border-teal-500/30 text-teal-400 hover:bg-teal-900/60 hover:border-teal-500/50"
                : "bg-white/90 border-teal-500/20 text-teal-600 hover:bg-teal-50 hover:border-teal-500/40"
                }`}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{
                opacity: 1,
                scale: 1,
                y: [0, -10, 0], // Continuous slow floating
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
                y: {
                    duration: 4, // 4 seconds for one full float cycle
                    repeat: Infinity,
                    ease: "easeInOut"
                },
                default: { duration: 0.8 }
            }}
            aria-label={scrolledHalf ? "Scroll to Top" : "Scroll to Bottom"}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={scrolledHalf ? "up" : "down"}
                    initial={{ opacity: 0, rotate: scrolledHalf ? -180 : 180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: scrolledHalf ? 180 : -180 }}
                    transition={{ duration: 1, ease: "easeInOut" }} // Slow rotation
                >
                    {scrolledHalf ? (
                        <ArrowUp className="w-7 h-7" />
                    ) : (
                        <ArrowDown className="w-7 h-7" />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Soft pulse effect */}
            <motion.div
                className="absolute inset-0 rounded-full bg-teal-500/10 -z-10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
        </motion.button>
    );
}
