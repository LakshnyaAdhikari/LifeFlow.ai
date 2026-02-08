"use client";

import { useState } from "react";
import SmartIntakeWizard from "@/components/services/identity/SmartIntakeWizard";
import GuidanceView from "@/components/services/identity/GuidanceView";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IssuePage({ params }: { params: { moduleId: string; issueId: string } }) {
    const [isIntakeComplete, setIsIntakeComplete] = useState(false);
    const [intakeData, setIntakeData] = useState<any>(null);
    const router = useRouter();

    const handleIntakeComplete = (data: any) => {
        console.log("Intake Data:", data);
        setIntakeData(data);
        setIsIntakeComplete(true);
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="border-b border-border bg-background sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
                    <button
                        onClick={() => {
                            if (isIntakeComplete) {
                                setIsIntakeComplete(false);
                            } else {
                                router.back();
                            }
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {isIntakeComplete ? "Back to Intake" : "Back_to_Services"}
                    </button>
                    <div className="mx-4 h-4 w-px bg-border" />
                    <h1 className="text-sm font-semibold text-foreground">
                        {params.moduleId.toUpperCase()} / {params.issueId.replace(/-/g, " ")}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow p-6 lg:p-12">
                {!isIntakeComplete ? (
                    <SmartIntakeWizard
                        moduleId={params.moduleId}
                        issueId={params.issueId}
                        onComplete={handleIntakeComplete}
                    />
                ) : (
                    <GuidanceView
                        moduleId={params.moduleId}
                        issueId={params.issueId}
                        intakeData={intakeData}
                    />
                )}
            </div>
        </div>
    );
}
