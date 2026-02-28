"use client";

import { Lock, Phone, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ChangePassword() {
    const [step, setStep] = useState<"phone" | "otp" | "password">("phone");
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // TODO: Call API to send OTP
            setStep("otp");
            setSuccess("OTP sent to your phone");
        } catch (err) {
            setError("Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // TODO: Call API to verify OTP
            setStep("password");
            setSuccess("OTP verified successfully");
        } catch (err) {
            setError("Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const res = await fetch("http://127.0.0.1:8000/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ new_password: newPassword })
            });

            if (res.ok) {
                setSuccess("Password changed successfully");
                setStep("phone");
                setNewPassword("");
                setConfirmPassword("");
                setOtp("");
                setPhoneNumber("");
            } else {
                setError("Failed to change password");
            }
        } catch (err) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Change Password</h1>
                <p className="text-muted-foreground">Secure your account with a new password</p>
            </div>

            <div className="max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
                {/* Step Indicator */}
                <div className="flex justify-between mb-8">
                    {["phone", "otp", "password"].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                    (["phone", "otp", "password"].indexOf(step) >= i)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {i + 1}
                            </div>
                            {i < 2 && (
                                <div
                                    className={`w-12 h-0.5 mx-2 transition-all ${
                                        ["phone", "otp", "password"].indexOf(step) > i
                                            ? "bg-primary"
                                            : "bg-muted"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-3 bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
                    </div>
                )}

                {/* Phone Step */}
                {step === "phone" && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Phone className="w-4 h-4 text-primary" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter your phone number"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending OTP...
                                </>
                            ) : (
                                "Send OTP"
                            )}
                        </button>
                    </form>
                )}

                {/* OTP Step */}
                {step === "otp" && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Enter OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="6-digit OTP"
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground text-center text-2xl tracking-widest focus:border-primary focus:outline-none transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify OTP"
                            )}
                        </button>
                    </form>
                )}

                {/* Password Step */}
                {step === "password" && (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Lock className="w-4 h-4 text-primary" />
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Lock className="w-4 h-4 text-primary" />
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Changing...
                                </>
                            ) : (
                                "Change Password"
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
