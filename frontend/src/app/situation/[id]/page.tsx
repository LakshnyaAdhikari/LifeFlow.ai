"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    Clock,
    Loader2,
    RefreshCw,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FollowUpChatbot from "@/components/situation/FollowUpChatbot";
import { ClarificationAnswer, GuidanceResponse, Suggestion } from "@/types/guidance";

interface Situation {
    id: number;
    title: string;
    primary_domain: string;
    related_domains: string[];
    status: string;
    priority: string;
    created_at: string;
    updated_at?: string | null;
    last_interaction?: string | null;
    clarification_answers?: ClarificationAnswer[];
}

const urgencyMeta: Record<string, { label: string; tone: string; hint: string }> = {
    high: {
        label: "Do now",
        tone: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
        hint: "Time-sensitive or high-impact",
    },
    medium: {
        label: "Do next",
        tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
        hint: "Important, but not immediate",
    },
    low: {
        label: "Can wait",
        tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
        hint: "Optional or lower impact",
    },
};

const confidenceTone: Record<string, string> = {
    high: "text-emerald-600 dark:text-emerald-400",
    medium: "text-amber-600 dark:text-amber-400",
    low: "text-red-600 dark:text-red-400",
};

const sortSuggestions = (suggestions: Suggestion[]): Suggestion[] => {
    const urgencyRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...suggestions].sort((a, b) => {
        const aRank = urgencyRank[(a.urgency || "medium").toLowerCase()] ?? 1;
        const bRank = urgencyRank[(b.urgency || "medium").toLowerCase()] ?? 1;
        if (aRank !== bRank) return aRank - bRank;
        return Number(a.can_skip) - Number(b.can_skip);
    });
};

const formatDate = (value?: string | null) => {
    if (!value) return "Unknown";
    try {
        return new Date(value).toLocaleDateString();
    } catch {
        return "Unknown";
    }
};

