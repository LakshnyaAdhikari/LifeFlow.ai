"use client";

import { Search, ShieldCheck, FileCheck, AlertTriangle } from "lucide-react";

export default function IdentityHero() {
    return (
        <div className="bg-primary/5 border-b border-primary/10 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                    Identity & Government Services
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    Manage, correct, recover, or verify your official documents — with structured guidance.
                </p>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto relative mb-12">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-4 bg-background border-2 border-primary/20 rounded-2xl text-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        placeholder="What's going on with your document? (e.g., 'Lost Aadhaar')"
                    />
                </div>

                {/* Stats Block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border border-border/50">
                        <div className="p-2 rounded-full bg-blue-50 text-blue-600 mb-2">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">1.3B+</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Aadhaar Issued</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border border-border/50">
                        <div className="p-2 rounded-full bg-green-50 text-green-600 mb-2">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">95%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Services Require ID</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border border-border/50">
                        <div className="p-2 rounded-full bg-amber-50 text-amber-600 mb-2">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">70%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Rejections via Errors</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
