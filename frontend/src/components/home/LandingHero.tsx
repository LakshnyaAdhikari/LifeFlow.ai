"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ArrowRight, UserPlus, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Particle Network Canvas ───────────────────────────────────────────────────

interface Particle { x: number; y: number; vx: number; vy: number; radius: number; }

function ParticleCanvas({ isDark }: { isDark: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);
    const mouseRef = useRef({ x: -9999, y: -9999 });
    const isDarkRef = useRef(isDark);

    useEffect(() => { isDarkRef.current = isDark; }, [isDark]);

    const initParticles = useCallback((w: number, h: number) => {
        const count = Math.floor((w * h) / 12000);
        particlesRef.current = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 1.8 + 0.8,
        }));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            initParticles(canvas.width, canvas.height);
        };
        resize();
        window.addEventListener("resize", resize);

        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        canvas.addEventListener("mousemove", onMouseMove);

        const LINK_DIST = 130;
        const MOUSE_DIST = 160;

        const draw = () => {
            const { width: w, height: h } = canvas;
            ctx.clearRect(0, 0, w, h);

            const DOT_RGB = isDarkRef.current ? "45, 180, 155" : "17, 120, 100";
            const LINE_RGB = isDarkRef.current ? "27, 156, 133" : "17, 120, 100";

            const particles = particlesRef.current;
            const mouse = mouseRef.current;

            particles.forEach((p) => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            });

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < LINK_DIST) {
                        const a = (1 - dist / LINK_DIST) * (isDarkRef.current ? 0.35 : 0.22);
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${LINE_RGB},${a})`;
                        ctx.lineWidth = 0.7;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
                const mx = particles[i].x - mouse.x;
                const my = particles[i].y - mouse.y;
                const md = Math.sqrt(mx * mx + my * my);
                if (md < MOUSE_DIST) {
                    const a = (1 - md / MOUSE_DIST) * (isDarkRef.current ? 0.6 : 0.4);
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${LINE_RGB},${a})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }

            particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${DOT_RGB}, ${isDarkRef.current ? 0.7 : 0.5})`;
                ctx.fill();
            });

            rafRef.current = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", resize);
            canvas.removeEventListener("mousemove", onMouseMove);
        };
    }, [initParticles]);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />;
}

// ─── Guidance Mockup Sub-component ───────────────────────────────────────────

