"use client";

import Link from "next/link";
import {
    Sparkles,
    Target,
    Users,
    ShieldCheck,
    ArrowRight,
    Heart,
    Zap,
    Globe,
    Award,
    CheckCircle2,
    Code2,
    Lightbulb,
    TrendingUp,
    ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";

export default function AboutPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const backLink = user ? "/home" : "/";

    const values = [
        {
            icon: Heart,
            title: "Human-Centred Design",
            description: "We build for people, not algorithms. Every feature prioritizes clarity, accessibility, and real human needs.",
        },
        {
            icon: ShieldCheck,
            title: "Security & Privacy First",
            description: "Your data is sacred. End-to-end encryption, zero tracking, and full compliance with GDPR, Data Protection Act 2018.",
        },
        {
            icon: Zap,
            title: "Actionable Guidance",
            description: "No jargon, no fluff. Just clear, step-by-step actions you can take right now to resolve your situation.",
        },
        {
            icon: Globe,
            title: "Accessible to All",
            description: "Available 24/7 in multiple languages, free or low-cost, because your legal rights shouldn't depend on your wealth.",
        },
    ];

    const team = [
        {
            name: "Lakshnya Adhikari",
            role: "Founder & Vision Lead",
            bio: "Started LifeFlow.ai to bridge the gap between complex legal systems and everyday people. Passionate about legal access and AI.",
            focus: "Vision, Strategy & Product",
        },
        {
            name: "Khwaaish Diwan",
            role: "Co-Founder & Operations",
            bio: "Driving execution and operations to make LifeFlow.ai accessible to everyone. Focused on scaling impact and ensuring quality.",
            focus: "Operations & Growth",
        },
    ];

    const stats = [
        { number: "7+", label: "Life Domains Covered", desc: "Identity, Insurance, Property, Family, Employment, Consumer Rights, and more." },
        { number: "100%", label: "Jargon-Free", desc: "Legal guidance written for humans, not lawyers." },
        { number: "24/7", label: "Always Available", desc: "Get help any time, any day. No gatekeeping." },
        { number: "<5 mins", label: "Quick Answers", desc: "From question to actionable steps in under 5 minutes." },
    ];

    const features = [
        {
            icon: Sparkles,
            title: "AI-Powered Analysis",
            description: "Our AI understands your situation deeply and generates personalized guidance specific to your context.",
        },
        {
            icon: Code2,
            title: "Built on Open Science",
            description: "We use interpretable AI models you can trust, with sources and citations for every recommendation.",
        },
        {
            icon: TrendingUp,
            title: "Continuously Improving",
            description: "Your feedback helps us improve. We iterate on guidance to make it more helpful and accurate every day.",
        },
        {
            icon: Award,
            title: "Legally Validated",
            description: "Every piece of guidance is cross-checked against current laws, regulations, and official procedures.",
        },
    ];

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
            <section className="relative overflow-hidden py-32 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5 pointer-events-none" />
                <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute bottom-0 right-10 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
                
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 tracking-tight">
                        Making Legal Rights{" "}
                        <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                            Simple & Accessible
                        </span>
                    </h1>
                    
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        LifeFlow.ai is your trusted AI-powered companion for navigating legal and administrative challenges. We believe everyone—regardless of background or budget—deserves clear, actionable guidance when they need it most.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                                To democratize access to legal and administrative guidance by removing barriers of cost, complexity, and trust. Everyone deserves clear answers and actionable paths forward.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                                We combine cutting-edge AI with human expertise and legal rigor to create guidance that's both deeply informed and genuinely understandable.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "No legal jargon—just plain English",
                                    "Privacy-first architecture",
                                    "Available 24/7 globally",
                                    "Culturally relevant guidance",
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span className="text-foreground font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-12 space-y-8">
                            <div>
                                <h3 className="text-5xl font-black text-primary mb-2">Our Vision</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    A world where everyone has instant access to trustworthy legal guidance, no matter their background or budget. Where complexity becomes clarity.
                                </p>
                            </div>
                            <div className="pt-8 border-t border-primary/20">
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Values-Driven</h4>
                                <p className="text-muted-foreground">
                                    We're built on transparency, accuracy, and the belief that legal rights are human rights. Every decision we make prioritizes the person using LifeFlow.ai.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/40 border-t border-border">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">By The Numbers</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.number} className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-md transition-all">
                                <div className="text-5xl font-black text-primary mb-3">{stat.number}</div>
                                <h3 className="text-lg font-bold mb-2">{stat.label}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{stat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">Our Values</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value) => (
                            <div
                                key={value.title}
                                className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                                    <value.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg mb-3">{value.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/40 border-t border-border">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">How We Deliver</h2>
                    <div className="grid sm:grid-cols-2 gap-12">
                        {features.map((feature) => (
                            <div key={feature.title} className="flex gap-6">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust & Credibility */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">Trust & Credibility</h2>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="bg-card border border-border rounded-2xl p-10">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                Your Privacy is Sacred
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    "End-to-end encrypted conversations",
                                    "No data sharing with third parties",
                                    "No behavioral tracking or profiling",
                                    "GDPR, Data Protection Act 2018 compliant",
                                    "Transparent about how we use your data",
                                    "Right to delete your data anytime",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-10">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Award className="w-6 h-6 text-primary" />
                                Accuracy & Accountability
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    "All guidance sourced from official laws and procedures",
                                    "Reviewed by legal and policy experts",
                                    "Updated regularly to reflect legal changes",
                                    "Citations and sources for transparency",
                                    "Clear disclaimers where we can't guarantee outcomes",
                                    "Feedback mechanism to improve continuously",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Disclaimer */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-t border-border">
                <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-10">
                    <h3 className="text-2xl font-bold mb-4">Important Disclaimer</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                        LifeFlow.ai provides guidance and information, not legal advice. While we work with legal experts to ensure accuracy, we cannot replace a qualified lawyer in all situations.
                    </p>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                        If you're facing serious legal consequences (criminal charges, eviction, major financial loss), please consult a qualified legal professional. We're here to help you understand your options and next steps.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                        LifeFlow.ai and its creators are not liable for outcomes of actions taken based on our guidance. We encourage critical thinking and independent verification of all information.
                    </p>
                </div>
            </section>

            {/* Team */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">Who's Behind This</h2>
                    <div className="grid md:grid-cols-2 gap-12">
                        {team.map((member) => (
                            <div key={member.name} className="bg-card border border-border rounded-2xl p-10 hover:shadow-lg transition-all">
                                <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                                <p className="text-primary font-semibold mb-4">{member.role}</p>
                                <p className="text-muted-foreground mb-6 leading-relaxed">{member.bio}</p>
                                <div className="pt-6 border-t border-border">
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold">Focus:</span> {member.focus}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 border-t border-border text-center" id="cta">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Take Control?</h2>
                    <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                        Join thousands of people who've gotten clarity on their legal and administrative challenges. Start with a simple question.
                    </p>
                </div>
            </section>

            {/* Footer Info */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/40 border-t border-border text-center">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                        <h4 className="font-bold mb-2">Contact & Support</h4>
                        <p className="text-muted-foreground">
                            Email: <a href="mailto:hello@lifeflow.ai" className="text-primary hover:underline">hello@lifeflow.ai</a> | Hours: 24/7
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Commitment to You</h4>
                        <p className="text-muted-foreground">
                            We're always learning. If our guidance didn't help, please tell us. Your feedback makes us better.
                        </p>
                    </div>
                    <div className="pt-6 border-t border-border space-y-2">
                        <p className="text-sm text-muted-foreground">
                            © 2024 LifeFlow.ai. All rights reserved.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/privacy" className="text-sm text-primary hover:underline">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-sm text-primary hover:underline">
                                Terms of Service
                            </Link>
                            <a href="mailto:legal@lifeflow.ai" className="text-sm text-primary hover:underline">
                                Legal Inquiries
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
