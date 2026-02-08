"use client";

import { PlusCircle } from "lucide-react";

export default function StartRequestPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 lg:p-12">
            <div className="max-w-4xl mx-auto text-center py-20">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PlusCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Start a New Request</h1>
                <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                    Select a service from the main overview to begin a guided intake process for your identity documents.
                </p>
                <a
                    href="/services/identity"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                    Go to Overview
                </a>
            </div>
        </div>
    );
}
