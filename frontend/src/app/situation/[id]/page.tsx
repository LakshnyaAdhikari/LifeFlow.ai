"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquare, Send, CheckCircle2, Clock, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
    title: string;
    description: string;
    why_it_matters: string;
    urgency: string;
    can_skip: boolean;
    estimated_time?: string;
}

interface GuidanceResponse {
    suggestions: Suggestion[];
    sources: Array<{
        title: string;
        authority: string;
        document_id: number;
    }>;
    confidence: {
        score: number;
        reliability: string;
        explanation: string;
        breakdown: {
            llm: number;
            retrieval: number;
            historical: number;
        };
    };
    caveats: string[];
    cross_domain_insights: string[];
    metadata: {
        session_id: number;
        chunks_retrieved: number;
        domain: string;
    };
}

interface Situation {
    id: number;
    title: string;
    primary_domain: string;
    related_domains: string[];
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
}

export default function SituationPage() {
    const params = useParams();
    const router = useRouter();
    const situationId = params.id as string;

    const [situation, setSituation] = useState<Situation | null>(null);
    const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingGuidance, setLoadingGuidance] = useState(false);
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSituation();
    }, [situationId]);

    const loadSituation = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/auth/login");
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/situations/${situationId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setSituation(data.situation);

                // Auto-load initial guidance
                if (!guidance) {
                    loadGuidance(data.situation.title);
                }
            } else {
                setError("Failed to load situation");
            }
        } catch (e) {
            console.error(e);
            setError("Error loading situation");
        } finally {
            setLoading(false);
        }
    };

    const loadGuidance = async (queryText?: string) => {
        if (!situation && !queryText) return;

        const token = localStorage.getItem("access_token");
        setLoadingGuidance(true);
        setError(null);

        try {
            const res = await fetch("http://127.0.0.1:8000/guidance/suggestions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: queryText || query || situation?.title,
                    domain: situation?.primary_domain || "General",
                    situation_id: parseInt(situationId)
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setGuidance(data);
                setQuery("");
            } else {
                const errorData = await res.json();

                if (errorData.detail?.includes("OPENAI_API_KEY")) {
                    setError("AI guidance requires OpenAI API key. Please configure it in the backend.");
                } else if (errorData.detail?.includes("No specific authoritative information")) {
                    setError("Knowledge base is empty. Run the bootstrap script to populate it.");
                } else {
                    setError(`Failed to get guidance: ${errorData.detail || "Unknown error"}`);
                }
            }
        } catch (e) {
            console.error(e);
            setError("Error getting guidance");
        } finally {
            setLoadingGuidance(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!situation) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Situation not found</h2>
                    <button
                        onClick={() => router.push("/home")}
                        className="text-primary hover:underline"
                    >
                        Go back home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col p-6 bg-background text-foreground">
            {/* Header */}
            <div className="w-full max-w-6xl mx-auto mb-6">
                <button
                    onClick={() => router.push("/home")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </button>

                <div className="bg-card border-2 border-border rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">{situation.title}</h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                    {situation.primary_domain}
                                </span>
                                <span className={cn(
                                    "px-3 py-1 rounded-full font-medium",
                                    situation.priority === "urgent"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                )}>
                                    {situation.priority}
                                </span>
                                <span className={cn(
                                    "px-3 py-1 rounded-full font-medium",
                                    situation.status === "active"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
                                )}>
                                    {situation.status}
                                </span>
                            </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                            <p>Created: {situation.created_at ? new Date(situation.created_at).toLocaleDateString() : 'Unknown'}</p>
                            <p>Updated: {situation.updated_at ? new Date(situation.updated_at).toLocaleDateString() : 'Never'}</p>
                        </div>
                    </div>

                    {situation.related_domains.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">Related Areas:</p>
                            <div className="flex flex-wrap gap-2">
                                {situation.related_domains.map((domain) => (
                                    <span key={domain} className="px-2 py-1 rounded-full bg-muted text-sm">
                                        {domain}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Guidance Section */}
            <div className="w-full max-w-6xl mx-auto grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Ask Question */}
                    <div className="bg-card border-2 border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Ask for Guidance
                        </h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && loadGuidance()}
                                placeholder="What would you like to know?"
                                className="flex-1 px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none"
                                disabled={loadingGuidance}
                            />
                            <button
                                onClick={() => loadGuidance()}
                                disabled={loadingGuidance || !query.trim()}
                                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {loadingGuidance ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-red-900 dark:text-red-400 mb-1">
                                        Unable to Generate Guidance
                                    </h3>
                                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guidance Results */}
                    {guidance && (
                        <div className="space-y-6">
                            {/* Suggestions */}
                            <div className="bg-card border-2 border-border rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5" />
                                    Suggested Steps
                                </h2>
                                <div className="space-y-4">
                                    {guidance.suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-lg border-2 border-border hover:border-primary transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-semibold">{suggestion.title}</h3>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    suggestion.urgency === "high"
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                                        : suggestion.urgency === "medium"
                                                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                                            : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                )}>
                                                    {suggestion.urgency} priority
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {suggestion.description}
                                            </p>
                                            <p className="text-sm text-foreground">
                                                <strong>Why it matters:</strong> {suggestion.why_it_matters}
                                            </p>
                                            {suggestion.estimated_time && (
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {suggestion.estimated_time}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cross-Domain Insights */}
                            {guidance.cross_domain_insights.length > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 rounded-xl p-6">
                                    <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-400">
                                        Cross-Domain Insights
                                    </h3>
                                    <ul className="space-y-2">
                                        {guidance.cross_domain_insights.map((insight, index) => (
                                            <li key={index} className="text-sm text-blue-800 dark:text-blue-300">
                                                • {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Caveats */}
                            {guidance.caveats.length > 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 rounded-xl p-6">
                                    <h3 className="font-semibold mb-3 text-yellow-900 dark:text-yellow-400">
                                        Important Notes
                                    </h3>
                                    <ul className="space-y-2">
                                        {guidance.caveats.map((caveat, index) => (
                                            <li key={index} className="text-sm text-yellow-800 dark:text-yellow-300">
                                                • {caveat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Confidence Score */}
                    {guidance && (
                        <div className="bg-card border-2 border-border rounded-xl p-6">
                            <h3 className="font-semibold mb-4">Confidence Score</h3>
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl font-bold">
                                        {(guidance.confidence.score * 100).toFixed(0)}%
                                    </span>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium",
                                        guidance.confidence.reliability === "high"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                            : guidance.confidence.reliability === "medium"
                                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                    )}>
                                        {guidance.confidence.reliability}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary rounded-full h-2 transition-all"
                                        style={{ width: `${guidance.confidence.score * 100}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4">
                                {guidance.confidence.explanation}
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span>LLM Confidence:</span>
                                    <span className="font-medium">
                                        {(guidance.confidence.breakdown.llm * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Retrieval Strength:</span>
                                    <span className="font-medium">
                                        {(guidance.confidence.breakdown.retrieval * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Historical Accuracy:</span>
                                    <span className="font-medium">
                                        {(guidance.confidence.breakdown.historical * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sources */}
                    {guidance && guidance.sources.length > 0 && (
                        <div className="bg-card border-2 border-border rounded-xl p-6">
                            <h3 className="font-semibold mb-4">Authoritative Sources</h3>
                            <div className="space-y-3">
                                {guidance.sources.map((source, index) => (
                                    <div key={index} className="text-sm">
                                        <p className="font-medium">{source.title}</p>
                                        <p className="text-xs text-muted-foreground">{source.authority}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
