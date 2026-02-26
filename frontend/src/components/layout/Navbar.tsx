"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
    Menu,
    X,
    User,
    LayoutDashboard,
    LogOut,
    Sun,
    Moon,
    Globe,
    ChevronDown,
    ShieldCheck,
    Landmark,
    Home,
    Heart,
    Briefcase,
    ShoppingCart,
    Stethoscope,
    GraduationCap,
    Car,
    Wifi,
    ChevronRight,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";

const domains = [
    {
        icon: ShieldCheck,
        label: "Identity & Govt Services",
        description: "Aadhaar, PAN, passports, govt ID disputes",
        href: "/services/identity",
        live: true,
    },
    {
        icon: Landmark,
        label: "Insurance & Finance",
        description: "Claims, banking disputes, loan rights",
        href: "#",
        live: false,
    },
    {
        icon: Home,
        label: "Property & Documentation",
        description: "Rent, deeds, land records, tenant rights",
        href: "#",
        live: false,
    },
    {
        icon: Heart,
        label: "Family & Personal Legal",
        description: "Marriage, divorce, inheritance, adoption",
        href: "#",
        live: false,
    },
    {
        icon: Briefcase,
        label: "Employment & Workplace",
        description: "Wrongful termination, ESI/PF, workplace rights",
        href: "#",
        live: false,
    },
    {
        icon: ShoppingCart,
        label: "Consumer Rights",
        description: "Fraud, defective products, e-commerce disputes",
        href: "#",
        live: false,
    },
    {
        icon: Stethoscope,
        label: "Healthcare & Medical",
        description: "Patient rights, insurance denial, negligence",
        href: "#",
        live: false,
    },
    {
        icon: GraduationCap,
        label: "Education & Scholarships",
        description: "Fee disputes, scholarship rights, RTI",
        href: "#",
        live: false,
    },
    {
        icon: Car,
        label: "Traffic & Vehicle",
        description: "Challans, licence issues, accident claims",
        href: "#",
        live: false,
    },
    {
        icon: Wifi,
        label: "Telecom & Digital",
        description: "ISP complaints, data privacy, cyber fraud",
        href: "#",
        live: false,
    },
];

