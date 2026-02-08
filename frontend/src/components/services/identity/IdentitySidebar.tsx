"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, PlusCircle, Clock, Link as LinkIcon, Scale, HelpCircle, LifeBuoy } from "lucide-react";

const NAV_ITEMS = [
    { label: "Overview", href: "/services/identity", icon: LayoutDashboard },
    { label: "My Documents", href: "/services/identity/documents", icon: FileText },
    { label: "Start a Request", href: "/services/identity/request", icon: PlusCircle },
    { label: "Ongoing Cases", href: "/services/identity/cases", icon: Clock },
    { label: "Linking & Compliance", href: "/services/identity/compliance", icon: LinkIcon },
    { label: "Legal & Escalation", href: "/services/identity/legal", icon: Scale },
    { label: "FAQs", href: "/services/identity/faq", icon: HelpCircle },
    { label: "Support", href: "/services/identity/support", icon: LifeBuoy },
];

export default function IdentitySidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 flex-shrink-0 border-r border-border bg-card hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-6">
                <h2 className="text-lg font-bold mb-4 px-2">Identity Services</h2>
                <nav className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Quick Status */}
                <div className="mt-8 px-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                        Identity Health
                    </h3>
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold">Profile Strength</span>
                            <span className="text-sm font-bold text-primary">85%</span>
                        </div>
                        <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[85%] rounded-full" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            2 documents pending verification.
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
