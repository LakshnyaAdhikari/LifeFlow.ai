"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Phone, Lock, User, AlertCircle } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

export default function SignupPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        phone: "",
        password: "",
        confirmPassword: "",
        fullName: ""
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const normalizedPhone = normalizePhone(formData.phone);

        if (!normalizedPhone.match(/^\+91[6-9]\d{9}$/)) {
            setError(t("auth.errors.invalid_phone"));
            return;
        }

        if (formData.password.length < 6) {
            setError(t("auth.errors.password_length"));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t("auth.errors.password_mismatch"));
            return;
        }

        if (!formData.fullName.trim()) {
            setError(t("auth.errors.name_required"));
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: normalizedPhone,
                    password: formData.password,
                    full_name: formData.fullName
                })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("pending_phone", normalizedPhone);
                // Redirect to OTP verification
                router.push("/auth/verify-otp");
            } else {
                setError(data.detail || t("auth.errors.generic_error"));
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError(t("auth.errors.network_error"));
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
                    {t("auth.signup.back_to_home")}
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
                    <h1 className="text-3xl font-bold">{t("auth.signup.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("auth.signup.subtitle")}
                    </p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-8 shadow-sm">
                    <form onSubmit={handleSignup} className="space-y-6">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">{t("auth.signup.full_name")}</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder={t("auth.signup.full_name_placeholder")}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">{t("auth.signup.phone")}</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder={t("auth.signup.phone_placeholder")}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">{t("auth.signup.password")}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={t("auth.signup.password_placeholder")}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">{t("auth.signup.confirm_password")}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder={t("auth.signup.confirm_password_placeholder")}
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
                                    {t("auth.signup.submitting")}
                                </>
                            ) : (
                                <>
                                    {t("auth.signup.submit")}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <p className="text-muted-foreground">
                        {t("auth.signup.already_have_account")}{" "}
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="text-primary hover:underline font-bold"
                        >
                            {t("auth.signup.login_link")}
                        </button>
                    </p>
                </div>
            </div>
        </main>
    );
}
