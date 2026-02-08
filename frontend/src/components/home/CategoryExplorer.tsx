"use client";

import Link from "next/link";
import {
    Fingerprint,
    ShieldCheck,
    FileText,
    Users,
    Briefcase,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";

interface Category {
    id: string;
    title: string;
    items: string[];
    icon: any;
    link?: string;
}

const categories: Category[] = [
    {
        id: "identity",
        title: "Identity & Govt Services",
        items: ["Aadhaar", "PAN Card", "Passport", "Driving Licence"],
        icon: Fingerprint,
        link: "/services/identity",
    },
    {
        id: "insurance",
        title: "Insurance & Finance",
        items: ["Claim Rejection", "Policy Confusion", "Appeals"],
        icon: ShieldCheck,
    },
    {
        id: "property",
        title: "Property & Documentation",
        items: ["Registration", "Ownership Transfer", "Rental),"],
        icon: FileText,
    },
    {
        id: "family",
        title: "Family & Personal",
        items: ["Succession", "Marriage", "Certificates"],
        icon: Users,
    },
    {
        id: "work",
        title: "Workplace & Employment",
        items: ["PF / ESI Issues", "Termination", "Salary Disputes"],
        icon: Briefcase,
    },
];

export default function CategoryExplorer() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">What Can LifeFlow Help You With?</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Explore our most common service categories. Click any item to start a guided intake process.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 flex flex-col h-full relative"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <cat.icon className="w-6 h-6" />
                                </div>
                                {cat.link ? (
                                    <Link href={cat.link} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground group-hover:text-primary z-10">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </Link>
                                ) : (
                                    <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground group-hover:text-primary">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <h3 className="text-xl font-bold mb-4">
                                {cat.link ? (
                                    <Link href={cat.link} className="hover:text-primary transition-colors">
                                        {cat.title}
                                    </Link>
                                ) : (
                                    cat.title
                                )}
                            </h3>

                            <div className="flex flex-wrap gap-2 mt-auto">
                                {cat.items.map((item) => (
                                    <button
                                        key={item}
                                        className="text-sm px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                {cat.link ? (
                                    <Link href={cat.link} className="flex items-center gap-2 hover:underline z-10">
                                        View All Services
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <button className="flex items-center gap-2">
                                        View All Services
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Make the whole card clickable if link exists, but keep buttons interactive */}
                            {cat.link && (
                                <Link href={cat.link} className="absolute inset-0 z-0" aria-label={`View ${cat.title}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
