"use client";

import Link from "next/link";
import { Twitter, Instagram, Linkedin, Github, Heart } from "lucide-react";

export default function Footer() {
    const sections = [
        {
            title: "Product",
            links: [
                { name: "Features", href: "/#features" },
                { name: "How It Works", href: "/#how-it-works" },
                { name: "Roadmap", href: "/roadmap" },
            ],
        },
        {
            title: "Resources",
            links: [
                { name: "Knowledge Hub", href: "/knowledge-hub" },
                { name: "Legal Guides", href: "/guides" },
                { name: "FAQ", href: "/faq" },
            ],
        },
        {
            title: "Support",
            links: [
                { name: "Contact", href: "/contact" },
                { name: "Feedback Form", href: "/feedback" },
                { name: "Report Issue", href: "/report" },
            ],
        },
        {
            title: "Legal",
            links: [
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Disclaimer", href: "/disclaimer" },
                { name: "Terms of Service", href: "/terms" },
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
                            Empowering people to navigate life's administrative and legal challenges with clarity, guidance, and confidence.
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
                            All Systems Operational
                        </span>
                        <p className="text-xs text-muted-foreground italic">
                            Redefining guidance.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