function GuidanceMockup({ isDark }: { isDark: boolean }) {
    const { t } = useLanguage();
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [stage, setStage] = useState<"typing_user" | "thinking" | "typing_ai" | "display">("typing_user");
    const [userText, setUserText] = useState("");
    const [aiStepsVisible, setAiStepsVisible] = useState(0);

    const scenarios = [
        {
            user: t("hero.guidance.scenario_1.user"),
            plan: [
                t("hero.guidance.scenario_1.step_1"),
                t("hero.guidance.scenario_1.step_2"),
                t("hero.guidance.scenario_1.step_3")
            ]
        },
        {
            user: t("hero.guidance.scenario_2.user"),
            plan: [
                t("hero.guidance.scenario_2.step_1"),
                t("hero.guidance.scenario_2.step_2"),
                t("hero.guidance.scenario_2.step_3")
            ]
        }
    ];

    const scenario = scenarios[scenarioIndex];

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (stage === "typing_user") {
            if (userText.length < (scenario?.user?.length || 0)) {
                timeout = setTimeout(() => {
                    setUserText(scenario.user.slice(0, userText.length + 1));
                }, 40);
            } else {
                timeout = setTimeout(() => setStage("thinking"), 1000);
            }
        } else if (stage === "thinking") {
            timeout = setTimeout(() => setStage("typing_ai"), 1500);
        } else if (stage === "typing_ai") {
            if (aiStepsVisible < (scenario?.plan?.length || 0)) {
                timeout = setTimeout(() => {
                    setAiStepsVisible(aiStepsVisible + 1);
                }, 800);
            } else {
                timeout = setTimeout(() => setStage("display"), 3000);
            }
        } else if (stage === "display") {
            timeout = setTimeout(() => {
                setScenarioIndex((prev) => (prev + 1) % scenarios.length);
                setStage("typing_user");
                setUserText("");
                setAiStepsVisible(0);
            }, 2000);
        }

        return () => clearTimeout(timeout);
    }, [stage, userText, aiStepsVisible, scenario, scenarios.length]);

    return (
        <div className="relative group w-full max-w-[500px] animate-in fade-in zoom-in-95 duration-1000">
            {/* Mockup Window */}
            <div className={`relative w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${isDark ? "bg-[#1a2e2a]/80 backdrop-blur-xl border border-white/10" : "bg-white border border-slate-200"}`}>
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <span className={`text-[10px] font-bold tracking-tight ml-2 uppercase ${isDark ? "text-white/40" : "text-slate-400"}`}>LifeFlow.ai — Guidance</span>
                </div>

                <div className="p-5 md:p-8 space-y-6 min-h-[420px] flex flex-col">
                    {/* User Bubble */}
                    <div className={`flex justify-end pr-8 transition-all duration-500 ${userText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                        <div className={`relative px-4 py-3 rounded-2xl rounded-tr-sm text-sm ${isDark ? "bg-teal-500/20 text-teal-100 border border-teal-500/30" : "bg-[#e5f5f1] text-[#147a62]"}`}>
                            {userText}
                            <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse align-middle" style={{ visibility: stage === "typing_user" ? "visible" : "hidden" }} />
                            <div className="absolute top-0 -right-8 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-current opacity-40">U</div>
                        </div>
                    </div>

                    {/* AI Bubble */}
                    {(stage === "thinking" || stage === "typing_ai" || stage === "display") && (
                        <div className="flex justify-start pl-8 relative animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-teal-500 text-teal-500 bg-teal-500/10">AI</div>

                            {stage === "thinking" ? (
                                <div className={`px-5 py-3 rounded-2xl rounded-tl-sm border italic text-xs ${isDark ? "bg-white/5 border-white/10 text-white/40" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
                                    {t("hero.guidance.status_ai_typing")}
                                </div>
                            ) : (
                                <div className={`w-full px-5 py-5 rounded-2xl rounded-tl-sm border transition-colors ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100"}`}>
                                    <p className={`text-xs font-bold mb-4 ${isDark ? "text-white/60" : "text-slate-500"}`}>{t("hero.guidance.action_plan")}:</p>
                                    <ul className="space-y-3">
                                        {scenario?.plan?.slice(0, aiStepsVisible).map((step, i) => (
                                            <li key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
                                                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${i < aiStepsVisible - 1 || stage === "display" ? "text-teal-500 fill-teal-500/20" : "text-teal-500/40"}`} />
                                                <span className={`text-sm ${isDark ? "text-white/80" : "text-slate-700 font-medium"}`}>{step}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-auto">
                        <div className={`h-10 w-full rounded-xl border flex items-center justify-between px-3 ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100"}`}>
                            <div className={`h-2 w-1/2 rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                            <div className="w-6 h-6 rounded-lg bg-teal-500/80 flex items-center justify-center">
                                <ArrowRight className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
                {scenarios.map((_, i) => (
                    <div key={i} className={`h-1.5 transition-all duration-500 rounded-full ${i === scenarioIndex ? "w-8 bg-teal-500" : "w-2 bg-slate-300 dark:bg-slate-700"}`} />
                ))}
            </div>
        </div>
    );
}

// ─── Main Hero Component ─────────────────────────────────────────────────────

export default function LandingHero({ onSearch, showSignupPrompt = true }: { onSearch: (query: string) => void; showSignupPrompt?: boolean }) {
    const { user } = useAuth();
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [query, setQuery] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const { t } = useLanguage();

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { setIsTyping(query.length > 0); }, [query]);

    const isDark = mounted ? (resolvedTheme ?? theme) === "dark" : false;

    if (!mounted) return null;

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (query.trim()) onSearch(query); };

    const quickStarters = [
        t("hero.chips.aadhaar_issues"),
        t("hero.chips.pan_correction"),
        t("hero.chips.insurance_claim"),
        t("hero.chips.property_rights"),
    ];

    return (
        <section className={`relative min-h-[85vh] flex items-center py-20 lg:py-28 overflow-hidden transition-colors duration-700 ${isDark ? "bg-[#0c1c1a]" : "bg-[#f8f9f8]"}`}>
            {/* Particle Canvas Layer */}
            <ParticleCanvas isDark={isDark} />

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Content */}
                    <div className="text-left">
                        <h1 className="text-5xl md:text-7xl font-[850] tracking-tight leading-[1.05] mb-8">
                            <span className={isDark ? "text-white" : "text-[#1a2e2a]"}>{t("hero.title_part1")} </span>
                            <span className="relative">
                                <span className={isDark ? "text-white" : "text-[#1a2e2a]"}>{t("hero.title_keyword")}</span>
                                <div className="absolute -bottom-2 left-0 w-full h-1.5 bg-[#2db49b]/40 rounded-full" />
                            </span>
                            <br />
                            <span className="text-[#2db49b]">{t("hero.title_part2")}</span>
                        </h1>

                        <p className={`text-lg md:text-xl font-medium leading-relaxed mb-12 max-w-xl ${isDark ? "text-white/60" : "text-slate-600"}`}>
                            {t("hero.subtitle")}
                        </p>

                        <div className="relative group max-w-xl mb-10">
                            <form onSubmit={handleSubmit} className="relative">
                                <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-teal-400" : "text-[#147a62]"}`}>
                                    <Search className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t("hero.search_placeholder")}
                                    className={`w-full pl-14 pr-44 py-5 rounded-2xl text-lg font-medium shadow-sm transition-all focus:outline-none focus:ring-4 ${isDark ? "bg-white/5 border border-white/10 text-white focus:border-teal-500 ring-teal-500/20" : "bg-white border-2 border-slate-100 text-[#1a2e2a] focus:border-teal-500 ring-teal-500/10"}`}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-3 bg-[#147a62] hover:bg-[#0d5c4a] text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                                >
                                    {t("hero.view_details")}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>

                            {/* Signup Tooltip */}
                            {isTyping && !user && showSignupPrompt && (
                                <div className="absolute -top-16 right-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className={`backdrop-blur-md border px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap ${isDark ? "bg-teal-500/10 border-teal-500/30" : "bg-white border-slate-200"}`}>
                                        <UserPlus className="w-4 h-4 text-teal-500" />
                                        <p className="text-sm font-bold text-teal-600">Join LifeFlow.ai for personalized guidance</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-slate-400"}`}>{t("hero.trending")}</span>
                            {quickStarters.map((starter) => (
                                <button
                                    key={starter}
                                    onClick={() => onSearch(starter)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${isDark ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600"}`}
                                >
                                    {starter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Mockup */}
                    <div className="flex justify-center lg:justify-end">
                        <GuidanceMockup isDark={isDark} />
                    </div>
                </div>
            </div>
        </section>
    );
}
