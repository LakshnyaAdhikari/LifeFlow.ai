"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, Home } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { DOMAINS, Domain } from "@/data/domains";
import DomainCard from "@/components/domains/DomainCard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DomainsPage() {
    const { t } = useLanguage();
    const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
    const router = useRouter();

    const handleSubdomainClick = (domainId: string, subdomainId: string) => {
        if (domainId === "identity") {
            router.push("/services/identity");
        } else {
            router.push(`/chat?domain=${domainId}&subdomain=${subdomainId}`);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {/* Breadcrumbs & Navigation */}
                <div className="mb-12 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => router.push("/home")}>{t("breadcrumb.home")}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className={selectedDomain ? "hover:text-primary cursor-pointer transition-colors" : "text-primary"} onClick={() => setSelectedDomain(null)}>{t("navbar.domains")}</span>
                        {selectedDomain && (
                            <>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-primary truncate max-w-[150px]">{selectedDomain.name}</span>
                            </>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!selectedDomain ? (
                        <motion.div
                            key="grid-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="text-center mb-16 space-y-4">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                                    {t("domains.title").split(" ").slice(0, -2).join(" ")} <span className="text-primary">{t("domains.title").split(" ").slice(-2, -1)[0]}</span> {t("domains.title").split(" ").slice(-1)[0]}?
                                </h1>
                                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                                    {t("domains.subtitle")}
                                </p>
                            </div>

                            {/* Domain Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                                {DOMAINS.map((domain) => (
                                    <DomainCard
                                        key={domain.id}
                                        name={domain.name}
                                        description={domain.shortDescription}
                                        icon={domain.icon}
                                        isSelected={false}
                                        isDimmed={false}
                                        onClick={() => setSelectedDomain(domain)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedDomain.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="mt-4 p-8 md:p-12 rounded-[2.5rem] bg-card/40 border border-primary/20 backdrop-blur-xl relative overflow-hidden z-20"
                        >
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

                            <div className="relative z-10 space-y-12">
                                {/* Header Section */}
                                <div className="space-y-6 text-center lg:text-left">
                                    <div className="flex flex-col lg:flex-row items-center gap-6">
                                        <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                                            <selectedDomain.icon className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black tracking-tight text-foreground">
                                                {selectedDomain.name}
                                            </h2>
                                            <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
                                                {selectedDomain.fullDescription}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Subdomains Grid - Staggered entrance */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        Select a specific service:
                                    </h3>
                                    <motion.div
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                                        initial="hidden"
                                        animate="visible"
                                        variants={{
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.1
                                                }
                                            }
                                        }}
                                    >
                                        {selectedDomain.subdomains.map((sub) => (
                                            <motion.button
                                                key={sub.id}
                                                variants={{
                                                    hidden: { opacity: 0, scale: 0.8, y: 20 },
                                                    visible: { opacity: 1, scale: 1, y: 0 }
                                                }}
                                                onClick={() => handleSubdomainClick(selectedDomain.id, sub.id)}
                                                className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-teal-500 bg-[#f0fdfa] dark:bg-teal-950/20 backdrop-blur-md hover:bg-teal-950 dark:hover:bg-teal-900 transition-all text-center shadow-sm hover:shadow-md"
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="p-3 rounded-xl bg-teal-100/30 dark:bg-teal-800/20 text-[#0f766e] group-hover:text-[#2dd4bf] dark:text-teal-400 transition-all duration-300">
                                                    <sub.icon className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-sm tracking-tight text-[#134e4a] group-hover:text-[#2dd4bf] dark:text-teal-100 transition-all duration-300">
                                                    {sub.title}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                </div>

                                <div className="pt-4 flex justify-center lg:justify-start">
                                    <button
                                        onClick={() => setSelectedDomain(null)}
                                        className="flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all p-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to all domains
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
}
