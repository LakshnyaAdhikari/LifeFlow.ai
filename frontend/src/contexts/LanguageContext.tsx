"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";

type Language = "en" | "hi";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const dictionaries = {
    en,
    hi,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>("en");

    useEffect(() => {
        // Load persisted language
        const saved = localStorage.getItem("lifeflow_lang") as Language;
        if (saved && (saved === "en" || saved === "hi")) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("lifeflow_lang", lang);
    };

    // Translation helper with nesting support (e.g., "hero.title")
    const t = (key: string): string => {
        const keys = key.split(".");
        let result: any = dictionaries[language];

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                // Fallback to English if key missing in current language
                let fallback: any = dictionaries["en"];
                for (const fk of keys) {
                    if (fallback && fallback[fk]) {
                        fallback = fallback[fk];
                    } else {
                        return key; // Return raw key if not found in fallback either
                    }
                }
                return fallback;
            }
        }

        return typeof result === "string" ? result : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
