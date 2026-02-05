"use client";

import {
    ShieldCheck,
    Map,
    Search,
    Scale
} from "lucide-react";

const stats = [
    {
        label: "Legal Domains Covered",
        value: "10+",
        icon: Scale,
    },
    {
        label: "Procedures Supported",
        value: "50+",
        icon: Map,
    },
    {
        label: "AI Accuracy Rate",
        value: "99%",
        icon: ShieldCheck,
    },
    {
        label: "Queries Resolved",
        value: "1000+",
        icon: Search,
    },
];

export default function StartupStats() {
    return (
        <section className="py-16 bg-primary text-primary-foreground">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center">
                            <div className="p-3 rounded-full bg-white/10 mb-4">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="text-3xl md:text-4xl font-extrabold mb-1">
                                {stat.value}
                            </div>
                            <div className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
