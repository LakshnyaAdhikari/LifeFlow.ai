"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Clock,
    Flag,
    History,
    Lock,
    Loader2,
    MessageCircleQuestion,
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

type WorkflowStatus = "locked" | "active" | "completed";

interface WorkflowStep {
    id: string;
    title: string;
    description: string;
    status: WorkflowStatus;
    requires_confirmation: boolean;
    help_content?: string;
    why_it_matters: string;
    urgency: string;
    can_skip: boolean;
    estimated_time?: string;
}

interface PreviousInteraction {
    type: string;
    content?: Record<string, unknown>;
    created_at?: string;
}

interface SituationContextPayload {
    completed_steps?: string[];
    previous_interactions?: PreviousInteraction[];
}

interface SituationPayload {
    situation: Situation;
    context?: SituationContextPayload;
}

interface ReadinessItem {
    id: string;
    label: string;
    type: "document" | "permission" | "legal";
    checked: boolean;
}

interface CaseActivityItem {
    id: string;
    event: string;
    at: string;
    type: string;
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

const getSuccessLikelihood = (score: number) => {
    if (score >= 0.75) return "High";
    if (score >= 0.5) return "Moderate";
    return "Limited";
};

const formatDateTime = (value?: string | null) => {
    if (!value) return "Unknown";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return "Unknown";
    }
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80);

const buildWorkflowSteps = (
    suggestions: Suggestion[],
    completedIds: string[],
    completedTitles: string[]
): WorkflowStep[] => {
    const completedIdSet = new Set(completedIds);
    const completedTitleSet = new Set(completedTitles.map((title) => title.toLowerCase()));
    const idCounts: Record<string, number> = {};

    const baseSteps = suggestions.map((suggestion, index) => {
        const baseSlug = slugify(suggestion.title) || `step-${index + 1}`;
        idCounts[baseSlug] = (idCounts[baseSlug] || 0) + 1;
        const id = idCounts[baseSlug] === 1 ? baseSlug : `${baseSlug}-${idCounts[baseSlug]}`;
        const titleKey = suggestion.title.toLowerCase();
        const shouldMarkCompleted = completedIdSet.has(id) || completedTitleSet.has(titleKey);

        return {
            id,
            title: suggestion.title,
            description: suggestion.description,
            status: shouldMarkCompleted ? "completed" : "locked",
            requires_confirmation: !suggestion.can_skip,
            help_content: suggestion.can_skip
                ? "This is optional. If it is slowing you down, continue with the next core step."
                : "Collect required proof and acknowledgement details before continuing. If blocked, use the follow-up chat for case-specific guidance.",
            why_it_matters: suggestion.why_it_matters,
            urgency: suggestion.urgency || "medium",
            can_skip: suggestion.can_skip,
            estimated_time: suggestion.estimated_time,
        } satisfies WorkflowStep;
    });

    return baseSteps.map((step) => {
        if (step.status === "completed") return step;
        return { ...step, status: "active" };
    });
};

const buildReadinessItems = (domain: string, suggestions: Suggestion[]): ReadinessItem[] => {
    const defaults: ReadinessItem[] = [
        { id: "photo-id", label: "Government photo ID proof", type: "document", checked: false },
        { id: "application-ref", label: "Application/reference number", type: "document", checked: false },
        { id: "supporting-proof", label: "Supporting evidence (receipts/screenshots/notices)", type: "document", checked: false },
        { id: "consent-auth", label: "Authorization/consent where required", type: "permission", checked: false },
        { id: "deadline-note", label: "Any legal or portal deadline noted", type: "legal", checked: false },
    ];

    const domainLower = domain.toLowerCase();
    if (domainLower.includes("identity")) {
        defaults.push(
            { id: "address-proof", label: "Address proof (recent and valid)", type: "document", checked: false },
            { id: "mobile-linked", label: "Mobile number linked for OTP flows", type: "permission", checked: false }
        );
    }

    const derivedFromGuidance = suggestions.slice(0, 3).map((suggestion, index) => ({
        id: `guidance-${index + 1}`,
        label: `For step "${suggestion.title}", keep required form/details ready`,
        type: "legal" as const,
        checked: false,
    }));

    return [...defaults, ...derivedFromGuidance];
};

