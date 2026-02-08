"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Calendar, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntakeStep {
    id: string;
    question: string;
    type: "options" | "date" | "boolean" | "text";
    options?: string[];
}

const GENERIC_INTAKE_STEPS: IntakeStep[] = [
    {
        id: "context",
        question: "What specific problem are you facing with this document?",
        type: "options",
        options: [
            "I never received it",
            "It has incorrect details",
            "It was lost or stolen",
            "It is damaged / not readable",
            "I need to update it"
        ]
    },
    {
        id: "timing",
        question: "When did you first notice this issue?",
        type: "options",
        options: [
            "Just today",
            "Within the last week",
            "More than a month ago",
            "Years ago"
        ]
    },
    {
        id: "attempted",
        question: "Have you already applied for a correction or replacement?",
        type: "boolean"
    },
    {
        id: "urgency",
        question: "Is this urgent? (e.g., needed for travel, admission, or bank KYC)",
        type: "boolean"
    }
];

export default function SmartIntakeWizard({
    moduleId,
    issueId,
    onComplete
}: {
    moduleId: string;
    issueId: string;
    onComplete: (data: any) => void;
}) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const currentStep = GENERIC_INTAKE_STEPS[currentStepIndex];

    const handleAnswer = (answer: any) => {
        const newAnswers = { ...answers, [currentStep.id]: answer };
        setAnswers(newAnswers);

        if (currentStepIndex < GENERIC_INTAKE_STEPS.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            onComplete(newAnswers);
        }
    };

    const progress = ((currentStepIndex + 1) / GENERIC_INTAKE_STEPS.length) * 100;

    return (
        <div className="max-w-2xl mx-auto py-12">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    <span>Intake Progress</span>
                    <span>Step {currentStepIndex + 1} of {GENERIC_INTAKE_STEPS.length}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <h3 className="text-2xl font-bold mb-8 animate-in fade-in slide-in-from-bottom-2">
                    {currentStep.question}
                </h3>

                <div className="space-y-4">
                    {currentStep.type === "options" && currentStep.options?.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleAnswer(option)}
                            className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                        >
                            <span className="font-medium group-hover:text-primary">{option}</span>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                    ))}

                    {currentStep.type === "boolean" && (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleAnswer(true)}
                                className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center group"
                            >
                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                                <span className="font-bold block group-hover:text-primary">Yes</span>
                            </button>
                            <button
                                onClick={() => handleAnswer(false)}
                                className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center group"
                            >
                                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                                <span className="font-bold block group-hover:text-primary">No</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                        disabled={currentStepIndex === 0}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <span className="text-xs text-muted-foreground">
                        Pressing an option auto-advances
                    </span>
                </div>
            </div>
        </div>
    );
}
