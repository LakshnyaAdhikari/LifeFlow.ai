"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ContactPage() {
    const { t } = useLanguage();
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: wire up to backend
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-background text-foreground py-16 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        <MessageSquare className="w-4 h-4" /> {t("contact.hero_badge")}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("contact.title")}</h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        {t("contact.subtitle")}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Info */}
                    <div className="space-y-8">
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-primary" />
                                </div>
                                <h3 className="font-semibold">{t("contact.email_us")}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                For general enquiries:{" "}
                                <a href="mailto:hello@lifeflow.ai" className="text-primary hover:underline">
                                    hello@lifeflow.ai
                                </a>
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                For support:{" "}
                                <a href="mailto:support@lifeflow.ai" className="text-primary hover:underline">
                                    support@lifeflow.ai
                                </a>
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                            <h3 className="font-semibold mb-2">{t("contact.response_times")}</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>⚡ General queries — within 24 hours</li>
                                <li>🛠️ Technical support — within 12 hours</li>
                                <li>🤝 Partnership enquiries — within 48 hours</li>
                            </ul>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-card border border-border rounded-2xl p-8">
                        {submitted ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                <CheckCircle className="w-14 h-14 text-primary mb-4" />
                                <h3 className="text-xl font-bold mb-2">{t("contact.form.sent_title")}</h3>
                                <p className="text-muted-foreground text-sm">
                                    {t("contact.form.sent_desc")}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">{t("contact.form.name")}</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder={t("contact.form.placeholder_name")}
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">{t("contact.form.email")}</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder={t("contact.form.placeholder_email")}
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">{t("contact.form.subject")}</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder={t("contact.form.placeholder_subject")}
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">{t("contact.form.message")}</label>
                                    <textarea
                                        required
                                        rows={5}
                                        placeholder={t("contact.form.placeholder_message")}
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    <Send className="w-4 h-4" /> {t("contact.form.send")}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