export default function SituationPage() {
    const params = useParams();
    const router = useRouter();
    const situationId = params.id as string;

    const [situation, setSituation] = useState<Situation | null>(null);
    const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingGuidance, setLoadingGuidance] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({ 0: true });

    const sortedSuggestions = useMemo(() => {
        if (!guidance) return [];
        return sortSuggestions(guidance.suggestions || []);
    }, [guidance]);

    useEffect(() => {
        const hasSuggestions = (guidance?.suggestions?.length || 0) > 0;
        if (hasSuggestions) {
            setExpandedRows({ 0: true });
        }
    }, [guidance?.suggestions?.length]);

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
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                setError("Failed to load situation.");
                setLoading(false);
                return;
            }

            const data = await res.json();
            const loadedSituation: Situation = data.situation;
            setSituation(loadedSituation);

            const cacheKey = `guidance:${situationId}`;
            const cachedGuidance = sessionStorage.getItem(cacheKey);
            if (cachedGuidance) {
                try {
                    const parsed = JSON.parse(cachedGuidance) as GuidanceResponse;
                    setGuidance(parsed);
                    sessionStorage.removeItem(cacheKey);
                } catch {
                    sessionStorage.removeItem(cacheKey);
                    await loadGuidance(loadedSituation.title, loadedSituation.clarification_answers || [], loadedSituation);
                }
            } else {
                await loadGuidance(loadedSituation.title, loadedSituation.clarification_answers || [], loadedSituation);
            }
        } catch (e) {
            console.error(e);
            setError("Error loading situation.");
        } finally {
            setLoading(false);
        }
    };

    const loadGuidance = async (
        queryText?: string,
        clarificationOverride?: ClarificationAnswer[],
        situationOverride?: Situation
    ) => {
        const currentSituation = situationOverride || situation;
        if (!currentSituation && !queryText) return;

        const token = localStorage.getItem("access_token");
        if (!token) return;

        setLoadingGuidance(true);
        setError(null);

        try {
            const res = await fetch("http://127.0.0.1:8000/guidance/suggestions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: queryText || currentSituation?.title || "",
                    domain: currentSituation?.primary_domain || "General",
                    situation_id: parseInt(situationId),
                    clarification_answers: clarificationOverride || currentSituation?.clarification_answers || [],
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const detail = err?.detail || "Unknown error.";
                setError(`Failed to generate guidance: ${detail}`);
                return;
            }

            const data: GuidanceResponse = await res.json();
            setGuidance(data);
        } catch (e) {
            console.error(e);
            setError("Error getting guidance.");
        } finally {
            setLoadingGuidance(false);
        }
    };

    const toggleRow = (index: number) => {
        setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!situation) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
                    <h2 className="text-xl font-semibold">Situation not found</h2>
                    <button
                        onClick={() => router.push("/home")}
                        className="mt-2 text-sm font-medium text-primary hover:underline"
                    >
                        Go back home
                    </button>
                </div>
            </div>
        );
    }

    const nextAction = sortedSuggestions[0];

    return (
        <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
            <div className="mx-auto w-full max-w-7xl">
                <button
                    onClick={() => router.push("/profile?section=search-history")}
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Search History
                </button>

                <section className="rounded-2xl border-2 border-border bg-card p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold leading-snug md:text-3xl">{situation.title}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                                    {situation.primary_domain}
                                </span>
                                <span className="rounded-full bg-muted px-3 py-1">{situation.priority}</span>
                                <span className="rounded-full bg-muted px-3 py-1">{situation.status}</span>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground md:text-right">
                            <p>Created: {formatDate(situation.created_at)}</p>
                            <p>Updated: {formatDate(situation.updated_at || situation.last_interaction)}</p>
                        </div>
                    </div>

                    {!!situation.related_domains?.length && (
                        <div className="mt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Related Areas
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {situation.related_domains.map((domain) => (
                                    <span key={domain} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                                        {domain}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-8">
                        <div className="rounded-2xl border-2 border-border bg-card p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Guidance Plan
                                    </p>
                                    <h2 className="text-xl font-semibold">Clear next steps for this case</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        No extra search bar. This page is now your action plan + follow-up assistant.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => loadGuidance(situation.title, situation.clarification_answers || [])}
                                        disabled={loadingGuidance}
                                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                                    >
                                        {loadingGuidance ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Refresh plan
                                    </button>
                                    <button
                                        onClick={() => router.push(`/intake/clarify/${situationId}`)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                    >
                                        Update answers
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-900/20">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                                    <div>
                                        <p className="font-semibold text-red-900 dark:text-red-300">Unable to generate guidance</p>
                                        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loadingGuidance && !guidance && (
                            <div className="rounded-2xl border-2 border-border bg-card p-8 text-center">
                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                <p className="mt-3 text-sm text-muted-foreground">Preparing your action plan from official sources...</p>
                            </div>
                        )}

                        {guidance && (
                            <>
                                {nextAction && (
                                    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
                                        <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Start Here
                                        </p>
                                        <h3 className="text-xl font-semibold">{nextAction.title}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">{nextAction.description}</p>
                                        <p className="mt-3 rounded-lg bg-background p-3 text-sm">
                                            <span className="font-semibold">Why it matters:</span> {nextAction.why_it_matters}
                                        </p>
                                    </div>
                                )}

                                <div className="rounded-2xl border-2 border-border bg-card p-6">
                                    <h3 className="mb-4 text-lg font-semibold">Step-by-step action plan</h3>
                                    <div className="space-y-3">
                                        {sortedSuggestions.map((suggestion, index) => {
                                            const urgencyKey = (suggestion.urgency || "medium").toLowerCase();
                                            const urgency = urgencyMeta[urgencyKey] || urgencyMeta.medium;
                                            const isExpanded = !!expandedRows[index];

                                            return (
                                                <div key={`${suggestion.title}-${index}`} className="rounded-xl border border-border bg-background">
                                                    <button
                                                        onClick={() => toggleRow(index)}
                                                        className="flex w-full items-start gap-3 p-4 text-left"
                                                    >
                                                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h4 className="font-semibold">{suggestion.title}</h4>
                                                                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", urgency.tone)}>
                                                                    {urgency.label}
                                                                </span>
                                                                {suggestion.estimated_time && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                                        <Clock className="h-3 w-3" />
                                                                        {suggestion.estimated_time}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 text-xs text-muted-foreground">{urgency.hint}</p>
                                                        </div>
                                                        <ChevronDown
                                                            className={cn("h-5 w-5 text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                                                        />
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                                                            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                                                            <div className="rounded-lg bg-muted/40 p-3 text-sm">
                                                                <span className="font-semibold">Why this step is important:</span> {suggestion.why_it_matters}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                {suggestion.can_skip
                                                                    ? "Optional step. Skip only if it does not apply."
                                                                    : "Core step. Complete this before moving ahead."}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {!!guidance.cross_domain_insights?.length && (
                                    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-900/20">
                                        <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">Cross-domain insights</h3>
                                        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                                            {guidance.cross_domain_insights.map((insight, i) => (
                                                <li key={i}>- {insight}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {!!guidance.caveats?.length && (
                                    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-900/20">
                                        <h3 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-300">Important notes</h3>
                                        <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                                            {guidance.caveats.map((caveat, i) => (
                                                <li key={i}>- {caveat}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <aside className="space-y-6 lg:col-span-4">
                        {guidance && (
                            <div className="rounded-2xl border-2 border-border bg-card p-6">
                                <h3 className="mb-3 font-semibold">Confidence</h3>
                                <div className="flex items-end justify-between">
                                    <p className="text-3xl font-bold">{(guidance.confidence.score * 100).toFixed(0)}%</p>
                                    <p
                                        className={cn(
                                            "text-sm font-semibold capitalize",
                                            confidenceTone[(guidance.confidence.reliability || "medium").toLowerCase()] || confidenceTone.medium
                                        )}
                                    >
                                        {guidance.confidence.reliability}
                                    </p>
                                </div>
                                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-primary transition-all"
                                        style={{ width: `${guidance.confidence.score * 100}%` }}
                                    />
                                </div>
                                <p className="mt-3 text-xs text-muted-foreground">{guidance.confidence.explanation}</p>

                                <div className="mt-4 space-y-2 text-xs">
                                    <div>
                                        <div className="mb-1 flex justify-between">
                                            <span>Model</span>
                                            <span>{(guidance.confidence.breakdown.llm * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded bg-muted">
                                            <div
                                                className="h-1.5 rounded bg-primary/70"
                                                style={{ width: `${guidance.confidence.breakdown.llm * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1 flex justify-between">
                                            <span>Retrieval</span>
                                            <span>{(guidance.confidence.breakdown.retrieval * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded bg-muted">
                                            <div
                                                className="h-1.5 rounded bg-primary/70"
                                                style={{ width: `${guidance.confidence.breakdown.retrieval * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1 flex justify-between">
                                            <span>Historical</span>
                                            <span>{(guidance.confidence.breakdown.historical * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded bg-muted">
                                            <div
                                                className="h-1.5 rounded bg-primary/70"
                                                style={{ width: `${guidance.confidence.breakdown.historical * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {guidance?.sources?.length ? (
                            <div className="rounded-2xl border-2 border-border bg-card p-6">
                                <h3 className="mb-3 font-semibold">Authoritative sources</h3>
                                <div className="space-y-3">
                                    {guidance.sources.map((source, index) => (
                                        <div key={`${source.document_id}-${index}`} className="rounded-lg border border-border p-3">
                                            {source.url && !source.url.startsWith("file://") ? (
                                                <a
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    {source.title}
                                                </a>
                                            ) : (
                                                <p className="text-sm font-medium">{source.title}</p>
                                            )}
                                            <p className="mt-1 text-xs text-muted-foreground">{source.authority}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="rounded-2xl border-2 border-border bg-card p-6">
                            <h3 className="mb-2 flex items-center gap-2 font-semibold">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Verification panel
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Keep these details handy while verifying at official portals or service centers.
                            </p>
                            <div className="mt-3 space-y-2 text-sm">
                                <p>
                                    <span className="text-muted-foreground">Domain:</span> {situation.primary_domain}
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Status:</span> {situation.status}
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Last interaction:</span>{" "}
                                    {formatDate(situation.last_interaction || situation.updated_at)}
                                </p>
                            </div>
                        </div>
                    </aside>
                </section>
            </div>

            <FollowUpChatbot
                domain={situation.primary_domain}
                situationId={situation.id}
                clarificationAnswers={situation.clarification_answers || []}
                onApplyGuidance={(data) => setGuidance(data)}
            />
        </main>
    );
}
