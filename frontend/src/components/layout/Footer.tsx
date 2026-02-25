"use client";

import Link from "next/link";
import { Twitter, Instagram, Linkedin, Github, Heart } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
    const { t } = useLanguage();

    const sections = [
        {
            title: t("footer.product"),
            links: [
                { name: t("footer.links.features"), href: "/#features" },
                { name: t("footer.links.how_it_works"), href: "/#how-it-works" },
                { name: t("footer.links.roadmap"), href: "/roadmap" },
            ],
        },
        {
            title: t("footer.resources"),
            links: [
                { name: t("footer.links.knowledge_hub"), href: "/knowledge-hub" },
                { name: t("footer.links.legal_guides"), href: "/guides" },
                { name: t("footer.links.faq"), href: "/faq" },
            ],
        },
        {
            title: t("footer.support"),
            links: [
                { name: t("footer.links.contact"), href: "/contact" },
                { name: t("footer.links.feedback"), href: "/feedback" },
                { name: t("footer.links.report"), href: "/report" },
            ],
        },
        {
            title: t("footer.legal"),
            links: [
                { name: t("footer.links.privacy"), href: "/privacy" },
                { name: t("footer.links.disclaimer"), href: "/disclaimer" },
                { name: t("footer.links.terms"), href: "/terms" },
            ],
        },
    ];

    return (
        <footer className="bg-card border-t border-border mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {/* Brand Column */}
                    <div className="col-span-2 lg:col-span-1 border-b border-border pb-8 lg:border-none lg:pb-0">
                        <Link href="/" className="inline-block mb-4">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                LifeFlow.ai
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            {t("footer.description")}
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Nav Sections */}
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-l-2 border-primary/30 pl-3">
                                {section.title}
                            </h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            {t("footer.status_operational")}
                        </span>
                        <p className="text-xs text-muted-foreground italic">
                            {t("footer.tagline")}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
