"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Search, ShieldCheck, FileCheck, AlertTriangle } from "lucide-react";

export default function IdentityHero() {
    const { t } = useLanguage();

    return (
        <div className="bg-primary/5 border-b border-primary/10 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                    {t("services.identity_hero.title")}
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    {t("services.identity_hero.subtitle")}
                </p>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto relative mb-12">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-4 bg-background border-2 border-primary/20 rounded-2xl text-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        placeholder={t("services.identity_hero.search_placeholder")}
                    />
                </div>

                {/* Stats Block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border border-border/50">
                        <div className="p-2 rounded-full bg-blue-50 text-blue-600 mb-2">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">1.3B+</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("services.identity_hero.stat1_label")}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border border-border/50">
                        <div className="p-2 rounded-full bg-green-50 text-green-600 mb-2">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">95%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("services.identity_hero.stat2_label")}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border border-border/50">
                        <div className="p-2 rounded-full bg-amber-50 text-amber-600 mb-2">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">70%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("services.identity_hero.stat3_label")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
