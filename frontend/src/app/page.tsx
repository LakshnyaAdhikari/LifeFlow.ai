"use client";

import { useRouter } from "next/navigation";
import { Shield, Heart, Lock, ArrowRight } from "lucide-react";

export default function LandingPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Hero Section */}
            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="text-center space-y-8">
                    {/* Logo/Title */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            LifeFlow
                        </h1>
                        <p className="text-2xl md:text-3xl text-slate-600 dark:text-slate-300 font-light">
                            We're here for life's hardest moments
                        </p>
                    </div>

                    {/* Trust Signals */}
                    <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
                        <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-semibold text-lg">Privacy First</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Your data is encrypted and never shared without your consent
                            </p>
                        </div>

                        <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mx-auto">
                                <Heart className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h3 className="font-semibold text-lg">Compassionate</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Trauma-aware guidance designed with empathy and care
                            </p>
                        </div>

                        <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto">
                                <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="font-semibold text-lg">Secure</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Bank-level security to protect your sensitive information
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-16 space-y-4">
                        <button
                            onClick={() => router.push("/auth/signup")}
                            className="group bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-lg hover:scale-105 transition-all inline-flex items-center gap-2"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="text-sm text-slate-500">
                            Already have an account?{" "}
                            <button
                                onClick={() => router.push("/auth/login")}
                                className="text-blue-600 hover:underline font-medium"
                            >
                                Sign in
                            </button>
                        </div>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-32 space-y-12">
                    <h2 className="text-3xl font-semibold text-center">How LifeFlow Helps</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                1
                            </div>
                            <h3 className="font-semibold text-lg">Tell us what's happening</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Share your situation in your own words. We'll listen without judgment.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold">
                                2
                            </div>
                            <h3 className="font-semibold text-lg">Get a personalized path</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Receive step-by-step guidance tailored to your specific needs and location.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                3
                            </div>
                            <h3 className="font-semibold text-lg">Move forward with confidence</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Track your progress and get support at every step of your journey.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transparency */}
                <div className="mt-32 p-8 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-semibold mb-4">Our Commitment to You</h2>
                    <div className="space-y-3 text-slate-600 dark:text-slate-400">
                        <p>
                            <strong className="text-slate-900 dark:text-slate-100">Your data, your control:</strong> We only collect information necessary to provide personalized guidance. You can delete your account and data at any time.
                        </p>
                        <p>
                            <strong className="text-slate-900 dark:text-slate-100">How we use your information:</strong> Your profile helps us provide jurisdiction-specific guidance and age-appropriate language. We never sell your data.
                        </p>
                        <p>
                            <strong className="text-slate-900 dark:text-slate-100">Security:</strong> All sensitive data is encrypted both in transit and at rest. We use industry-standard security practices.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
