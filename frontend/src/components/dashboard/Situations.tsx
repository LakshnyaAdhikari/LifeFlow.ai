"use client";

import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle2, AlertCircle, Clock, Filter, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Situation {
    id: number;
    title: string;
    primary_domain: string;
    status: string;
    updated_at: string;
}

export default function SituationsTab() {
    const [situations, setSituations] = useState<Situation[]>([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSituations();
    }, []);

    const fetchSituations = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch("http://127.0.0.1:8000/situations", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSituations(data);
            }
        } catch (e) {
            console.error("Failed to fetch situations:", e);
        } finally {
            setLoading(false);
        }
    };

    const filteredSituations = situations.filter(s => {
        if (statusFilter === "all") return true;
        return s.status === statusFilter;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "resolved": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case "active": return <Clock className="w-5 h-5 text-blue-500" />;
            default: return <AlertCircle className="w-5 h-5 text-amber-500" />;
        }
    };

    const getDomainColor = (domain: string) => {
        const colors: Record<string, string> = {
            "Insurance": "bg-blue-500",
            "Identity": "bg-purple-500",
            "Property": "bg-emerald-500",
            "Employment": "bg-orange-500",
        };
        return colors[domain] || "bg-gray-400";
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">My Situations</h2>
                    <p className="text-muted-foreground">Manage ongoing life situations and track their progress.</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="bg-muted px-4 py-2 rounded-xl text-sm font-bold border-none focus:ring-2 ring-primary/20"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredSituations.map((s, idx) => (
                    <div key={`situation-${s.id}-${idx}`} className="group p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all flex items-center gap-6">
                        {/* Domain Accent Strip */}
                        <div className={cn("w-1.5 h-16 rounded-full self-center", getDomainColor(s.primary_domain))}></div>

                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-xl group-hover:text-primary transition-colors">{s.title}</h4>
                                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                    {s.primary_domain}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5 uppercase font-bold tracking-tight">
                                    {getStatusIcon(s.status)}
                                    {s.status}
                                </span>
                                <span>Updated {new Date(s.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Confidence</p>
                                <p className="font-bold text-primary">85%</p>
                            </div>
                            <button className="p-3 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {!loading && filteredSituations.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-muted-foreground">No situations found</h3>
                        <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or start a new intake.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
