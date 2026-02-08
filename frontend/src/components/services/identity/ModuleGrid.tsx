"use client";

import { useState } from "react";
import { IDENTITY_MODULES, DocumentModule } from "@/data/identity_modules";
import { ChevronRight, Fingerprint, CreditCard, Globe, Vote, Car, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Map string icon names to Lucide components
const iconMap: Record<string, any> = {
    "Fingerprint": Fingerprint,
    "CreditCard": CreditCard,
    "Globe": Globe,
    "Vote": Vote,
    "Car": Car
};

export default function ModuleGrid() {
    const router = useRouter();
    const [selectedModule, setSelectedModule] = useState<string | null>(null);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {IDENTITY_MODULES.map((module) => {
                const Icon = iconMap[module.icon] || AlertCircle;
                const isSelected = selectedModule === module.id;

                return (
                    <div
                        key={module.id}
                        className={cn(
                            "group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer bg-card hover:shadow-lg",
                            isSelected ? "border-primary ring-2 ring-primary/20 shadow-lg scale-[1.02]" : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedModule(isSelected ? null : module.id)}
                    >
                        {/* Card Header */}
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn(
                                    "p-3 rounded-xl transition-colors",
                                    isSelected ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary/5 text-primary group-hover:bg-primary/10"
                                )}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                    isSelected ? "bg-primary/10 text-primary rotate-90" : "bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary"
                                )}>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{module.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
                        </div>

                        {/* Expandable Sub-issues */}
                        <div className={cn(
                            "bg-muted/30 border-t border-dashed border-border transition-all duration-300 ease-in-out",
                            isSelected ? "max-h-[500px] opacity-100 p-4" : "max-h-0 opacity-0 overflow-hidden"
                        )}>
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">Select Issue</p>
                                {module.subIssues.map((issue) => (
                                    <button
                                        key={issue.id}
                                        className="w-full text-left p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-border transition-all flex items-center justify-between group/issue"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/services/identity/${module.id}/${issue.id}`);
                                        }}
                                    >
                                        <div>
                                            <span className="text-sm font-semibold text-foreground group-hover/issue:text-primary">{issue.title}</span>
                                            {issue.isUrgent && (
                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                                                    Urgent
                                                </span>
                                            )}
                                        </div>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover/issue:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
