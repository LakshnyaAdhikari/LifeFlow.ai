"use client";

import { useState } from "react";
import { Menu, X, User, History, Heart, FileText, Lock, Trash2, Settings, LogOut, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import AccountDetails from "./sections/AccountDetails";
import SearchHistory from "./sections/SearchHistory";
import StarredChats from "./sections/StarredChats";
import Documents from "./sections/Documents";
import ChangePassword from "./sections/ChangePassword";
import DeleteAccountComponent from "./sections/DeleteAccount";
import SettingsComponent from "./sections/Settings";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

interface ProfileMenuProps {
    userName: string;
    initialSection?: string;
}

export default function ProfileMenu({ userName, initialSection = "account" }: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState(initialSection);
    const { logout } = useAuth();
    const router = useRouter();

    const menuItems = [
        { id: "account", label: "Account Details", icon: User },
        { id: "search-history", label: "Search History", icon: History },
        { id: "starred-chats", label: "Starred Chats", icon: Heart },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "change-password", label: "Change Password", icon: Lock },
        { id: "delete-account", label: "Delete Account", icon: Trash2 },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const renderContent = () => {
        switch (activeSection) {
            case "account":
                return <AccountDetails />;
            case "search-history":
                return <SearchHistory />;
            case "starred-chats":
                return <StarredChats />;
            case "documents":
                return <Documents />;
            case "change-password":
                return <ChangePassword />;
            case "delete-account":
                return <DeleteAccountComponent />;
            case "settings":
                return <SettingsComponent />;
            default:
                return <AccountDetails />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Use Home Page Navbar */}
            <Navbar isProfilePage={true} />

            {/* Backdrop for mobile sidebar */}
            {isOpen && (
                <div
                    className="fixed inset-0 top-16 bg-black/50 backdrop-blur-sm md:hidden z-20"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex flex-grow">
                {/* Sidebar Menu - Visible on desktop, full-screen on mobile */}
                <div
                    className={cn(
                        "fixed md:relative top-16 left-0 h-[calc(100vh-64px)] w-64 bg-card border-r border-border transition-transform duration-300 z-30 md:z-0",
                        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    )}
                >
                    <div className="flex flex-col h-full">
                        {/* Menu Header with Hamburger on Mobile */}
                        <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
                            <span className="text-sm font-semibold text-foreground">Menu</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-grow overflow-y-auto p-4 space-y-2">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveSection(item.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                        activeSection === item.id
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Logout Button */}
                        <div className="p-4 border-t border-border">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">Log Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hamburger Menu Button - Visible on mobile only, positioned inside content area */}
                <div className="md:hidden absolute top-20 left-4 z-40">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-lg flex flex-col gap-1.5"
                    >
                        <div className={cn(
                            "w-5 h-0.5 bg-white transition-all duration-300",
                            isOpen ? "rotate-45 translate-y-2" : ""
                        )} />
                        <div className={cn(
                            "w-5 h-0.5 bg-white transition-all duration-300",
                            isOpen ? "opacity-0" : ""
                        )} />
                        <div className={cn(
                            "w-5 h-0.5 bg-white transition-all duration-300",
                            isOpen ? "-rotate-45 -translate-y-2" : ""
                        )} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto">
                    <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-12 pt-20 md:pt-6">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
}
