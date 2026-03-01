"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Send,
    MessageSquare,
    Heart,
    CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";

interface ContactFormData {
    name: string;
    message: string;
}

interface FeedbackFormData {
    feedbackType: "bug" | "feature" | "general" | "";
    feedbackText: string;
}

export default function ContactPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const backLink = user ? "/home" : "/";

    const [contactForm, setContactForm] = useState<ContactFormData>({
        name: "",
        message: "",
    });

    const [feedbackForm, setFeedbackForm] = useState<FeedbackFormData>({
        feedbackType: "",
        feedbackText: "",
    });

    const [contactSubmitted, setContactSubmitted] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [loadingContact, setLoadingContact] = useState(false);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setContactForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFeedbackChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFeedbackForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingContact(true);

        try {
            // Simulating API call - replace with actual endpoint
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setContactSubmitted(true);
            setContactForm({ name: "", message: "" });
            setTimeout(() => setContactSubmitted(false), 3000);
        } catch (error) {
            console.error("Error submitting contact form:", error);
        } finally {
            setLoadingContact(false);
        }
    };

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingFeedback(true);

        try {
            // Simulating API call - replace with actual endpoint
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setFeedbackSubmitted(true);
            setFeedbackForm({ feedbackType: "", feedbackText: "" });
            setTimeout(() => setFeedbackSubmitted(false), 3000);
        } catch (error) {
            console.error("Error submitting feedback form:", error);
        } finally {
            setLoadingFeedback(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Back Button */}
            <div className="border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link href={backLink} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to {user ? "Home" : "Landing"}
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 border-b border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
                        Get in <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Touch</span>
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Have a question? Found a bug? Have a feature request? We'd love to hear from you. Your feedback helps us build better.
                    </p>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold">Send us a Message</h2>
                    </div>

                    <form onSubmit={handleContactSubmit} className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">Your Name</label>
                            <input
                                type="text"
                                name="name"
                                value={contactForm.name}
                                onChange={handleContactChange}
                                placeholder="What's your name?"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Message Field */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">Your Message</label>
                            <textarea
                                name="message"
                                value={contactForm.message}
                                onChange={handleContactChange}
                                placeholder="Tell us what you'd like to discuss, ask, or suggest..."
                                rows={6}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:border-primary focus:outline-none transition-colors resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loadingContact}
                            className="w-full px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loadingContact ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Message
                                </>
                            )}
                        </button>

                        {/* Success Message */}
                        {contactSubmitted && (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                    Thanks for reaching out! We'll get back to you soon.
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </section>

            {/* Feedback Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold">Share Your Feedback</h2>
                    </div>

                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        Found a bug? Have an idea for a new feature? Or just want to tell us what you think? Your feedback is invaluable and helps us improve LifeFlow.ai every day.
                    </p>

                    <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                        {/* Feedback Type */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">Feedback Type</label>
                            <select
                                name="feedbackType"
                                value={feedbackForm.feedbackType}
                                onChange={handleFeedbackChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:border-primary focus:outline-none transition-colors"
                            >
                                <option value="">Select feedback type...</option>
                                <option value="bug">🐛 Bug Report</option>
                                <option value="feature">✨ Feature Request</option>
                                <option value="general">💬 General Feedback</option>
                            </select>
                        </div>

                        {/* Feedback Text */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">Your Feedback</label>
                            <textarea
                                name="feedbackText"
                                value={feedbackForm.feedbackText}
                                onChange={handleFeedbackChange}
                                placeholder="Tell us more... The more details, the better!"
                                rows={6}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:border-primary focus:outline-none transition-colors resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loadingFeedback}
                            className="w-full px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loadingFeedback ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit Feedback
                                </>
                            )}
                        </button>

                        {/* Success Message */}
                        {feedbackSubmitted && (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                    Thanks for your feedback! We appreciate you helping us improve.
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </section>

            {/* Alternative Contact Methods */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Other Ways to Reach Us</h2>

                    <div className="grid sm:grid-cols-2 gap-8">
                        {/* Email */}
                        <div className="bg-card border border-border rounded-2xl p-8">
                            <h3 className="text-lg font-bold mb-4">Email</h3>
                            <p className="text-muted-foreground mb-4">
                                For general inquiries and support
                            </p>
                            <a
                                href="mailto:hello@lifeflow.ai"
                                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                            >
                                hello@lifeflow.ai
                            </a>
                        </div>

                        {/* Legal */}
                        <div className="bg-card border border-border rounded-2xl p-8">
                            <h3 className="text-lg font-bold mb-4">Legal & Compliance</h3>
                            <p className="text-muted-foreground mb-4">
                                For legal matters and inquiries
                            </p>
                            <a
                                href="mailto:legal@lifeflow.ai"
                                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                            >
                                legal@lifeflow.ai
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-t border-border">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>

                    <div className="space-y-6">
                        {[
                            {
                                q: "How quickly will you respond to my message?",
                                a: "We aim to respond to all inquiries within 24-48 hours. For urgent matters, please email legal@lifeflow.ai.",
                            },
                            {
                                q: "Can I share a bug report here?",
                                a: "Absolutely! We appreciate detailed bug reports. Please include what you were trying to do, what happened, and any error messages you saw.",
                            },
                            {
                                q: "Do you accept feature requests?",
                                a: "Yes! We'd love to hear your ideas. The more specific you can be about what you need and why, the better.",
                            },
                            {
                                q: "Is my feedback confidential?",
                                a: "Your feedback is important to us. We keep all messages confidential and use them only to improve LifeFlow.ai.",
                            },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-card border border-border rounded-xl p-6">
                                <h3 className="font-bold mb-3 flex items-start gap-3">
                                    <span className="text-primary font-bold">Q:</span>
                                    {item.q}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed flex gap-3">
                                    <span className="text-primary font-bold flex-shrink-0">A:</span>
                                    {item.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
