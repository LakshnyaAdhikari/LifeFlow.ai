"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, MapPin, User, Globe, Users, AlertCircle } from "lucide-react";

export default function ProfileSetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        location_state: "",
        location_city: "",
        age_range: "",
        preferred_language: "en",
        family_status: ""
    });

    const ageRanges = ["18-25", "26-40", "41-60", "60+"];
    const languages = [
        { code: "en", name: "English" },
        { code: "hi", name: "Hindi" },
        { code: "bn", name: "Bengali" },
        { code: "te", name: "Telugu" },
        { code: "mr", name: "Marathi" }
    ];

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/auth/login");
            return;
        }

        try {
            const res = await fetch("http://127.0.0.1:8000/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push("/home");
            } else {
                const data = await res.json();
                setError(data.detail || "Failed to update profile");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center p-6 transition-colors duration-500">
            {/* Header */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-12">
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            localStorage.removeItem("access_token");
                            router.push("/");
                        }}
                        className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                        Log Out
                    </button>
                    <button
                        onClick={() => router.push("/home")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Skip to dashboard
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        LifeFlow.ai
                    </span>
                </div>
                <div className="w-[150px]"></div> {/* Spacer */}
            </div>

            <div className="w-full max-w-2xl space-y-8 mt-10">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Personalize Your Journey</h1>
                    <p className="text-muted-foreground">
                        This helps us provide jurisdiction-specific guidance and appropriate support.
                    </p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-8 shadow-sm">
                    <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Location State */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> State
                            </label>
                            <input
                                type="text"
                                value={formData.location_state}
                                onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                                placeholder="e.g. Maharashtra"
                                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Location City */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" /> City
                            </label>
                            <input
                                type="text"
                                value={formData.location_city}
                                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                                placeholder="e.g. Mumbai"
                                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Age Range */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" /> Age Range
                            </label>
                            <select
                                value={formData.age_range}
                                onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors appearance-none"
                            >
                                <option value="">Select range</option>
                                {ageRanges.map(range => (
                                    <option key={range} value={range}>{range}</option>
                                ))}
                            </select>
                        </div>

                        {/* Language */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" /> Preferred Language
                            </label>
                            <select
                                value={formData.preferred_language}
                                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors appearance-none"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Family Status */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" /> Family Status
                            </label>
                            <input
                                type="text"
                                value={formData.family_status}
                                onChange={(e) => setFormData({ ...formData, family_status: e.target.value })}
                                placeholder="e.g. Head of family, living with parents, etc."
                                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="md:col-span-2 flex items-start gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        )}

                        <div className="md:col-span-2 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving details...
                                    </>
                                ) : (
                                    <>
                                        Finish Setup & Start Journey
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    You can update these details anytime in your profile settings.
                </p>
            </div>
        </main>
    );
}
