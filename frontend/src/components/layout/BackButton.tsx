"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function BackButton({
    label = "Back",
    className = ""
}: {
    label?: string;
    className?: string;
}) {
    const router = useRouter();

    return (
        <motion.button
            onClick={() => router.back()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background/50 backdrop-blur-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-all active:scale-95 group ${className}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -2 }}
        >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">{label}</span>
        </motion.button>
    );
}
