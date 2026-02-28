"use client";

import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccount() {
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (confirmText.toLowerCase() !== "delete my account") {
            setError("Please type the confirmation text exactly");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setError("Authentication failed");
                return;
            }

            const res = await fetch("http://127.0.0.1:8000/auth/delete-account", {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                localStorage.removeItem("access_token");
                router.push("/");
            } else {
                setError("Failed to delete account");
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
                <h1 className="text-3xl font-bold tracking-tight mb-2 text-red-600 dark:text-red-400">Delete Account</h1>
                <p className="text-muted-foreground">This action cannot be undone</p>
            </div>

            <div className="max-w-md bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800 rounded-2xl p-8">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/40">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-900 dark:text-red-200 mb-1">Warning</h3>
                        <p className="text-sm text-red-800 dark:text-red-300">
                            Deleting your account will permanently remove all your data, documents, and chat history. This action cannot be reversed.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-white dark:bg-black/20 border border-red-200 dark:border-red-700 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}

                {!isConfirming ? (
                    <button
                        onClick={() => setIsConfirming(true)}
                        className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete My Account
                    </button>
                ) : (
                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                        <div className="bg-white dark:bg-card p-4 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm font-semibold text-foreground mb-3">
                                Type the following to confirm deletion:
                            </p>
                            <p className="text-sm font-mono bg-muted/50 p-2 rounded mb-4">
                                delete my account
                            </p>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type here..."
                                className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground focus:border-red-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsConfirming(false);
                                    setConfirmText("");
                                    setError("");
                                }}
                                className="flex-1 py-3 bg-muted text-foreground rounded-lg font-bold hover:bg-muted/80 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || confirmText.toLowerCase() !== "delete my account"}
                                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Confirm Delete"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
