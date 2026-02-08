"use client";

import { useEffect, useState } from "react";
import {
    Activity,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ShieldCheck,
    ArrowUpRight
} from "lucide-react";

interface Stats {
    active_situations: number;
    resolved_situations: number;
    draft_situations: number;
    total_interactions: number;
}

export default function Overview({ user }: { user: any }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch("http://127.0.0.1:8000/dashboard/stats", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error("Failed to fetch stats:", e);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: "Active Situations", value: stats?.active_situations ?? 0, icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Resolved Cases", value: stats?.resolved_situations ?? 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
        { label: "Total Interactions", value: stats?.total_interactions ?? 0, icon: Clock, color: "text-primary", bg: "bg-primary/5" },
        { label: "Pending Drafts", value: stats?.draft_situations ?? 0, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Workspace Overview</h2>
                <p className="text-muted-foreground">Welcome back, {user?.full_name?.split(" ")[0]}. Here is what's happening in your legal control center.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                        <h4 className="text-2xl font-bold">{stat.value}</h4>
                    </div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Risk & Completion */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Risk Profile Card */}
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <ShieldCheck className="w-5 h-5 text-white/80" />
                                <span className="text-sm font-bold uppercase tracking-wider text-white/80">Risk Profile Summary</span>
                            </div>
                            <h3 className="text-4xl font-bold mb-4">Stable & Covered</h3>
                            <p className="max-w-md text-white/80 mb-8 leading-relaxed">
                                Your identified situations are mostly within standard administrative procedures. No immediate legal escalations detected in the last 7 days.
                            </p>
                            <button className="px-6 py-2.5 bg-white text-primary rounded-xl font-bold text-sm hover:bg-white/90 transition-colors flex items-center gap-2">
                                Run Risk Audit
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Abstract Background Decor */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                            <h4 className="font-bold mb-1 group-hover:text-primary transition-colors">Add New Situation</h4>
                            <p className="text-xs text-muted-foreground">Start an intake for a new administrative task.</p>
                        </button>
                        <button className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                            <h4 className="font-bold mb-1 group-hover:text-primary transition-colors">Request Document Review</h4>
                            <p className="text-xs text-muted-foreground">Upload a doc for AI-powered human-first explanation.</p>
                        </button>
                    </div>
                </div>

                {/* Right: Profile Progress */}
                <div className="space-y-8">
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                        <h4 className="font-bold mb-6">Profile Completion</h4>
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">Verification Progress</span>
                                <span className="text-primary font-bold">65%</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div className="w-[65%] h-full bg-primary transition-all duration-1000"></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: "Phone Verified", done: true },
                                { label: "Family Details Added", done: false },
                                { label: "Primary Documents Linked", done: false },
                                { label: "Location Set", done: true },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center",
                                        step.done ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                                    )}>
                                        <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                    <span className={step.done ? "text-foreground font-medium" : "text-muted-foreground"}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Insights Tip */}
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900">
                        <h5 className="font-bold text-sm mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            Tip for today
                        </h5>
                        <p className="text-xs leading-relaxed opacity-80">
                            You've searched for "Insurance" 3 times lately. Consider linking your policy in "Documents" for more personalized guidance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
