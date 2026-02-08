"use client";

import { Clock, MessageSquare } from "lucide-react";

export default function OngoingCasesPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 lg:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Clock className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">Ongoing Cases</h1>
                </div>

                <div className="bg-muted/30 border-2 border-dashed border-border rounded-xl p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold mb-2">No Active Cases</h3>
                    <p className="text-muted-foreground mb-6">
                        You don't have any ongoing identity service requests at the moment.
                    </p>
                    <a
                        href="/services/identity"
                        className="text-primary font-bold hover:underline"
                    >
                        Start a new request &rarr;
                    </a>
                </div>
            </div>
        </div>
    );
}
