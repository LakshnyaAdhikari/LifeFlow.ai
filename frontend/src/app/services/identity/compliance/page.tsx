"use client";

import { Link as LinkIcon, CheckCircle, AlertTriangle } from "lucide-react";

export default function CompliancePage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 lg:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <LinkIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Linking & Compliance</h1>
                        <p className="text-muted-foreground">Check the status of your mandatory document linkings.</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* PAN-Aadhaar */}
                    <div className="bg-card border border-border rounded-xl p-6 flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="mt-1">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">PAN-Aadhaar Linking</h3>
                                <p className="text-sm text-muted-foreground">Mandatory for filing tax returns.</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">Linked</span>
                    </div>

                    {/* Bank KYC */}
                    <div className="bg-card border border-border rounded-xl p-6 flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="mt-1">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Bank Account Re-KYC</h3>
                                <p className="text-sm text-muted-foreground">HDFC Bank account requires updated KYC details.</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold hover:bg-amber-200 transition-colors">
                            Update Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
