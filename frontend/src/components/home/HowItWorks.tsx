"use client";

import {
    Users,
    Map,
    Search,
    CheckCircle2
} from "lucide-react";

const steps = [
    {
        title: "Step 1: Describe Situation",
        description: "Tell us what's happening in your own words. No legal forms or complex jargon required.",
        icon: Search,
    },
    {
        title: "Step 2: AI Understands Context",
        description: "Our engine analyzes your situation, identifies applicable laws, and determines your rights.",
        icon: Map,
    },
    {
        title: "Step 3: Guided Support",
        description: "Receive a personalized step-by-step plan with document checklists and clear instructions.",
        icon: CheckCircle2,
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-background border-y border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">How LifeFlow Works</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        We've simplified the journey from confusion to resolution into three clear steps.
                    </p>
                </div>

                <div className="relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-dashed bg-muted -translate-y-1/2 z-0"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center group">
                                <div className="w-20 h-20 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center mb-8 shadow-sm group-hover:border-primary group-hover:scale-110 transition-all duration-300 relative">
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center border-4 border-background">
                                        {idx + 1}
                                    </div>
                                    <step.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                                <p className="text-muted-foreground leading-relaxed px-4">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
