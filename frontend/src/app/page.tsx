"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LandingHero from "@/components/home/LandingHero";
import CategoryExplorer from "@/components/home/CategoryExplorer";
import HowItWorks from "@/components/home/HowItWorks";
import StartupStats from "@/components/home/StartupStats";

export default function LandingPage() {
    const router = useRouter();

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        try {
            // Call the intake/resolve API
            const res = await fetch("http://127.0.0.1:8000/intake/resolve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_message: query }),
            });

            if (res.ok) {
                const data = await res.json();
                // If a situation was created, redirect to its detail page
                if (data.situation_id) {
                    router.push(`/situation/${data.situation_id}`);
                } else {
                    // Fallback to home if no ID (though resolve should return one)
                    router.push("/home");
                }
            } else {
                console.error("Resolve failed (likely unauthenticated)");
                router.push("/auth/signup"); // Redirect to signup if search fails (e.g. 401)
            }
        } catch (err) {
            console.error("Search error:", err);
            router.push("/auth/signup"); // Fallback
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="flex-grow">
                {/* Primary Engagement Zone */}
                <LandingHero onSearch={handleSearch} />

                {/* Authority & Trust Builders */}
                <StartupStats />

                {/* Guidance & Discovery */}
                <CategoryExplorer />

                {/* Product Education */}
                <HowItWorks />
            </main>

            <Footer />
        </div>
    );
}
