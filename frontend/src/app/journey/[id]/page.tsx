"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, Circle, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { JourneyStep } from "@/types/api";

export default function JourneyPage() {
    const params = useParams();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [steps, setSteps] = useState<JourneyStep[]>([]);
    const [error, setError] = useState("");

    const fetchJourney = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/workflows/${id}/journey_map`);
            if (!res.ok) throw new Error("Failed to load journey");
            const data = await res.json();
            setSteps(data.steps);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchJourney();
    }, [id]);

    const handleSubmit = async (nodeId: string) => {
        try {
            // Mock evidence payload
            const payload = {
                evidence_type: "UserConfirmation",
                data: { doc_id: "mock_doc_123", notes: "User clicked done" }
            };

            const res = await fetch(`http://127.0.0.1:8000/workflows/${id}/steps/${nodeId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Refresh
                fetchJourney();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (e) {
            alert("Failed to submit");
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="flex h-screen items-center justify-center text-destructive">Error: {error}</div>;

    return (
        <main className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto space-y-12">

                <header className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Your Journey</div>
                    <h1 className="text-3xl font-serif text-foreground">Death in Family</h1>
                    <p className="text-muted-foreground">We are here to guide you through each step. Take your time.</p>
                </header>

                <div className="relative border-l-2 border-primary/20 ml-3 md:ml-6 space-y-12 pb-12">
                    {steps.map((step, index) => {
                        const isCompleted = step.state === "COMPLETED";
                        const isEligible = step.state === "ELIGIBLE" || step.state === "PENDING";

                        return (
                            <div key={step.id} className="relative pl-8 md:pl-12 group">
                                {/* Timeline Dot */}
                                <div className={cn(
                                    "absolute -left-[9px] top-6 w-5 h-5 rounded-full border-4 border-background transition-colors duration-500",
                                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                                )} />

                                <div className={cn(
                                    "rounded-2xl border p-6 transition-all duration-300",
                                    step.suggestion_level === "critical" ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10" : "bg-card border-border",
                                    "hover:shadow-md"
                                )}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-medium">{step.layman.title}</h3>
                                        {step.reassurance?.time_expectation && (
                                            <span className="flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {step.reassurance.time_expectation}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        {step.layman.description}
                                    </p>

                                    {/* Reassurance Metadata */}
                                    {step.reassurance && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {step.reassurance.risk_if_skipped === "High" && (
                                                <span className="text-xs flex items-center text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                                                    <AlertTriangle className="w-3 h-3 mr-1" /> Important
                                                </span>
                                            )}
                                            {step.reassurance.value_prop && (
                                                <span className="text-xs text-primary bg-primary/5 px-2 py-1 rounded">
                                                    Why: {step.reassurance.value_prop}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Area */}
                                    <div className="flex items-center justify-end pt-4 border-t border-border/50">
                                        {isCompleted ? (
                                            <div className="flex items-center text-primary font-medium">
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                {step.layman.action_label || "Completed"}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleSubmit(step.id)}
                                                className="flex items-center text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                                            >
                                                {step.layman.action_label || "Mark as Done"}
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </button>
                                        )}
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </main>
    );
}
