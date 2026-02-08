"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import IdentitySidebar from "@/components/services/identity/IdentitySidebar";

export default function IdentityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex flex-grow max-w-7xl mx-auto w-full">
                <IdentitySidebar />
                <main className="flex-grow min-w-0 border-l border-border bg-[#FDFDFF]">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
}
