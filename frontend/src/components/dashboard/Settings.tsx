"use client";

import { LogOut, User, Phone, MapPin, Globe, Shield, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsTab() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Account Settings</h2>
                <p className="text-muted-foreground">Manage your profile details and preferences.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Profile Information
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                            <div className="font-medium p-3 bg-muted/50 rounded-lg border border-border">
                                {user.full_name}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                            <div className="font-medium p-3 bg-muted/50 rounded-lg border border-border flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                {user.phone}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Location</label>
                            <div className="font-medium p-3 bg-muted/50 rounded-lg border border-border flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                {user.profile?.location_city || "Not set"}, {user.profile?.location_state || "Not set"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Language</label>
                            <div className="font-medium p-3 bg-muted/50 rounded-lg border border-border flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                {user.profile?.preferred_language === "en" ? "English" : user.profile?.preferred_language || "Not set"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Security & Session
                    </h3>
                </div>
                <div className="p-6">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out of LifeFlow
                    </button>
                    <p className="mt-4 text-xs text-muted-foreground">
                        This will end your current session. You will need to log in again to access your situations.
                    </p>
                </div>
            </div>
        </div>
    );
}
