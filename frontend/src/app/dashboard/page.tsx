"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import Overview from "@/components/dashboard/Overview";
import SituationsTab from "@/components/dashboard/Situations";
import HistoryTab from "@/components/dashboard/History";
import DependentManager from "@/components/dashboard/DependentManager";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function DashboardPage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");

    if (authLoading) return null; // Or a loading spinner

    if (!user) {
        if (typeof window !== "undefined") {
            router.push("/auth/login");
        }
        return null;
    }

    const renderContent = () => {
        switch (activeTab) {
            case "overview": return <Overview user={user} />;
            case "situations": return <SituationsTab />;
            case "history": return <HistoryTab />;
            case "dependents": return <DependentManager />;
            case "documents": return <Placeholder tab="Documents & Records" />;
            case "insights": return <Placeholder tab="Insights & Analytics" />;
            case "personalization": return <Placeholder tab="Personalization Settings" />;
            case "settings": return <Placeholder tab="Account Settings" />;
            default: return <Overview user={user} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex flex-col">
            <Navbar />
            <div className="flex-grow flex max-w-[1600px] mx-auto w-full">
                <DashboardSidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onLogout={logout}
                    user={user}
                />
                <main className="flex-grow p-6 lg:p-12 overflow-x-hidden">
                    <div className="max-w-5xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}

function Placeholder({ tab }: { tab: string }) {
    return (
        <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-bold mb-4">{tab}</h2>
            <div className="p-12 rounded-3xl bg-muted/30 border-2 border-dashed border-border">
                <p className="text-muted-foreground">This feature is coming soon in the production version of LifeFlow v2.</p>
            </div>
        </div>
    );
}
