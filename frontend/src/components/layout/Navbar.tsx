"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X, User, HelpCircle, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExploreOpen, setIsExploreOpen] = useState(false);
    const { user, logout } = useAuth();
    const router = useRouter();

    const isLoggedIn = !!user;

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
    };

    const navLinks = [
        { name: "How LifeFlow Works", href: "/#how-it-works" },
        { name: "For Professionals", href: "/professionals" },
        { name: "Resources", href: "/resources" },
    ];

    const categories = [
        "Identity & Govt Services",
        "Insurance & Finance",
        "Property & Documentation",
        "Family & Personal Legal",
        "Employment & Workplace",
    ];

    return (
        <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left: Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                LifeFlow.ai
                            </span>
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <div className="relative group">
                            <button
                                onMouseEnter={() => setIsExploreOpen(true)}
                                onMouseLeave={() => setIsExploreOpen(false)}
                                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                            >
                                Explore Services
                                <ChevronDown className={`w-4 h-4 transition-transform ${isExploreOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Explore Dropdown */}
                            {isExploreOpen && (
                                <div
                                    onMouseEnter={() => setIsExploreOpen(true)}
                                    onMouseLeave={() => setIsExploreOpen(false)}
                                    className="absolute left-0 mt-0 w-64 p-2 bg-card border border-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2"
                                >
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            className="w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right: Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/home"
                                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    My Situations
                                </Link>
                                <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                                    <HelpCircle className="w-5 h-5" />
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => router.push("/dashboard")}
                                        className="p-2 bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                                    >
                                        <User className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/auth/login"
                                    className="text-sm font-medium hover:text-primary transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-card border-b border-border animate-in slide-in-from-top-4">
                    <div className="px-4 pt-2 pb-6 space-y-1">
                        <div className="py-2 border-b border-border">
                            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Services
                            </p>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4 flex flex-col gap-2 px-3">
                            {isLoggedIn ? (
                                <>
                                    <Link
                                        href="/home"
                                        className="flex items-center gap-2 py-2 text-base font-medium text-muted-foreground"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <LayoutDashboard className="w-5 h-5" /> My Situations
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 py-2 text-base font-medium text-red-500"
                                    >
                                        <LogOut className="w-5 h-5" /> Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className="w-full text-center py-2 rounded-lg border border-border font-medium"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="w-full text-center py-2 rounded-lg bg-primary text-primary-foreground font-bold"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Get Started
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
