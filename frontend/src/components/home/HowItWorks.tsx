"use client";
import { useState, useEffect, useMemo } from "react";
import {
    Map,
    Search,
    CheckCircle2
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

function StepCard({ step, idx, isActive }: { step: { title: string; description: string; icon: any }; idx: number; isActive: boolean }) {
    const [hovered, setHovered] = useState(false);
    const Icon = step.icon;

    return (
        <div
            className="flex flex-col items-center text-center cursor-default transition-all duration-500"
            style={{ transform: hovered ? "translateY(-8px)" : "translateY(0)" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Step circle */}
            <div
                className="relative mb-8 transition-all duration-500"
                style={{
                    filter: hovered ? "drop-shadow(0 8px 24px rgba(20,140,100,0.35))" : "none",
                }}
            >
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500"
                    style={{
                        background: hovered ? "hsl(var(--primary))" : "hsl(var(--card))",
                        border: hovered ? "2.5px solid hsl(var(--primary))" : "2px solid hsl(var(--primary) / 0.2)",
                        transform: hovered ? "scale(1.12)" : "scale(1)",
                    }}
                >
                    <Icon
                        className="w-8 h-8 transition-colors duration-500"
                        style={{ color: hovered ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))" }}
                    />
                </div>
                {/* Step number badge */}
                <div
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center border-4 border-background transition-all duration-500"
                    style={{
                        background: "hsl(var(--primary))",
                        transform: hovered ? "scale(1.2) rotate(10deg)" : "scale(1) rotate(0deg)",
                    }}
                >
                    {idx + 1}
                </div>
            </div>

            {/* Connector pulse dots (desktop only) */}
            <h3
                className="text-xl font-bold mb-4 transition-colors duration-300"
                style={{ color: hovered ? "hsl(var(--primary))" : undefined }}
            >
                {step.title}
            </h3>
            <p
                className="text-muted-foreground leading-relaxed px-4 transition-all duration-300"
                style={{ opacity: hovered ? 1 : 0.75 }}
            >
                {step.description}
            </p>

            {/* Hover underline accent */}
            <div
                className="mt-4 h-0.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: hovered ? "60px" : "0px", opacity: hovered ? 1 : 0 }}
            />
        </div>
    );
}

export default function HowItWorks() {
    const { t, language } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const steps = useMemo(() => [
        {
            title: t("how_it_works.step1.title"),
            description: t("how_it_works.step1.description"),
            icon: Search,
        },
        {
            title: t("how_it_works.step2.title"),
            description: t("how_it_works.step2.description"),
            icon: Map,
        },
        {
            title: t("how_it_works.step3.title"),
            description: t("how_it_works.step3.description"),
            icon: CheckCircle2,
        },
    ], [t, language]);

    if (!mounted) return null;

    return (
        <section id="how-it-works" className="py-24 bg-background border-y border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("how_it_works.title")}</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        {t("how_it_works.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                    {steps.map((step, idx) => (
                        <StepCard key={idx} step={step} idx={idx} isActive={false} />
                    ))}
                </div>
            </div>
        </section>
    );
}
