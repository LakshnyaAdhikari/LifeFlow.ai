"use client";

import { useState, useEffect } from "react";
import { History, Search, MessageSquare, Calendar, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryItem {
    id: number;
    type: string;
    title: string;
    domain?: string;
    confidence?: number;
    created_at: string;
}

export default function HistoryTab() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch("http://127.0.0.1:8000/dashboard/history", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error("Failed to fetch history:", e);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item => {
        if (filter === "all") return true;
        return item.type === filter;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Past Guidance & History</h2>
                    <p className="text-muted-foreground">Your complete record of search queries and AI guidance sessions.</p>
                </div>
                <div className="flex bg-muted p-1 rounded-xl">
                    <button
                        onClick={() => setFilter("all")}
                        className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", filter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter("query")}
                        className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", filter === "query" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                    >
                        Queries
                    </button>
                    <button
                        onClick={() => setFilter("session")}
                        className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", filter === "session" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                    >
                        Sessions
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredHistory.map((item, idx) => (
                    <div key={`${item.type}-${item.id}-${idx}`} className="group p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                item.type === "query" ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
                            )}>
                                {item.type === "query" ? <Search className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">{item.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                    {item.domain && (
                                        <span className="px-2 py-0.5 rounded-md bg-muted font-bold text-[10px] uppercase tracking-wider">
                                            {item.domain}
                                        </span>
                                    )}
                                    {item.confidence && (
                                        <span className="text-primary font-bold">
                                            {Math.round(item.confidence * 100)}% Confidence
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button className="p-2 rounded-full hover:bg-muted text-muted-foreground group-hover:text-primary transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ))}

                {!loading && filteredHistory.length === 0 && (
                    <div className="py-20 text-center">
                        <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-muted-foreground">No history items found</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
