"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: number;
    full_name: string;
    phone: string;
    profile?: {
        location_state?: string;
        location_city?: string;
        age_range?: string;
        preferred_language: string;
        family_status?: string;
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, refreshToken: string, userId: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("http://127.0.0.1:8000/auth/me", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setUser({
                    id: data.user_id,
                    full_name: data.full_name,
                    phone: data.phone,
                    profile: data.profile
                });
            } else {
                // Token might be invalid or expired
                logout();
            }
        } catch (err) {
            console.error("Failed to fetch user:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = (token: string, refreshToken: string, userId: string) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("user_id", userId);
        fetchUser();
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_id");
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setUser(null);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
