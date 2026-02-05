"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Phone, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        phone: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const normalizePhone = (phone: string) => {
        phone = phone.replace(/\s/g, '').replace(/-/g, '');
        if (!phone.startsWith('+91')) {
            if (phone.startsWith('91')) {
                phone = '+' + phone;
            } else if (phone.length === 10) {
                phone = '+91' + phone;
            }
        }
        return phone;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const normalizedPhone = normalizePhone(formData.phone);

            const res = await fetch("http://127.0.0.1:8000/auth/login-simple", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: normalizedPhone,
                    password: formData.password,
                    skip_otp: true
                })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
                localStorage.setItem("user_id", data.user_id);
                document.cookie = `access_token=${data.access_token}; path=/; max-age=3600; SameSite=Lax`;
                router.push("/home");
            } else {
                if (data.detail?.includes("not verified")) {
                    localStorage.setItem("pending_phone", normalizedPhone);
                    router.push("/auth/verify-otp");
                } else {
                    setError(data.detail || "Login failed. Please check your credentials.");
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Network error. Please check your connection and ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center p-6 transition-colors duration-500">
            {/* Header */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-12">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        LifeFlow.ai
                    </span>
                </div>
                <div className="w-[100px]"></div> {/* Spacer */}
            </div>

            <div className="w-full max-w-md space-y-8 mt-10">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Welcome Back</h1>
                    <p className="text-muted-foreground">
                        Sign in to continue your journey
                    </p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-8 shadow-sm">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Phone Number */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Enter your phone number"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter your password"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <p className="text-muted-foreground">
                        Don't have an account?{" "}
                        <button
                            onClick={() => router.push("/auth/signup")}
                            className="text-primary hover:underline font-bold"
                        >
                            Create one
                        </button>
                    </p>
                </div>
            </div>
        </main>
    );
}