const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "bn", label: "বাংলা" },
    { code: "te", label: "తెలుగు" },
    { code: "mr", label: "मराठी" },
    { code: "ta", label: "தமிழ்" },
];

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [domainsOpen, setDomainsOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { language, setLanguage, t } = useLanguage();
    const activeLang = languages.find(l => l.code === language) || languages[0];

    const domains = [
        {
            icon: ShieldCheck,
            label: t("categories.identity.title"),
            description: t("categories.identity.description"),
            href: "/services/identity",
            live: true,
        },
        {
            icon: Landmark,
            label: t("categories.insurance.title"),
            description: t("categories.insurance.description"),
            href: "#",
            live: false,
        },
        {
            icon: Home,
            label: t("categories.property.title"),
            description: t("categories.property.description"),
            href: "#",
            live: false,
        },
        {
            icon: Heart,
            label: t("categories.family.title"),
            description: t("categories.family.description"),
            href: "#",
            live: false,
        },
        {
            icon: Briefcase,
            label: t("categories.work.title"),
            description: t("categories.work.description"),
            href: "#",
            live: false,
        }
    ];

    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    const domainsRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (domainsRef.current && !domainsRef.current.contains(e.target as Node)) {
                setDomainsOpen(false);
            }
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setLangOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const isLoggedIn = !!user;

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href={isLoggedIn ? "/home" : "/"} className="flex items-center gap-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                LifeFlow.ai
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-1">

                        {/* Domains Dropdown */}
                        <div ref={domainsRef} className="relative">
                            {pathname === "/home" ? (
                                <Link
                                    href="/domains"
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                >
                                    {t("navbar.domains")}
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setDomainsOpen(!domainsOpen)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                >
                                    {t("navbar.domains")}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${domainsOpen ? "rotate-180" : ""}`} />
                                </button>
                            )}

                            {domainsOpen && (
                                <div className="absolute left-0 top-full mt-2 w-[560px] bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {t("navbar.domains")}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-0.5 p-2 max-h-[420px] overflow-y-auto">
                                        {domains.map((d) => (
                                            <Link
                                                key={d.label}
                                                href={d.href}
                                                onClick={() => setDomainsOpen(false)}
                                                className={`flex items-start gap-3 px-3 py-3 rounded-xl transition-all group ${d.live
                                                    ? "hover:bg-primary/5 hover:text-primary cursor-pointer"
                                                    : "opacity-60 cursor-not-allowed pointer-events-none"
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${d.live ? "bg-primary/10 group-hover:bg-primary/20" : "bg-muted"
                                                    }`}>
                                                    <d.icon className={`w-4 h-4 ${d.live ? "text-primary" : "text-muted-foreground"}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium leading-tight">{d.label}</span>
                                                        {!d.live && (
                                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                                Soon
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{d.description}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">More domains launching soon</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link
                            href="/about"
                            className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                            {t("navbar.about")}
                        </Link>

                        <Link
                            href="/contact"
                            className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                            {t("navbar.contact")}
                        </Link>
                    </div>

                    {/* Right: Utilities + Auth */}
                    <div className="hidden md:flex items-center gap-2">

                        {/* Language Selector */}
                        <div ref={langRef} className="relative">
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="text-xs font-medium">{activeLang.code.toUpperCase()}</span>
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
                            </button>

                            {langOpen && (
                                <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                                    <div className="px-3 py-2 border-b border-border">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("navbar.language")}</p>
                                    </div>
                                    <div className="py-1">
                                        {languages.map((l) => (
                                            <button
                                                key={l.code}
                                                onClick={() => {
                                                    setLanguage(l.code as "en" | "hi");
                                                    setLangOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${activeLang.code === l.code ? "text-primary font-medium" : "text-foreground"
                                                    }`}
                                            >
                                                <span>{l.label}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{l.code.toUpperCase()}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                aria-label="Toggle theme"
                            >
                                {theme === "dark" ? (
                                    <Sun className="w-4 h-4" />
                                ) : (
                                    <Moon className="w-4 h-4" />
                                )}
                            </button>
                        )}

                        {/* Auth */}
                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                            {isLoggedIn ? (
                                <>
                                    <button
                                        onClick={() => router.push("/dashboard")}
                                        className="p-2 rounded-full bg-muted text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                    >
                                        {t("navbar.login")}
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
                                    >
                                        {t("navbar.signup")}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-2">
                        {/* Theme toggle mobile */}
                        {mounted && (
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                            >
                                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                        )}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-card border-b border-border animate-in slide-in-from-top-4">
                    <div className="px-4 pt-3 pb-6 space-y-1">

                        {/* Domains Section */}
                        <div className="py-2">
                            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                {t("navbar.domains")}
                            </p>
                            {domains.map((d) => (
                                <Link
                                    key={d.label}
                                    href={d.live ? d.href : "#"}
                                    onClick={() => d.live && setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${d.live
                                        ? "hover:bg-primary/5 text-foreground"
                                        : "opacity-50 pointer-events-none"
                                        }`}
                                >
                                    <d.icon className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span className="flex-1">{d.label}</span>
                                    {!d.live && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                            Soon
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>

                        <div className="border-t border-border pt-2">
                            <Link
                                href="/about"
                                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t("navbar.about")}
                            </Link>
                            <Link
                                href="/contact"
                                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t("navbar.contact")}
                            </Link>
                        </div>

                        {/* Language picker mobile */}
                        <div className="border-t border-border pt-2">
                            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                {t("navbar.language")}
                            </p>
                            <div className="flex flex-wrap gap-2 px-3">
                                {languages.map((l) => (
                                    <button
                                        key={l.code}
                                        onClick={() => setLanguage(l.code as "en" | "hi")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeLang.code === l.code
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-border text-muted-foreground hover:border-primary/50"
                                            }`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Auth mobile */}
                        <div className="border-t border-border pt-4 flex flex-col gap-2 px-3">
                            {isLoggedIn ? (
                                <>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 py-2 text-sm font-medium text-destructive"
                                    >
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className="w-full text-center py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {t("navbar.login")}
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {t("navbar.signup")}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
