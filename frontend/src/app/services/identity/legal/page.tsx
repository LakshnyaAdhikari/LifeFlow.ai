"use client";

import { Scale, FileText, ChevronRight } from "lucide-react";

export default function LegalPage() {
    const resources = [
        { title: "Aadhaar Act, 2016", desc: "The foundational legal framework for Aadhaar." },
        { title: "Passport & Travel Documents", desc: "Rules governing passport issuance and impounding." },
        { title: "RTI Act, 2005", desc: "Know your rights to information from public authorities." },
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 lg:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Scale className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">Legal Resources & Escalation</h1>
                </div>

                <div className="grid gap-6 mb-12">
                    <h2 className="text-xl font-bold">Key Acts & Rules</h2>
                    {resources.map((res) => (
                        <div key={res.title} className="group bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors cursor-pointer">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-4">
                                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{res.title}</h3>
                                        <p className="text-sm text-muted-foreground">{res.desc}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
