"use client";

import { Bell, Eye, Lock } from "lucide-react";
import { useState } from "react";

export default function Settings() {
    const [settings, setSettings] = useState({
        notifications: true,
        emailUpdates: true,
        smsAlerts: false,
        showProfile: true,
        twoFactor: false,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings({ ...settings, [key]: !settings[key] });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences</p>
            </div>

            {/* Notifications */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        Notifications
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-foreground">Push Notifications</h4>
                            <p className="text-sm text-muted-foreground mt-1">Receive alerts about your cases and updates</p>
                        </div>
                        <button
                            onClick={() => handleToggle("notifications")}
                            className={`w-14 h-8 rounded-full transition-all flex items-center ${
                                settings.notifications
                                    ? "bg-primary"
                                    : "bg-muted"
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full bg-white transition-transform ${
                                    settings.notifications ? "translate-x-6" : "translate-x-0.5"
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-foreground">Email Updates</h4>
                            <p className="text-sm text-muted-foreground mt-1">Receive important updates via email</p>
                        </div>
                        <button
                            onClick={() => handleToggle("emailUpdates")}
                            className={`w-14 h-8 rounded-full transition-all flex items-center ${
                                settings.emailUpdates
                                    ? "bg-primary"
                                    : "bg-muted"
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full bg-white transition-transform ${
                                    settings.emailUpdates ? "translate-x-6" : "translate-x-0.5"
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-foreground">SMS Alerts</h4>
                            <p className="text-sm text-muted-foreground mt-1">Get SMS notifications for urgent matters</p>
                        </div>
                        <button
                            onClick={() => handleToggle("smsAlerts")}
                            className={`w-14 h-8 rounded-full transition-all flex items-center ${
                                settings.smsAlerts
                                    ? "bg-primary"
                                    : "bg-muted"
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full bg-white transition-transform ${
                                    settings.smsAlerts ? "translate-x-6" : "translate-x-0.5"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Privacy */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        Privacy
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-foreground">Public Profile</h4>
                            <p className="text-sm text-muted-foreground mt-1">Allow others to view your profile</p>
                        </div>
                        <button
                            onClick={() => handleToggle("showProfile")}
                            className={`w-14 h-8 rounded-full transition-all flex items-center ${
                                settings.showProfile
                                    ? "bg-primary"
                                    : "bg-muted"
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full bg-white transition-transform ${
                                    settings.showProfile ? "translate-x-6" : "translate-x-0.5"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        Security
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-foreground">Two-Factor Authentication</h4>
                            <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security</p>
                        </div>
                        <button
                            onClick={() => handleToggle("twoFactor")}
                            className={`w-14 h-8 rounded-full transition-all flex items-center ${
                                settings.twoFactor
                                    ? "bg-primary"
                                    : "bg-muted"
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full bg-white transition-transform ${
                                    settings.twoFactor ? "translate-x-6" : "translate-x-0.5"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
