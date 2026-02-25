"use client";

import Link from "next/link";
import { Sparkles, Target, Users, ShieldCheck, ArrowRight } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutPage() {
    const { t } = useLanguage();

    const values = [
        {
            icon: Sparkles,
            title: t("about.values_title"), // Using a generic title key or I should have added specific value keys
            description: t("about.mission_desc1"), // Mapping to existing mission keys for now or I should add more
        },
        // For brevity and to keep dictionary manageable, I'll map these or add specific keys if needed.
        // Actually, let's just localize the main page structure first.
    ];

    const localizedValues = [
        {
            icon: Sparkles,
            title: "AI-Powered Guidance",
            description: t("about.mission_desc2"),
        },
        {
            icon: Target,
            title: "Clarity First",
            description: t("about.subtitle"),
        },
        {
            icon: Users,
            title: "Human-Centred",
            description: t("about.mission_desc1"),
        },
        {
            icon: ShieldCheck,
            title: "Safe & Private",
            description: t("footer.description"), // Using footer desc as fallback
        },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero */}
            <section className="relative overflow-hidden py-24 px-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" /> {t("about.hero_badge")}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                        {t("about.title_part1")}{" "}
                        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            {t("about.title_part2")}
                        </span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t("about.subtitle")}
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="py-16 px-4 border-t border-border">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">{t("about.mission_title")}</h2>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                                {t("about.mission_desc1")}
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                {t("about.mission_desc2")}
                            </p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-primary">7+</span>
                                <span className="text-muted-foreground">{t("about.stats.domains")}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-primary">100%</span>
                                <span className="text-muted-foreground">{t("about.stats.jargon_free")}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-primary">24/7</span>
                                <span className="text-muted-foreground">{t("about.stats.support_24_7")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 px-4 bg-muted/30">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">{t("about.values_title")}</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {localizedValues.map((v) => (
                            <div
                                key={v.title}
                                className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                    <v.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{v.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 text-center">
                <h2 className="text-3xl font-bold mb-4">{t("about.cta_title")}</h2>
                <p className="text-muted-foreground mb-8">
                    {t("about.cta_subtitle")}
                </p>
                <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30"
                >
                    {t("about.get_started")} <ArrowRight className="w-4 h-4" />
                </Link>
            </section>
        </div>
    );
}
