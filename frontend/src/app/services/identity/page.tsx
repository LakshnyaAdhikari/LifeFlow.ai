"use client";

import IdentityHero from "@/components/services/identity/IdentityHero";
import ModuleGrid from "@/components/services/identity/ModuleGrid";

export default function IdentityPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            <IdentityHero />

            <div className="flex-grow p-6 lg:p-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2">Select Your Document</h2>
                        <p className="text-muted-foreground">Choose the document you need help with to start the guided process.</p>
                    </div>

                    <ModuleGrid />

                    {/* Additional Resources Section */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-900 mb-2">Professional Assistance</h3>
                            <p className="text-sm text-blue-700/80 mb-4">
                                Need a lawyer or agent to handle this for you? We can connect you with verified professionals.
                            </p>
                            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                                Find a professional &rarr;
                            </button>
                        </div>
                        <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                            <h3 className="text-lg font-bold text-amber-900 mb-2">Report Lost Identity</h3>
                            <p className="text-sm text-amber-700/80 mb-4">
                                If your documents were stolen or lost, immediate action is required to prevent misuse.
                            </p>
                            <button className="text-sm font-semibold text-amber-600 hover:text-amber-800 hover:underline">
                                Start urgent report &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
