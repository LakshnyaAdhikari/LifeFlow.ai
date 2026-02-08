"use client";

import { CheckCircle, Clock, AlertTriangle, FileText, ArrowRight, Shield, Link as LinkIcon, Download } from "lucide-react";

export default function GuidanceView({
    moduleId,
    issueId,
    intakeData
}: {
    moduleId: string;
    issueId: string;
    intakeData: any
}) {
    // Mock logic based on passed IDs
    const timelineSteps = [
        { title: "Application Submission", duration: "Day 1", status: "pending" },
        { title: "Verification", duration: "Day 3-7", status: "upcoming" },
        { title: "Processing", duration: "Day 15", status: "upcoming" },
        { title: "Dispatched", duration: "Day 20", status: "upcoming" }
    ];

    const requiredDocs = [
        "Proof of Identity (POI) - e.g., Voter ID, Passport",
        "Proof of Address (POA) - e.g., Bank Statement, Electricity Bill",
        "Passport Size Photograph"
    ];

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">

            {/* Header / What Usually Happens */}
            <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
                    <CheckCircle className="w-4 h-4" />
                    <span>Analysis Complete</span>
                </div>
                <h1 className="text-3xl font-bold mb-4">Here is your Personalized Action Plan</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Based on your inputs, we have structured a compliant path to resolve your <strong>{issueId.replace('-', ' ')}</strong> issue.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Action Plan */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Timeline */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Timeline Expectation
                        </h3>
                        <div className="relative">
                            {/* Horizontal Line */}
                            <div className="absolute top-3 left-0 right-0 h-0.5 bg-muted" />
                            <div className="relative flex justify-between">
                                {timelineSteps.map((step, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold z-10 ring-4 ring-background">
                                            {index + 1}
                                        </div>
                                        <div className="mt-4 text-center">
                                            <p className="text-xs font-bold">{step.title}</p>
                                            <p className="text-[10px] text-muted-foreground">{step.duration}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recommended Steps */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Recommended Steps</h3>
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                        {step}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                                            Visit the Official Portal
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Log in to the official government website using your credentials.
                                        </p>
                                        <a href="#" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                                            Open Portal <LinkIcon className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Common Mistakes */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Common Mistakes to Avoid
                        </h3>
                        <ul className="space-y-2">
                            <li className="text-sm text-amber-800 flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-600" />
                                Uploading blurred or low-resolution documents.
                            </li>
                            <li className="text-sm text-amber-800 flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-600" />
                                Mismatch in name spelling across different proofs.
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Right Column: Sidebar */}
                <div className="space-y-6">

                    {/* Required Documents */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Required Documents
                        </h3>
                        <ul className="space-y-3">
                            {requiredDocs.map((doc, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground p-2 bg-muted/30 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{doc}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                            <Download className="w-3 h-3" /> Download Checklist
                        </button>
                    </div>

                    {/* Legal References */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            Legal References
                        </h3>
                        <div className="space-y-3">
                            <div className="text-xs">
                                <p className="font-semibold text-foreground">Aadhaar Act, 2016</p>
                                <a href="#" className="text-primary hover:underline">Section 3: Enrollment</a>
                            </div>
                            <div className="text-xs">
                                <p className="font-semibold text-foreground">Regulation 12</p>
                                <a href="#" className="text-primary hover:underline">UIDAI Circular 2023</a>
                            </div>
                        </div>
                    </div>

                    {/* Escalation */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-sm font-bold mb-2">Need to Escalate?</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            If your request is delayed beyond 30 days.
                        </p>
                        <a href="#" className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors group">
                            <span className="text-xs font-medium">Grievance Portal</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
