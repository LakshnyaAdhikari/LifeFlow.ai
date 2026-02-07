"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare, Loader2, FileText, Clock, ChevronRight, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryExplorer from "@/components/home/CategoryExplorer";
import AssistiveTools from "@/components/home/AssistiveTools";

interface Situation {
  id: number;
  title: string;
  primary_domain: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

import Hero from "@/components/home/Hero";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [loadingSituations, setLoadingSituations] = useState(true);
  const [situations, setSituations] = useState<Situation[]>([]);

  useEffect(() => {
    loadSituations();
  }, [user]); // Reload if user changes

  const loadSituations = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/situations", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSituations(data.situations || []);
      }
    } catch (e) {
      console.error("Failed to load situations:", e);
    } finally {
      setLoadingSituations(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    const token = localStorage.getItem("access_token");

    console.log("🔍 handleSearch called with query:", query);
    console.log("🔑 Token:", token ? "Present" : "Missing");

    try {
      console.log("📡 Sending request to /intake/resolve...");
      const res = await fetch("http://127.0.0.1:8000/intake/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ user_message: query }),
      });

      console.log("📥 Response status:", res.status, res.statusText);

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Response data:", data);
        if (data.situation_id) {
          // Redirect to clarification flow to refine guidance
          router.push(`/intake/clarify/${data.situation_id}`);
        } else {
          console.warn("⚠️ No situation_id in response");
          alert("Response received but no situation ID. Check console for details.");
        }
      } else {
        const errorText = await res.text();
        console.error("❌ API Error:", res.status, errorText);
        alert(`API Error ${res.status}: ${errorText.substring(0, 200)}`);
      }
    } catch (e) {
      console.error("💥 Request failed:", e);
      alert(`Request failed: ${e}`);
    }
  };

  const latestSituation = situations.length > 0 ? situations[0] : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow">
        {/* Personalized Welcome & Search */}
        <section className="bg-primary/5 pt-12 pb-16 border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {user?.full_name?.split(" ")[0] || "User"}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                What situation can LifeFlow help you navigate today?
              </p>
            </div>

            <div className="max-w-3xl mx-auto mb-12">
              <Hero onSearch={handleSearch} showSignupPrompt={false} />
            </div>

            {latestSituation && (
              <div className="max-w-2xl mx-auto">
                <div
                  onClick={() => router.push(`/situation/${latestSituation.id}`)}
                  className="bg-card border-2 border-primary/20 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer flex items-center gap-4 group"
                >
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Continue Previous Situation</p>
                    <h4 className="font-bold truncate text-sm">{latestSituation.title}</h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Categories Explorer */}
        <CategoryExplorer />

        {/* Existing Situations Grid */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Your Ongoing Journeys</h2>
              <button
                onClick={() => router.push("/situations")}
                className="text-sm font-bold text-primary hover:underline"
              >
                View all
              </button>
            </div>

            {loadingSituations ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : situations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {situations.map((situation) => (
                  <div
                    key={situation.id}
                    onClick={() => router.push(`/situation/${situation.id}`)}
                    className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        situation.priority === "urgent"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      )}>
                        {situation.priority}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg mb-2">{situation.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(situation.created_at).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-muted uppercase font-bold text-[9px]">
                        {situation.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-3xl">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">No situations yet</h3>
                <p className="text-muted-foreground mb-8">
                  Describe a situation or explore services to get started.
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Start New Intake
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Tools Section */}
        <AssistiveTools />
      </main>

      <Footer />
    </div>
  );
}
