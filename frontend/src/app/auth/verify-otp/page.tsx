"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";

export default function VerifyOTPPage() {
    const router = useRouter();
    const [otp, setOtp] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        // Get phone from localStorage
        const pendingPhone = localStorage.getItem("pending_phone");
        if (!pendingPhone) {
            router.push("/auth/signup");
            return;
        }
        setPhone(pendingPhone);
        setCountdown(60); // 60 second cooldown for resend
    }, [router]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (otp.length !== 6) {
            setError("Please enter a 6-digit code");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: phone,
                    otp_code: otp
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Store tokens
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
                localStorage.setItem("user_id", data.user_id);
                localStorage.removeItem("pending_phone");

                // Redirect to profile setup
                router.push("/auth/profile");
            } else {
                setError(data.detail || "Invalid OTP. Please try again.");
            }
        } catch (err) {
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        setResending(true);
        setError("");

        try {
            const res = await fetch(`http://127.0.0.1:8000/auth/resend-otp?phone=${encodeURIComponent(phone)}`, {
                method: "POST"
            });

            if (res.ok) {
                setCountdown(60);
                setOtp("");
            } else {
                const data = await res.json();
                setError(data.detail || "Failed to resend OTP");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        Verify Your Phone
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        We sent a 6-digit code to
                    </p>
                    <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                        {phone}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 space-y-5">

                        {/* OTP Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 ring-blue-500 outline-none text-center text-2xl tracking-widest font-mono"
                                maxLength={6}
                                required
                            />
                            <p className="text-xs text-slate-500 text-center">
                                Check your SMS messages for the code
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify & Continue
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        {/* Resend OTP */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={countdown > 0 || resending}
                                className="text-sm text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-2"
                            >
                                {resending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : countdown > 0 ? (
                                    `Resend code in ${countdown}s`
                                ) : (
                                    <>
                                        <RotateCcw className="w-4 h-4" />
                                        Resend code
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                    Wrong number?{" "}
                    <button
                        onClick={() => {
                            localStorage.removeItem("pending_phone");
                            router.push("/auth/signup");
                        }}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Go back
                    </button>
                </div>
            </div>
        </main>
    );
}
