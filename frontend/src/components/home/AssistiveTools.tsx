"use client";

import {
    CheckSquare,
    Calendar,
    MapPin,
    FileSearch,
    PenTool,
    Lock
} from "lucide-react";

const tools = [
    {
        title: "Document Checklist",
        description: "Generate a personalized list of required documents for any government procedure.",
        icon: CheckSquare,
        isPlaceholder: false,
    },
    {
        title: "Timeline Tracker",
        description: "Track deadlines and processing times for applications like Passports or PAN cards.",
        icon: Calendar,
        isPlaceholder: true,
    },
    {
        title: "Where To Go Helper",
        description: "Find the exact government office, kiosk, or website you need to visit for your specific task.",
        icon: MapPin,
        isPlaceholder: true,
    },
    {
        title: "Document Explainer",
        description: "Upload a complex legal document and get it explained in simple, human terms.",
        icon: FileSearch,
        isPlaceholder: true,
    },
    {
        title: "Appeal Draft Assistant",
        description: "Get help drafting basic letters of inquiry or appeals for common administrative rejections.",
        icon: PenTool,
        isPlaceholder: true,
    },
];

export default function AssistiveTools() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Smart Tools That Simplify Your Process</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Go beyond search. Use our specialty tools to handle the nitty-gritty details of your administrative life.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool, idx) => (
                        <div
                            key={idx}
                            className={`p-8 rounded-2xl border-2 border-border bg-card transition-all duration-300 relative overflow-hidden group ${tool.isPlaceholder ? "opacity-90" : "hover:border-primary/30 hover:shadow-xl"
                                }`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <tool.icon className="w-6 h-6" />
                                </div>
                                {tool.isPlaceholder && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <Lock className="w-3 h-3" />
                                        Coming Soon
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{tool.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                {tool.description}
                            </p>

                            {!tool.isPlaceholder && (
                                <button className="text-sm font-bold text-primary hover:underline transition-all">
                                    Try it now →
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
