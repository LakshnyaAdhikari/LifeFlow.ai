"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MapPin, User, Globe, Users } from "lucide-react";

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
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        Let's personalize your journey
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        This helps us provide jurisdiction-specific guidance and appropriate support.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 grid md:grid-cols-2 gap-6">

                        {/* Location State */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> State
                            </label>
                            <input
                                type="text"
                                value={formData.location_state}
                                onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                                placeholder="e.g. Maharashtra"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Location City */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> City
                            </label>
                            <input
                                type="text"
                                value={formData.location_city}
                                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                                placeholder="e.g. Mumbai"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Age Range */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <User className="w-4 h-4" /> Age Range
                            </label>
                            <select
                                value={formData.age_range}
                                onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 ring-blue-500 outline-none"
                            >
                                <option value="">Select range</option>
                                {ageRanges.map(range => (
                                    <option key={range} value={range}>{range}</option>
                                ))}
                            </select>
                        </div>

                        {/* Language */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Preferred Language
                            </label>
                            <select
                                value={formData.preferred_language}
                                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 ring-blue-500 outline-none"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Family Status */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Family Status
                            </label>
                            <input
                                type="text"
                                value={formData.family_status}
                                onChange={(e) => setFormData({ ...formData, family_status: e.target.value })}
                                placeholder="e.g. Head of family, living with parents, etc."
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="md:col-span-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="md:col-span-2 flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push("/home")}
                                className="flex-1 px-4 py-3 rounded-lg font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-600 dark:text-slate-400"
                            >
                                Skip for now
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Start Journey
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <p className="text-center text-xs text-slate-500">
                    You can update these details anytime in your profile settings.
                </p>
            </div>
        </main>
    );
}
