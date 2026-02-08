"use client";

import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    MessageSquare,
    History,
    FileText,
    Users,
    BarChart3,
    Palette,
    Settings,
    LogOut,
    UserCircle,
    ChevronRight,
} from "lucide-react";

interface SidebarItemProps {
    icon: any;
    label: string;
    isActive?: boolean;
    onClick: () => void;
    isMobile?: boolean;
}

function SidebarItem({ icon: Icon, label, isActive, onClick, isMobile }: SidebarItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-primary/70 group-hover:text-primary")} />
                <span className="text-sm font-semibold">{label}</span>
            </div>
            {isActive && !isMobile && <ChevronRight className="w-4 h-4" />}
        </button>
    );
}

interface DashboardSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onLogout: () => void;
    user: any;
}

export default function DashboardSidebar({ activeTab, onTabChange, onLogout, user }: DashboardSidebarProps) {
    const navItems = [
        { id: "overview", label: "Personal Overview", icon: LayoutDashboard },
        { id: "situations", label: "My Situations", icon: MessageSquare },
        { id: "history", label: "Past Guidance", icon: History },
        { id: "documents", label: "Documents & Records", icon: FileText },
        { id: "dependents", label: "Dependents", icon: Users },
        { id: "insights", label: "Insights & Analytics", icon: BarChart3 },
    ];

    const settingItems = [
        { id: "personalization", label: "Personalization", icon: Palette },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <aside className="w-[280px] h-screen sticky top-0 bg-card border-r border-border flex flex-col p-6 hidden lg:flex">
            {/* Profile Summary Card */}
            <div className="mb-10 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserCircle className="w-8 h-8" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold truncate">{user?.full_name || "Guest User"}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.phone || "No phone linked"}</p>
                </div>
            </div>

            {/* Navigation Sections */}
            <div className="flex-grow space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                <div>
                    <h5 className="px-4 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-4">
                        Main Dashboard
                    </h5>
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <SidebarItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={activeTab === item.id}
                                onClick={() => onTabChange(item.id)}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h5 className="px-4 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-4">
                        Account & Tools
                    </h5>
                    <div className="space-y-1">
                        {settingItems.map((item) => (
                            <SidebarItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={activeTab === item.id}
                                onClick={() => onTabChange(item.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <div className="mt-8 pt-6 border-t border-border">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-bold">Logout</span>
                </button>
            </div>
        </aside>
    );
}
