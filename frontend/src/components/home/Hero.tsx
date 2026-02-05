"use client";

import { useState } from "react";
import { Search, ArrowRight, Sparkles } from "lucide-react";

interface HeroProps {
    onSearch: (query: string) => void;
}

export default function Hero({ onSearch }: HeroProps) {
    const [query, setQuery] = useState("");

    const quickStarters = [
        "Aadhaar update",
        "Insurance claim rejected",
        "Passport renewal",
        "Driving licence issue",
        "Property registration",
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleChipClick = (starter: string) => {
        setQuery(starter);
        onSearch(starter);
    };

    return (
        <section className="relative py-20 lg:py-32 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2">
                        <Sparkles className="w-3 h-3" />
                        <span>AI-Powered Personal Life Companion</span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-500">
                        Legal & Administrative Help — <span className="text-primary italic">Explained Like a Human</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700">
                        LifeFlow helps you understand procedures, rights, and next steps without confusion or legal jargon. Start your guided journey today.
                    </p>

                    {/* Search Box */}
                    <div className="relative group max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <form onSubmit={handleSubmit} className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/5 text-primary group-focus-within:bg-primary group-focus-within:text-white transition-all duration-300">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="What situation are you dealing with today?"
                                className="w-full pl-16 pr-32 py-5 bg-card border-2 border-border rounded-2xl shadow-sm focus:border-primary focus:outline-none focus:ring-4 ring-primary/10 transition-all text-lg placeholder:text-muted-foreground/60"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                Get Guidance
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                    {/* Suggestion Chips */}
                    <div className="mt-8 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <span className="text-sm font-medium text-muted-foreground py-2 mr-2">Try searching:</span>
                        {quickStarters.map((starter) => (
                            <button
                                key={starter}
                                onClick={() => handleChipClick(starter)}
                                className="px-4 py-2 rounded-full border border-border bg-card/50 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300"
                            >
                                {starter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
