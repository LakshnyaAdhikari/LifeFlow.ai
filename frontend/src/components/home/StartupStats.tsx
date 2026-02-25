"use client";
import { useState, useEffect, useMemo } from "react";
import {
    ShieldCheck,
    Map,
    Search,
    Scale
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function StatCard({ stat }: { stat: { label: string; value: string; icon: any } }) {
    const [hovered, setHovered] = useState(false);
    const Icon = stat.icon;

    return (
        <div
            className="flex flex-col items-center text-center cursor-default transition-all duration-400"
            style={{ transform: hovered ? "translateY(-6px) scale(1.04)" : "translateY(0) scale(1)" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Icon circle */}
            <div
                className="p-4 rounded-2xl mb-4 transition-all duration-400"
                style={{
                    background: hovered ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                    transform: hovered ? "rotate(-8deg) scale(1.15)" : "rotate(0deg) scale(1)",
                    boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.2)" : "none",
                }}
            >
                <Icon
                    className="w-7 h-7 transition-all duration-300"
                    style={{ transform: hovered ? "scale(1.1)" : "scale(1)" }}
                />
            </div>

            {/* Stat value */}
            <div
                className="text-3xl md:text-4xl font-extrabold mb-1 transition-all duration-300"
                style={{
                    textShadow: hovered ? "0 0 20px rgba(255,255,255,0.4)" : "none",
                    transform: hovered ? "scale(1.08)" : "scale(1)",
                }}
            >
                {stat.value}
            </div>

            {/* Label */}
            <div
                className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider transition-all duration-300"
                style={{ opacity: hovered ? 1 : 0.8 }}
            >
                {stat.label}
            </div>

            {/* Glowing bottom bar */}
            <div
                className="mt-3 h-0.5 rounded-full bg-white transition-all duration-500"
                style={{ width: hovered ? "48px" : "0px", opacity: hovered ? 0.6 : 0 }}
            />
        </div>
    );
}

export default function StartupStats() {
    const { t, language } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const stats = useMemo(() => [
        {
            label: t("stats.legal_domains"),
            value: "10+",
            icon: Scale,
        },
        {
            label: t("stats.procedures"),
            value: "50+",
            icon: Map,
        },
        {
            label: t("stats.accuracy"),
            value: "99%",
            icon: ShieldCheck,
        },
        {
            label: t("stats.queries"),
            value: "1000+",
            icon: Search,
        },
    ], [t, language]);

    if (!mounted) return null;

    return (
        <section className="py-16 bg-primary text-primary-foreground">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, idx) => (
                        <StatCard key={idx} stat={stat} />
                    ))}
                </div>
            </div>
        </section>
    );
}
