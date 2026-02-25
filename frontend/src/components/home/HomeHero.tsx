"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";
import DarkNarrativeHero from "./DarkNarrativeHero";
import LightNarrativeHero from "./LightNarrativeHero";

export default function HomeHero({ onSearch }: { onSearch: (query: string) => void }) {
    const { user } = useAuth();
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { t } = useLanguage();

    useEffect(() => { setMounted(true); }, []);

    const isDark = mounted ? (resolvedTheme ?? theme) === "dark" : false;

    if (!mounted) return null;

    return (
        <section className={`relative w-full overflow-hidden transition-colors duration-700 ${isDark ? "bg-[#0c1c1a]" : "bg-white"}`}>
            <div className={`absolute inset-0 -z-10 ${isDark ? "bg-[#0c1c1a]" : "bg-gradient-to-b from-slate-50 to-white"}`} />

            <div className="relative pt-8 pb-6 flex flex-col items-center">
                {/* 1. Personalized Welcome Header */}
                <div className="text-center space-y-2 mb-4 px-4">
                    <h1 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                        {t("home.welcome")}{" "}
                        <span className={isDark ? "text-[#2db49b]" : "text-teal-600"}>
                            {user?.full_name?.split(" ")[0] || "User"}
                        </span>
                    </h1>
                    <p className={`text-[11px] md:text-xs font-bold uppercase tracking-widest max-w-xl mx-auto ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {t("home.what_can_help")}
                    </p>
                </div>

                {/* 2. Narrative Engine Stage - Unified with Search */}
                <div className="w-full relative">
                    {isDark ? (
                        <DarkNarrativeHero onSearch={onSearch} />
                    ) : (
                        <LightNarrativeHero onSearch={onSearch} />
                    )}
                </div>
            </div>
        </section>
    );
}
