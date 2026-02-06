"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, KeyRound, AlertCircle, RefreshCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyOTPPage() {
    const { login: authLogin } = useAuth();
    const router = useRouter();
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [phone, setPhone] = useState("");
    const [resendTimer, setResendTimer] = useState(30);

    useEffect(() => {
        const storedPhone = localStorage.getItem("pending_phone");
        if (!storedPhone) {
            router.push("/auth/signup");
            return;
        }
        setPhone(storedPhone);

        const timer = setInterval(() => {
            setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (otp.length !== 6) {
            setError("Please enter the 6-digit OTP code");
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
                authLogin(data.access_token, data.refresh_token, data.user_id.toString());
                document.cookie = `access_token=${data.access_token}; path=/; max-age=3600; SameSite=Lax`;
                localStorage.removeItem("pending_phone");

                router.push("/home");
            } else {
                setError(data.detail || "Verification failed. Please check the code.");
            }
        } catch (err) {
            console.error("Verification error:", err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;

        setError("");
        try {
            const res = await fetch("http://127.0.0.1:8000/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone })
            });
            if (res.ok) {
                setResendTimer(30);
                alert("OTP resent successfully!");
            } else {
                const data = await res.json();
                setError(data.detail || "Failed to resend OTP");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center p-6 transition-colors duration-500">
            {/* Header */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-12">
                <button
                    onClick={() => router.push("/auth/signup")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to signup
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
                    <h1 className="text-3xl font-bold">Verify Phone</h1>
                    <p className="text-muted-foreground">
                        We sent a 6-digit code to <span className="text-foreground font-semibold">{phone}</span>
                    </p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-8 shadow-sm">
                    <form onSubmit={handleVerify} className="space-y-6">
                        {/* OTP Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">OTP Code</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    placeholder="000000"
                                    className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-border bg-background text-center text-3xl font-bold tracking-[0.5em] focus:border-primary focus:outline-none transition-colors"
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
                            disabled={loading || otp.length !== 6}
                            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={handleResend}
                            disabled={resendTimer > 0}
                            className="text-sm font-medium flex items-center justify-center gap-2 mx-auto disabled:text-muted-foreground text-primary hover:underline transition-colors"
                        >
                            <RefreshCcw className={`w-4 h-4 ${resendTimer > 0 ? "" : "animate-spin-once"}`} />
                            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend OTP code"}
                        </button>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                        Wrong number?{" "}
                        <button
                            onClick={() => {
                                localStorage.removeItem("pending_phone");
                                router.push("/auth/signup");
                            }}
                            className="text-primary hover:underline font-medium"
                        >
                            Go back
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
