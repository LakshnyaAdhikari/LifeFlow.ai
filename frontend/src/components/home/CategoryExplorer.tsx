"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Fingerprint,
    ShieldCheck,
    FileText,
    Users,
    Briefcase,
    Sparkles,
    Smile
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Category {
    id: string;
    title: string;
    description: string;
    icon: any;
    href?: string;
    isMore?: boolean;
}

function CategoryCard({ cat, signupCta }: { cat: Category; signupCta: string }) {
    const [hovered, setHovered] = useState(false);
    const Icon = cat.icon;

    return (
        <div
            className={`relative h-64 overflow-hidden rounded-3xl border transition-all duration-500 shadow-sm cursor-pointer ${cat.isMore
                ? "ring-2 ring-primary/30 border-primary/20 bg-primary/5"
                : "border-primary/10 bg-gradient-to-br from-card to-primary/5"
                } ${hovered ? "shadow-xl shadow-primary/20 -translate-y-1" : ""}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Default state */}
            <div
                className="flex flex-col items-center justify-center h-full p-8 text-center transition-all duration-500"
                style={{ opacity: hovered ? 0 : 1, transform: hovered ? "scale(0.95)" : "scale(1)" }}
            >
                <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-colors duration-300 ${cat.isMore ? "bg-primary text-white" : "bg-primary/20 text-primary"
                        }`}
                >
                    <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">{cat.title}</h3>
            </div>

            {/* Hover state */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-primary text-primary-foreground transition-all duration-500"
                style={{ opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(16px)" }}
            >
                <div className="mb-4">
                    {cat.isMore ? (
                        <Smile className="w-10 h-10 mb-2 mx-auto animate-bounce" />
                    ) : (
                        <Icon className="w-10 h-10 mb-2 mx-auto" />
                    )}
                </div>
                <p className="text-sm font-medium leading-relaxed max-w-xs italic">
                    {cat.description}
                </p>
                {cat.isMore && (
                    <Link
                        href="/auth/signup"
                        className="mt-6 px-6 py-2 bg-white text-primary rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {signupCta}
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function CategoryExplorer() {
    const { t, language } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const categories: Category[] = useMemo(() => [
        {
            id: "identity",
            title: t("categories.identity.title"),
            description: t("categories.identity.description"),
            icon: Fingerprint,
            href: "/services/identity",
        },
        {
            id: "insurance",
            title: t("categories.insurance.title"),
            description: t("categories.insurance.description"),
            icon: ShieldCheck,
        },
        {
            id: "property",
            title: t("categories.property.title"),
            description: t("categories.property.description"),
            icon: FileText,
        },
        {
            id: "family",
            title: t("categories.family.title"),
            description: t("categories.family.description"),
            icon: Users,
        },
        {
            id: "work",
            title: t("categories.work.title"),
            description: t("categories.work.description"),
            icon: Briefcase,
        },
        {
            id: "more",
            title: t("categories.more.title"),
            description: t("categories.more.description"),
            icon: Sparkles,
            isMore: true,
        },
    ], [t, language]);

    if (!mounted) return null;

    return (
        <section className="py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("categories.title")}</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t("categories.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.map((cat) => (
                        <CategoryCard
                            key={cat.id}
                            cat={cat}
                            signupCta={t("categories.more.signup_cta")}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
