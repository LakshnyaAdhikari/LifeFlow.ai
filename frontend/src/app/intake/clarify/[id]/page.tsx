"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain, SkipForward, CheckCircle2, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

interface ClarificationQuestion {
    id: string;
    text: string;
    type: string;
    options?: string[];
}

interface Situation {
    id: number;
    title: string;
    primary_domain: string;
    clarification_questions?: ClarificationQuestion[];
}

export default function ClarifyPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [situation, setSituation] = useState<Situation | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [showFinalizing, setShowFinalizing] = useState(false);

    useEffect(() => {
        loadSituation();
    }, [params.id]);

    const loadSituation = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/auth/login");
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/situations/${params.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSituation(data.situation);
                // Pre-fill answers if needed? No, start fresh.
            }
        } catch (e) {
            console.error("Failed to load situation:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async (skip: boolean = false) => {
        const token = localStorage.getItem("access_token");
        if (!token || !situation) return;

        setSubmitting(true);
        // Show "Finalizing" UI immediately to mask latency
        setShowFinalizing(true);

        try {
            const clarificationAnswers = skip ? [] : Object.entries(answers).map(([qid, ans]) => ({
                question_id: qid,
                question_text: situation.clarification_questions?.find(q => q.id === qid)?.text || "",
                answer: ans
            }));

            // Trigger RAG Generation
            const res = await fetch("http://127.0.0.1:8000/guidance/suggestions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: situation.title, // Use title/message as query base
                    domain: situation.primary_domain,
                    situation_id: situation.id,
                    clarification_answers: clarificationAnswers
                })
            });

            if (res.ok) {
                // Success! Redirect to dashboard
                router.push(`/situation/${situation.id}`);
            } else {
                console.error("Failed to generate guidance");
                setSubmitting(false);
                setShowFinalizing(false);
                alert("Something went wrong generating guidance. Please try skipping or reloading.");
            }
        } catch (e) {
            console.error("Error submitting answers:", e);
            setSubmitting(false);
            setShowFinalizing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <h2 className="text-xl font-semibold animate-pulse">Analyzing your situation...</h2>
                    <p className="text-muted-foreground">Identifying key details</p>
                </div>
            </div>
        );
    }

    if (showFinalizing) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center space-y-6 max-w-md px-6">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
                        <Brain className="absolute inset-0 m-auto w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Finalizing Your Guidance</h2>
                    <p className="text-muted-foreground text-lg">
                        We are analyzing thousands of government rules to give you the exact steps for <strong>{situation?.primary_domain}</strong>.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-primary/80 bg-primary/5 py-2 px-4 rounded-full">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Consulting official {situation?.primary_domain} sources...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!situation) return <div>Situation not found</div>;

    const questions = situation.clarification_questions || [];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-grow container max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">

                {/* Left: Questions Form */}
                <div className="flex-1 space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Brain className="w-6 h-6" />
                            <span className="font-bold uppercase tracking-wider text-sm">Action Required</span>
                        </div>
                        <h1 className="text-3xl font-bold">We need a few details to get this right.</h1>
                        <p className="text-muted-foreground text-lg">
                            Generic advice is useless. Answering these 2-3 questions allows our AI to check specific rules for your case.
                        </p>
                    </div>

                    <div className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
                        {questions.length > 0 ? questions.map((q) => (
                            <div key={q.id} className="space-y-3">
                                <label className="text-base font-semibold block">
                                    {q.text}
                                </label>

                                {q.type === "choice" && q.options ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {q.options.map(opt => (
                                            <label
                                                key={opt}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                                    answers[q.id] === opt
                                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                        : "border-input hover:border-primary/50"
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value={opt}
                                                    checked={answers[q.id] === opt}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="w-4 h-4 text-primary"
                                                />
                                                <span className="text-sm">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Type your answer here..."
                                        value={answers[q.id] || ""}
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    />
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No specific questions generated. You can proceed directly.
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className="flex-1 bg-primary text-primary-foreground h-12 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            Submit & Get Guidance
                        </button>

                        <button
                            onClick={() => handleSubmit(true)}
                            disabled={submitting}
                            className="px-6 h-12 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-2"
                        >
                            <SkipForward className="w-4 h-4" />
                            Skip for now
                        </button>
                    </div>
                </div>

                {/* Right: Side Panel (Education/Tips) */}
                <div className="w-full md:w-80 space-y-6">
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                        <h3 className="font-bold flex items-center gap-2 mb-4 text-primary">
                            <Info className="w-5 h-5" />
                            Why this matters
                        </h3>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li className="flex gap-2">
                                <span className="bg-background w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0">1</span>
                                <span>Government rules vary purely by <strong>Jurisdiction</strong> and <strong>Category</strong>.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="bg-background w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0">2</span>
                                <span>Generic advice ("File an appeal") fails 90% of the time if you cite the wrong section code.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="bg-background w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0">3</span>
                                <span>Our AI will search <strong>verified government PDFs</strong> based on your answers.</span>
                            </li>
                        </ul>
                    </div>
                </div>

            </main>
        </div>
    );
}
