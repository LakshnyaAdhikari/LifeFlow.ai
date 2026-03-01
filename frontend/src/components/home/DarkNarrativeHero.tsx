"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, Shield, Search, FileText, Globe, User, HelpCircle, ArrowRight, Mic, MicOff } from "lucide-react";

interface NarrativeHeroProps {
    onSearch: (query: string) => void;
    presetQuery?: string;
    placeholderOverride?: string;
    presetSeed?: number;
}

export default function DarkNarrativeHero({ onSearch, presetQuery, placeholderOverride, presetSeed }: NarrativeHeroProps) {
    const { t } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [query, setQuery] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const slideCount = 5;

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slideCount);
        }, 4000);
        return () => clearInterval(interval);
    }, [isPaused]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);

            recognition.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                }
                if (currentTranscript) {
                    setQuery(prev => {
                        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
                        return prev + separator + currentTranscript.trim() + ' ';
                    });
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => setIsListening(false);

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    useEffect(() => {
        if (!presetSeed) return;
        if (presetQuery) {
            setQuery(presetQuery);
        }
    }, [presetQuery, presetSeed]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Error starting recognition", e);
            }
        }
    };

    const slides = [
        { id: 0, headline: "When life gets legally complicated." },
        { id: 1, headline: "From confusion to clarity." },
        { id: 2, headline: "Clarity in three steps." },
        { id: 3, headline: "Across the moments that matter." },
        { id: 4, headline: "Grounded. Responsible. Built for you." },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) onSearch(query.trim());
    };

    return (
        <div
            className="relative w-full overflow-hidden bg-[#0c1c1a]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="relative min-h-[420px] flex flex-col items-center justify-start text-center px-4 pt-4 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-start pt-4"
                    >
                        {/* Narrative Headline */}
                        <div className="flex flex-col items-center gap-6 w-full px-6 relative z-10 mb-6">
                            <motion.h2
                                className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] text-white/90"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 1 }}
                            >
                                {slides[currentSlide].headline}
                            </motion.h2>
                        </div>

                        {/* Visual Area */}
                        <div className="relative w-full h-[280px] md:h-[320px] flex items-center justify-center pointer-events-none mt-8">
                            {currentSlide === 0 && <Slide1Confusion />}
                            {currentSlide === 1 && <Slide2Clarity />}
                            {currentSlide === 2 && <Slide3Workflow />}
                            {currentSlide === 3 && <Slide4Domains />}
                            {currentSlide === 4 && <Slide5Trust />}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* PERSISTENT Search Section */}
                <div className="relative w-full max-w-2xl mx-auto px-4 z-20 mt-28 mb-auto">
                    <div className="relative group w-full mb-6">
                        <div className="absolute -inset-0.5 bg-teal-500/10 rounded-[18px] blur-lg opacity-20 group-hover:opacity-100 transition-opacity duration-700" />

                        <form onSubmit={handleSubmit} className="relative flex items-center bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[18px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 overflow-hidden">
                            <div className="pl-5 text-teal-400/60">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={placeholderOverride || "Search legal queries..."}
                                className="flex-grow pl-3 pr-3 py-4 bg-transparent border-none text-white text-lg font-medium focus:outline-none focus:ring-0 placeholder:text-white/20"
                            />
                            <div className="mr-2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`p-2.5 rounded-[14px] flex items-center justify-center transition-colors border ${isListening
                                            ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                                            : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/70"
                                        }`}
                                    title={isListening ? "Stop listening" : "Start speaking"}
                                >
                                    {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 rounded-[14px] font-medium text-sm flex items-center gap-2 transition-all active:scale-95"
                                >
                                    Get Guidance
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Narrative Progress Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-5 z-20">
                    {Array.from({ length: slideCount }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className="group relative h-2 transition-all duration-300 focus:outline-none"
                        >
                            <div className={`h-full rounded-full transition-all duration-1000 ${i === currentSlide ? "w-12 bg-teal-500 shadow-[0_0_20px_rgba(20,122,98,0.6)]" : "w-3 bg-white/10 hover:bg-slate-500"}`} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Slide1Confusion() {
    return (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center pointer-events-none">
            <motion.div
                className="absolute inset-0 bg-[#0c1c1a] opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
            />
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute border border-white/20 rounded-[2px]"
                    style={{ width: Math.random() * 80 + 40, height: Math.random() * 100 + 60 }}
                    initial={{ x: Math.random() * 800 - 400, y: Math.random() * 600 - 300, rotate: Math.random() * 360, opacity: 0 }}
                    animate={{ x: [null, Math.random() * 200 - 100], y: [null, Math.random() * 200 - 100], rotate: [null, Math.random() * 20 - 10], opacity: [0, 0.4, 0.2] }}
                    transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
                >
                    <div className="w-full h-full p-2 space-y-1.5 opacity-30">
                        {[...Array(4)].map((_, j) => (
                            <div key={j} className="h-px bg-white/40" style={{ width: `${Math.random() * 60 + 40}%` }} />
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function Slide2Clarity() {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <motion.div className="absolute inset-0 bg-teal-500/5 blur-[120px]" animate={{ opacity: [0.2, 0.4, 0.2] }} />
            <div className="relative w-full max-w-[280px] flex flex-col items-center">
                <motion.div className="relative w-full flex justify-between items-center gap-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="relative flex flex-col items-center gap-2">
                            <div className="relative w-10 h-10 rounded-lg border border-teal-500/20 bg-teal-500/5 flex items-center justify-center overflow-hidden">
                                <motion.div className="absolute inset-0 bg-teal-500/20" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.6, duration: 0.4 }} />
                                <motion.svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <motion.polyline points="20 6 9 17 4 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9 + i * 0.6, duration: 0.5 }} />
                                </motion.svg>
                                <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.4, 0] }} transition={{ delay: 1.4 + i * 0.6, duration: 0.4 }} />
                            </div>
                            <motion.div className="h-0.5 bg-teal-500/40 rounded-full" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.5 + i * 0.6, duration: 0.8 }} />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

function Slide3Workflow() {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="flex items-center gap-12">
                <div className="relative flex flex-col items-center gap-4">
                    <motion.div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/20 flex items-center justify-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                        <User className="w-8 h-8 text-white/40" />
                    </motion.div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">Tell Us</span>
                </div>
                <div className="w-16 h-px bg-white/10 relative overflow-hidden">
                    <motion.div className="absolute inset-x-0 h-full bg-teal-500/40" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
                </div>
                <div className="relative flex flex-col items-center gap-4">
                    <motion.div className="w-20 h-20 bg-white/5 rounded-full border border-white/20 flex items-center justify-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}>
                        <Globe className="w-8 h-8 text-white/40" />
                    </motion.div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">Analyze</span>
                </div>
                <div className="w-16 h-px bg-white/10 relative overflow-hidden">
                    <motion.div className="absolute inset-x-0 h-full bg-teal-500/40" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 0.5 }} />
                </div>
                <div className="relative flex flex-col items-center gap-4">
                    <motion.div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/20 flex items-center justify-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.8 }}>
                        <CheckCircle2 className="w-8 h-8 text-teal-400/60" />
                    </motion.div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">Result</span>
                </div>
            </div>
        </div>
    );
}

function Slide4Domains() {
    const domains = [
        { icon: User, label: "Identity" },
        { icon: Shield, label: "Insurance" },
        { icon: FileText, label: "Tax" },
        { icon: Globe, label: "Property" },
        { icon: CheckCircle2, label: "Employment" },
    ];
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <motion.div className="relative w-16 h-16 rounded-full border border-teal-500/40 bg-teal-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.2)]" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                <Search className="w-8 h-8 text-teal-400" />
            </motion.div>
            {domains.map((domain, i) => (
                <div key={i} className="absolute inset-0 flex items-center justify-center">
                    <motion.div className="absolute rounded-full border border-white/5" style={{ width: 220 + i * 40, height: 220 + i * 40 }} />
                    <motion.div className="absolute" style={{ width: 220 + i * 40, height: 220 + i * 40 }} animate={{ rotate: 360 }} transition={{ duration: 15 + i * 2, repeat: Infinity, ease: "linear" }}>
                        <motion.div className="absolute bg-[#0c1c1a] border border-white/20 rounded-full w-10 h-10 flex items-center justify-center shadow-xl" style={{ top: -20, left: "50%", marginLeft: -20 }} whileHover={{ scale: 1.2, borderColor: "rgba(20,184,166,0.5)" }}>
                            <domain.icon className="w-5 h-5 text-white/50" />
                        </motion.div>
                    </motion.div>
                </div>
            ))}
        </div>
    );
}

function Slide5Trust() {
    const [score, setScore] = useState(0);
    useEffect(() => {
        const timeout = setTimeout(() => { setScore(82); }, 1000);
        return () => clearTimeout(timeout);
    }, []);
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.svg viewBox="0 0 24 24" className="w-[450px] h-[450px] text-white/5" fill="none" stroke="currentColor" strokeWidth="0.2">
                    <motion.path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, ease: "easeInOut" }} />
                </motion.svg>
            </motion.div>
            <div className="relative flex items-center gap-16 z-10">
                <motion.div className="relative w-40 h-40 flex items-center justify-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="80" cy="80" r="74" className="stroke-white/5 fill-none" strokeWidth="4" />
                        <motion.circle cx="80" cy="80" r="74" className="stroke-teal-500/40 fill-none" strokeWidth="4" strokeDasharray="465" initial={{ strokeDashoffset: 465 }} animate={{ strokeDashoffset: 465 - (465 * score / 100) }} transition={{ duration: 2, ease: "easeOut" }} />
                    </svg>
                    <div className="text-center">
                        <motion.div className="text-4xl font-light text-white/90">{score}%</motion.div>
                        <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">Confidence</div>
                    </div>
                </motion.div>
                <div className="flex flex-col gap-5">
                    {["Official Verified Sources", "Risk-Aware Guidance", "Citizen-First Design"].map((text, i) => (
                        <motion.div key={i} className="flex items-center gap-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 + i * 0.2 }}>
                            <div className="w-8 h-8 rounded-full border border-teal-500/30 flex items-center justify-center bg-teal-500/5">
                                <motion.svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                    <motion.polyline points="20 6 9 17 4 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2 + i * 0.3, duration: 0.5 }} />
                                </motion.svg>
                            </div>
                            <span className="text-xs font-medium text-white/60 tracking-wide">{text}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
