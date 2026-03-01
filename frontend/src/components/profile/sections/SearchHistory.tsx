"use client";

import { Search, Clock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchSearchHistory, type SearchHistoryEntry } from "@/lib/searchHistoryApi";

export default function SearchHistory() {
    const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadSearchHistory = async () => {
            try {
                const data = await fetchSearchHistory();
                setSearchHistory(data || []);
            } catch (error) {
                console.error("Failed to fetch search history:", error);
            } finally {
                setLoading(false);
            }
        };

        loadSearchHistory();
    }, []);

    const handleSearchClick = (query: string) => {
        // Navigate to home page with search query
        router.push(`/home?search=${encodeURIComponent(query)}`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Search History</h1>
                <p className="text-muted-foreground">All your past searches and guidances</p>
            </div>

            {loading ? (
                <div className="py-12 text-center">
                    <div className="inline-block animate-spin">
                        <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mt-4">Loading...</p>
                </div>
            ) : searchHistory.length > 0 ? (
                <div className="space-y-3">
                    {searchHistory.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleSearchClick(item.query)}
                            className="w-full p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all group text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                                    <Search className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.query}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{item.domain || "General"}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
                    <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No search history</h3>
                    <p className="text-sm text-muted-foreground">Your searches will appear here</p>
                </div>
            )}
        </div>
    );
}
