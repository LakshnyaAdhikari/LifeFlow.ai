"use client";

import {
    History,
    Cpu,
    Layers,
    BrainCircuit,
    BarChart3,
    Clock
} from "lucide-react";

const features = [
    {
        title: "Personalized Situation Tracking",
        description: "Never lose track of where you are in a complex process. We save your progress and context automatically.",
        icon: History,
    },
    {
        title: "AI + Govt Knowledge Integration",
        description: "Our engine combines advanced LLMs with real-time government procedure updates for accurate guidance.",
        icon: Cpu,
    },
    {
        title: "Layman → Professional Mode",
        description: "Switch between simple explanations and detailed regulatory language whenever you need deeper insight.",
        icon: Layers,
    },
    {
        title: "Cross-Domain Intelligence",
        description: "LifeFlow understands how property issues might affect your finances or family legal status.",
        icon: BrainCircuit,
    },
    {
        title: "Smart Reminders",
        description: "Get proactive alerts for document renewals, deadlines, and mandatory appointments.",
        icon: Clock,
    },
    {
        title: "Progress Analytics",
        description: "Visualize your journey with detailed timelines and completion percentages for every situation.",
        icon: BarChart3,
    },
];

export default function FeatureDifferentiation() {
    return (
        <section id="features" className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Why LifeFlow is Different</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Traditional legal portals are confusing. LifeFlow is designed to be your personal administrative companion.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="p-8 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