const buildCaseActivityItems = (interactions: PreviousInteraction[]): CaseActivityItem[] => {
    return interactions.map((item, index) => {
        const summaryRaw = item.content?.summary;
        const stepTitleRaw = item.content?.step_title;
        const summary =
            typeof summaryRaw === "string"
                ? summaryRaw
                : typeof stepTitleRaw === "string"
                  ? `Completed step: ${stepTitleRaw}`
                  : `${item.type} recorded`;

        return {
            id: `activity-${index}-${item.created_at || "na"}`,
            event: summary,
            at: item.created_at || new Date().toISOString(),
            type: item.type,
        };
    });
};

export default function SituationPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const situationId = params.id as string;
    const source = searchParams.get("source") || "home";

    const [situation, setSituation] = useState<Situation | null>(null);
    const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingGuidance, setLoadingGuidance] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
    const [completedStepIdsFromDb, setCompletedStepIdsFromDb] = useState<string[]>([]);
    const [completedStepTitlesFromDb, setCompletedStepTitlesFromDb] = useState<string[]>([]);
    const [completedMessages, setCompletedMessages] = useState<Record<string, string>>({});
    const [confirmationAnswers, setConfirmationAnswers] = useState<Record<string, "yes" | "not_yet" | undefined>>({});
    const [correctionGuidance, setCorrectionGuidance] = useState<Record<string, string>>({});
    const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
    const [savingStepId, setSavingStepId] = useState<string | null>(null);
    const [readinessOpen, setReadinessOpen] = useState(true);
    const [activityOpen, setActivityOpen] = useState(true);
    const [readinessItems, setReadinessItems] = useState<ReadinessItem[]>([]);
    const [caseActivities, setCaseActivities] = useState<CaseActivityItem[]>([]);
    const [sessionExpired, setSessionExpired] = useState(false);
    const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const sortedSuggestions = useMemo(() => {
        if (!guidance) return [];
        return sortSuggestions(guidance.suggestions || []);
    }, [guidance]);

    const handleSessionExpired = useCallback((detail?: string) => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_id");
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setSessionExpired(true);
        setError(detail || "Session expired. Please log in again.");
        router.push(`/auth/login?next=/situation/${situationId}`);
    }, [router, situationId]);

    const loadGuidance = useCallback(async (
        params?: {
            queryText?: string;
            clarificationOverride?: ClarificationAnswer[];
            baseSituation?: Situation;
        }
    ) => {
        const queryText = params?.queryText;
        const clarificationOverride = params?.clarificationOverride;
        const currentSituation = params?.baseSituation;
        if (!currentSituation && !queryText) return;

        const token = localStorage.getItem("access_token");
        if (!token) {
            handleSessionExpired("Session expired. Please log in again.");
            return;
        }

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
                if (res.status === 401) {
                    handleSessionExpired(typeof detail === "string" ? detail : "Session expired. Please log in again.");
                    return;
                }
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
    }, [handleSessionExpired, situationId]);

    const loadSituation = useCallback(async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            handleSessionExpired("Session expired. Please log in again.");
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/situations/${situationId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    const err = await res.json().catch(() => ({}));
                    const detail = err?.detail;
                    handleSessionExpired(typeof detail === "string" ? detail : "Session expired. Please log in again.");
                    setLoading(false);
                    return;
                }
                setError("Failed to load situation.");
                setLoading(false);
                return;
            }

            const data: SituationPayload = await res.json();
            const loadedSituation: Situation = data.situation;
            setSituation(loadedSituation);

            const interactions = data.context?.previous_interactions || [];
            const completedStepIds = new Set<string>();
            const completedStepTitles = new Set<string>(data.context?.completed_steps || []);
            const dbMessages: Record<string, string> = {};

            interactions
                .filter((item) => item.type === "step_completed")
                .forEach((item) => {
                    const content = item.content || {};
                    const stepId = typeof content.step_id === "string" ? content.step_id : "";
                    const stepTitle = typeof content.step_title === "string" ? content.step_title : "";
                    const confirmationMessage =
                        typeof content.confirmation_message === "string"
                            ? content.confirmation_message
                            : "Step completed and logged.";

                    if (stepId) {
                        completedStepIds.add(stepId);
                        dbMessages[stepId] = confirmationMessage;
                    }
                    if (stepTitle) {
                        completedStepTitles.add(stepTitle);
                    }
                });

            setCompletedStepIdsFromDb([...completedStepIds]);
            setCompletedStepTitlesFromDb([...completedStepTitles]);
            setCompletedMessages(dbMessages);
            setCaseActivities(buildCaseActivityItems(interactions));

            const cacheKey = `guidance:${situationId}`;
            const cachedGuidance = sessionStorage.getItem(cacheKey);
            if (cachedGuidance) {
                try {
                    const parsed = JSON.parse(cachedGuidance) as GuidanceResponse;
                    setGuidance(parsed);
                    sessionStorage.removeItem(cacheKey);
                } catch {
                    sessionStorage.removeItem(cacheKey);
                    await loadGuidance({
                        queryText: loadedSituation.title,
                        clarificationOverride: loadedSituation.clarification_answers || [],
                        baseSituation: loadedSituation
                    });
                }
            } else {
                await loadGuidance({
                    queryText: loadedSituation.title,
                    clarificationOverride: loadedSituation.clarification_answers || [],
                    baseSituation: loadedSituation
                });
            }
        } catch (e) {
            console.error(e);
            setError("Error loading situation.");
        } finally {
            setLoading(false);
        }
    }, [handleSessionExpired, loadGuidance, situationId]);

    useEffect(() => {
        loadSituation();
    }, [loadSituation]);

    useEffect(() => {
        if (!sortedSuggestions.length) {
            setWorkflowSteps([]);
            return;
        }

        const initialSteps = buildWorkflowSteps(
            sortedSuggestions,
            completedStepIdsFromDb,
            completedStepTitlesFromDb
        );
        setWorkflowSteps(initialSteps);
    }, [sortedSuggestions, completedStepIdsFromDb, completedStepTitlesFromDb]);

    useEffect(() => {
        if (!situation || !guidance) return;
        setReadinessItems(buildReadinessItems(situation.primary_domain, sortedSuggestions));
    }, [guidance, situation, sortedSuggestions]);

    const persistWorkflowStep = useCallback(
        async (completedStep: WorkflowStep, updatedSteps: WorkflowStep[]) => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                handleSessionExpired("Session expired. Please log in again.");
                return;
            }

            const completedTitles = updatedSteps
                .filter((step) => step.status === "completed")
                .map((step) => step.title);
            const pendingTitles = updatedSteps
                .filter((step) => step.status !== "completed")
                .map((step) => step.title);
            const confirmationMessage = `Completed and verified at ${new Date().toLocaleString()}`;

            setSavingStepId(completedStep.id);
            try {
                const res = await fetch(`http://127.0.0.1:8000/situations/${situationId}/update`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        interaction_type: "step_completed",
                        content: {
                            summary: `Completed step: ${completedStep.title}`,
                            step_id: completedStep.id,
                            step_title: completedStep.title,
                            confirmation_message: confirmationMessage,
                        },
                        updates: {
                            completed_steps: completedTitles,
                            pending_steps: pendingTitles,
                        },
                    }),
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        handleSessionExpired("Session expired. Please log in again.");
                        return;
                    }
                    const err = await res.json().catch(() => ({}));
                    throw new Error(typeof err.detail === "string" ? err.detail : "Failed to persist step update.");
                }

                setCompletedMessages((prev) => ({
                    ...prev,
                    [completedStep.id]: confirmationMessage,
                }));
                setCompletedStepIdsFromDb((prev) => (prev.includes(completedStep.id) ? prev : [...prev, completedStep.id]));
                setCompletedStepTitlesFromDb((prev) =>
                    prev.includes(completedStep.title) ? prev : [...prev, completedStep.title]
                );
                setCaseActivities((prev) => [
                    {
                        id: `activity-local-${completedStep.id}-${Date.now()}`,
                        event: `Completed step: ${completedStep.title}`,
                        at: new Date().toISOString(),
                        type: "step_completed",
                    },
                    ...prev,
                ]);
            } catch (persistError) {
                const message = persistError instanceof Error ? persistError.message : "Failed to save step progress.";
                setError(message);
            } finally {
                setSavingStepId(null);
            }
        },
        [handleSessionExpired, situationId]
    );

    const handleCompleteStep = useCallback(
        async (stepId: string) => {
            const activeStep = workflowSteps.find((step) => step.id === stepId && step.status === "active");
            if (!activeStep) return;

            if (activeStep.requires_confirmation) {
                const answer = confirmationAnswers[stepId];
                if (!answer) {
                    setCorrectionGuidance((prev) => ({
                        ...prev,
                        [stepId]: "Please confirm whether you received the acknowledgement number before completing this step.",
                    }));
                    return;
                }

                if (answer === "not_yet") {
                    setCorrectionGuidance((prev) => ({
                        ...prev,
                        [stepId]:
                            "Do this before continuing: revisit the authority portal or service desk, request an acknowledgement/receipt number, and keep a screenshot or copy for records.",
                    }));
                    return;
                }
            }

            setCorrectionGuidance((prev) => ({ ...prev, [stepId]: "" }));

            const currentIndex = workflowSteps.findIndex((step) => step.id === stepId);
            const updatedSteps = workflowSteps.map((step) => {
                if (step.id === stepId) return { ...step, status: "completed" as const };
                return step;
            });

            setWorkflowSteps(updatedSteps);

            const completed = updatedSteps.find((step) => step.id === stepId);
            if (completed) {
                await persistWorkflowStep(completed, updatedSteps);
            }

            const nextActive =
                updatedSteps.slice(currentIndex + 1).find((step) => step.status === "active") ||
                updatedSteps.find((step) => step.status === "active");
            if (nextActive) {
                setTimeout(() => {
                    stepRefs.current[nextActive.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 120);
            }
        },
        [confirmationAnswers, persistWorkflowStep, workflowSteps]
    );

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
    const successLikelihood = guidance ? getSuccessLikelihood(guidance.confidence.score) : "Unknown";

    return (
        <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
            <div className="mx-auto w-full max-w-7xl">
                <button
                    onClick={() => {
                        if (source === "search_history") {
                            router.push("/profile?section=search-history");
                        } else {
                            router.push("/home");
                        }
                    }}
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {source === "search_history" ? "Back to Search History" : "Back to Home"}
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
                                        onClick={() =>
                                            loadGuidance({
                                                queryText: situation.title,
                                                clarificationOverride: situation.clarification_answers || [],
                                                baseSituation: situation
                                            })
                                        }
                                        disabled={loadingGuidance}
                                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                                    >
                                        {loadingGuidance ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Refresh plan
                                    </button>
                                    <button
                                        onClick={() => router.push(`/intake/clarify/${situationId}`)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                                    >
                                        Review answers
                                    </button>
                                    <button
                                        onClick={() => router.push(`/intake/clarify/${situationId}`)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                    >
                                        Not matching your case?
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
                                            <span className="font-semibold">Why this is suggested:</span> {nextAction.why_it_matters}
                                        </p>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-lg border border-border bg-background p-3">
                                                <p className="text-xs text-muted-foreground">Next best action</p>
                                                <p className="mt-1 text-sm font-semibold">{nextAction.title}</p>
                                            </div>
                                            <div className="rounded-lg border border-border bg-background p-3">
                                                <p className="text-xs text-muted-foreground">Expected time</p>
                                                <p className="mt-1 text-sm font-semibold">
                                                    {nextAction.estimated_time || "Depends on case and service window"}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-border bg-background p-3">
                                                <p className="text-xs text-muted-foreground">Success likelihood</p>
                                                <p className="mt-1 text-sm font-semibold">
                                                    {successLikelihood} ({guidance ? (guidance.confidence.score * 100).toFixed(0) : "0"}%)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl border-2 border-border bg-card p-6">
                                    <button
                                        onClick={() => setReadinessOpen((prev) => !prev)}
                                        className="flex w-full items-center justify-between text-left"
                                    >
                                        <div>
                                            <h3 className="flex items-center gap-2 text-lg font-semibold">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                                What to Keep Ready
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Documents, permissions, and legal checklist for this guidance.
                                            </p>
                                        </div>
                                        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", readinessOpen && "rotate-180")} />
                                    </button>

                                    {readinessOpen && (
                                        <div className="mt-4 space-y-3 border-t border-border pt-4">
                                            <div className="space-y-2">
                                                {readinessItems.map((item) => (
                                                    <label
                                                        key={item.id}
                                                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={item.checked}
                                                            onChange={() =>
                                                                setReadinessItems((prev) =>
                                                                    prev.map((existing) =>
                                                                        existing.id === item.id
                                                                            ? { ...existing, checked: !existing.checked }
                                                                            : existing
                                                                    )
                                                                )
                                                            }
                                                            className="mt-0.5 h-4 w-4 accent-primary"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-sm">{item.label}</p>
                                                            <p className="mt-0.5 text-xs capitalize text-muted-foreground">{item.type}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                            <a
                                                href={`/report?from=home&situation_id=${situation.id}`}
                                                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                                            >
                                                <Flag className="h-4 w-4" />
                                                Raise issue under guidance
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-2xl border-2 border-border bg-card p-6">
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-semibold">Step-by-step action plan</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Progress: {workflowSteps.filter((step) => step.status === "completed").length} of {workflowSteps.length} steps completed
                                        </p>
                                    </div>
                                    <div className="ml-3 space-y-3 border-l-2 border-border pl-4">
                                        {workflowSteps.map((step, index) => {
                                            const urgencyKey = (step.urgency || "medium").toLowerCase();
                                            const urgency = urgencyMeta[urgencyKey] || urgencyMeta.medium;
                                            const isCompleted = step.status === "completed";
                                            const isActive = step.status === "active";
                                            const isLocked = step.status === "locked";
                                            const confirmation = confirmationAnswers[step.id];
                                            const confirmationMessage = completedMessages[step.id] || "Step completed and added to your timeline.";

                                            return (
                                                <div
                                                    key={step.id}
                                                    ref={(el) => {
                                                        stepRefs.current[step.id] = el;
                                                    }}
                                                    className={cn(
                                                        "rounded-xl border bg-background transition-all",
                                                        isActive && "border-primary/50 shadow-sm",
                                                        isCompleted && "border-emerald-300 dark:border-emerald-800",
                                                        isLocked && "border-border opacity-70"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3 p-4">
                                                        <div
                                                            className={cn(
                                                                "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                                                isCompleted && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                                                                isActive && "bg-primary/10 text-primary",
                                                                isLocked && "bg-muted text-muted-foreground"
                                                            )}
                                                        >
                                                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : isLocked ? <Lock className="h-3.5 w-3.5" /> : index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h4 className="font-semibold">{step.title}</h4>
                                                                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", urgency.tone)}>
                                                                    {urgency.label}
                                                                </span>
                                                                {step.estimated_time && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                                        <Clock className="h-3 w-3" />
                                                                        {step.estimated_time}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 text-xs text-muted-foreground">{urgency.hint}</p>
                                                            {isCompleted && (
                                                                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{confirmationMessage}</p>
                                                            )}
                                                            {isLocked && (
                                                                <p className="mt-2 text-xs text-muted-foreground">Complete the current active step to unlock this.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isActive && (
                                                        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                                                            <p className="text-sm text-muted-foreground">{step.description}</p>
                                                            <div className="rounded-lg bg-muted/40 p-3 text-sm">
                                                                <span className="font-semibold">Why this is suggested:</span> {step.why_it_matters}
                                                            </div>

                                                            {step.requires_confirmation && (
                                                                <div className="rounded-lg border border-border p-3">
                                                                    <p className="text-sm font-medium">Did you receive acknowledgement number?</p>
                                                                    <div className="mt-2 flex gap-2">
                                                                        <button
                                                                            onClick={() =>
                                                                                setConfirmationAnswers((prev) => ({ ...prev, [step.id]: "yes" }))
                                                                            }
                                                                            className={cn(
                                                                                "rounded-md border px-3 py-1.5 text-sm",
                                                                                confirmation === "yes"
                                                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                                                                    : "border-border hover:bg-muted"
                                                                            )}
                                                                        >
                                                                            Yes
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                setConfirmationAnswers((prev) => ({ ...prev, [step.id]: "not_yet" }))
                                                                            }
                                                                            className={cn(
                                                                                "rounded-md border px-3 py-1.5 text-sm",
                                                                                confirmation === "not_yet"
                                                                                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                                                                                    : "border-border hover:bg-muted"
                                                                            )}
                                                                        >
                                                                            Not yet
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {!!correctionGuidance[step.id] && (
                                                                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                                                                    {correctionGuidance[step.id]}
                                                                </div>
                                                            )}

                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => handleCompleteStep(step.id)}
                                                                    disabled={savingStepId === step.id}
                                                                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                                                                >
                                                                    {savingStepId === step.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                    Mark as Done
                                                                </button>
                                                                <button
                                                                    onClick={() => setHelpOpen((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
                                                                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                                                                >
                                                                    <MessageCircleQuestion className="h-4 w-4" />
                                                                    Need help with this step?
                                                                </button>
                                                            </div>

                                                            {helpOpen[step.id] && (
                                                                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                                                                    {step.help_content || "Use follow-up chat to ask what documents, timings, or portal actions are required before marking this step complete."}
                                                                </div>
                                                            )}

                                                            {!!guidance.sources?.length && (
                                                                <div className="rounded-lg border border-border p-3">
                                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                        Referenced sources
                                                                    </p>
                                                                    <div className="space-y-1">
                                                                        {guidance.sources.slice(0, 2).map((source, srcIndex) => (
                                                                            <div key={`${step.id}-src-${srcIndex}`} className="text-xs">
                                                                                {source.url && !source.url.startsWith("file://") ? (
                                                                                    <a
                                                                                        href={source.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="font-medium text-primary hover:underline"
                                                                                    >
                                                                                        {source.title}
                                                                                    </a>
                                                                                ) : (
                                                                                    <span className="font-medium">{source.title}</span>
                                                                                )}
                                                                                <p className="text-muted-foreground">{source.authority}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                {step.can_skip ? "Marked optional by the model." : "Marked core for progress."}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="rounded-2xl border-2 border-border bg-card p-6">
                                    <button
                                        onClick={() => setActivityOpen((prev) => !prev)}
                                        className="flex w-full items-center justify-between text-left"
                                    >
                                        <div>
                                            <h3 className="flex items-center gap-2 text-lg font-semibold">
                                                <History className="h-4 w-4 text-primary" />
                                                Case Activity
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Maintained timeline of actions taken and when they happened.
                                            </p>
                                        </div>
                                        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", activityOpen && "rotate-180")} />
                                    </button>

                                    {activityOpen && (
                                        <div className="mt-4 border-t border-border pt-4">
                                            {caseActivities.length ? (
                                                <div className="ml-2 space-y-3 border-l-2 border-border pl-4">
                                                    {caseActivities
                                                        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                                                        .map((activity) => (
                                                            <div key={activity.id} className="relative rounded-lg border border-border bg-background p-3">
                                                                <div className="absolute -left-[22px] top-4 h-2.5 w-2.5 rounded-full bg-primary" />
                                                                <p className="text-sm font-medium">{activity.event}</p>
                                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                    <span>{formatDateTime(activity.at)}</span>
                                                                    <span className="rounded bg-muted px-1.5 py-0.5 uppercase">{activity.type}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                                                    No case activity yet. Complete a step to start the timeline.
                                                </div>
                                            )}
                                        </div>
                                    )}
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

                    <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-6 self-start">
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

                        <div className="rounded-2xl border-2 border-border bg-card p-6">
                            <h3 className="mb-3 font-semibold">Authoritative sources</h3>
                            {guidance?.sources?.length ? (
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
                            ) : (
                                <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                                    {sessionExpired
                                        ? "Session expired. Log in again to load source links."
                                        : "No source links available yet. Try Refresh plan after guidance loads."}
                                </div>
                            )}
                        </div>

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
