"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, Loader2, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { saveSearchToHistory } from "@/lib/searchHistoryApi";
import type { HomeDomainPreset } from "@/components/home/HomeHero";

interface Situation {
  id: number;
  title: string;
  primary_domain: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  completed_steps?: number;
  pending_steps?: number;
}

interface RawSituation {
  id?: number;
  situation_id?: number;
  title?: string;
  primary_domain?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
}

import HomeHero from "@/components/home/HomeHero";
import ScrollButton from "@/components/home/ScrollButton";

import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [loadingSituations, setLoadingSituations] = useState(true);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [domainPreset, setDomainPreset] = useState<HomeDomainPreset | null>(null);

  const quickDomainPills = [
    { label: "Identity", query: "Identity issue: ", placeholder: "Describe your identity document issue..." },
    { label: "Tax", query: "Tax issue: ", placeholder: "Describe your tax filing, notice, or refund issue..." },
    { label: "Property", query: "Property issue: ", placeholder: "Describe your property, registration, or ownership issue..." },
    { label: "Insurance", query: "Insurance issue: ", placeholder: "Describe your insurance claim or policy issue..." },
  ];

  useEffect(() => {
    loadSituations();
  }, [user]); // Reload if user changes

  const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeoutMs: number
  ) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  };

  const loadSituations = async () => {
    setLoadingSituations(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      setSituations([]);
      setLoadingSituations(false);
      return;
    }

    try {
      const res = await fetchWithTimeout("http://127.0.0.1:8000/situations", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }, 8000);

      if (res.ok) {
        const data = await res.json();
        const rawSituations = Array.isArray(data) ? data : (data.situations || []);
        const normalized = (rawSituations as RawSituation[]).reduce<Situation[]>(
          (acc, item) => {
            const id = item.id ?? item.situation_id;
            if (typeof id !== "number") {
              return acc;
            }

            acc.push({
              id,
              title: item.title || "Untitled situation",
              primary_domain: item.primary_domain || "General",
              status: item.status || "active",
              priority: item.priority || "normal",
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at,
            });
            return acc;
          },
          []
        );

        const withProgress = await Promise.all(
          normalized.map(async (situation) => {
            try {
              const detailRes = await fetchWithTimeout(`http://127.0.0.1:8000/situations/${situation.id}`, {
                headers: {
                  "Authorization": `Bearer ${token}`
                }
              }, 3000);

              if (!detailRes.ok) return situation;
              const detailData = await detailRes.json();
              const completed = detailData?.context?.completed_steps;
              const pending = detailData?.context?.pending_steps;

              return {
                ...situation,
                completed_steps: Array.isArray(completed) ? completed.length : undefined,
                pending_steps: Array.isArray(pending) ? pending.length : undefined,
              };
            } catch {
              return situation;
            }
          })
        );

        setSituations(withProgress);
      } else {
        setSituations([]);
      }
    } catch (e) {
      console.error("Failed to load situations:", e);
      setSituations([]);
    } finally {
      setLoadingSituations(false);
    }
  };

  const handleSearch = async (query: string, shouldSaveToHistory: boolean = true, source: string = "home") => {
    if (!query.trim()) return;
    const token = localStorage.getItem("access_token");

    console.log("🔍 handleSearch called with query:", query);
    console.log("🔑 Token:", token ? "Present" : "Missing");
    console.log("📍 Source:", source);

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
        
        // Save search to history only if it's a new search (not replayed from history)
        if (shouldSaveToHistory) {
          await saveSearchToHistory(query, data.primary_domain || "General");
        }
        
        if (data.situation_id) {
          // Search-history replay should keep existing direct-open behavior.
          if (source === "search_history") {
            router.push(`/situation/${data.situation_id}?source=${source}`);
          } else {
            const needsClarification = data.needs_clarification ?? true;
            if (needsClarification) {
              router.push(`/intake/clarify/${data.situation_id}?source=${source}`);
            } else {
              router.push(`/situation/${data.situation_id}?source=${source}`);
            }
          }
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

  // Handle search query parameter from search history navigation
  useEffect(() => {
    const searchQuery = searchParams.get("search");
    const source = searchParams.get("source") || "home";
    if (searchQuery) {
      console.log("📌 Auto-searching from:", source, "with query:", searchQuery);
      // Pass false to prevent saving the same search again to history
      handleSearch(decodeURIComponent(searchQuery), false, source);
    }
  }, [searchParams]);

  const ongoingSituations = situations.filter((situation) => {
    const status = (situation.status || "").toLowerCase();
    if (typeof situation.pending_steps === "number") {
      return situation.pending_steps > 0;
    }
    return !["resolved", "completed", "closed"].includes(status);
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow">
        <HomeHero onSearch={handleSearch} domainPreset={domainPreset} />

        <section className="py-8 bg-background border-b border-border/40">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-xl md:text-2xl font-bold mb-5">
              How can we help you today?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
              {quickDomainPills.map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => {
                    setDomainPreset({
                      query: pill.query,
                      placeholder: pill.placeholder,
                      seed: Date.now(),
                    });
                    document.getElementById("home-intake")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="w-full min-h-[64px] rounded-xl border border-border bg-card px-5 py-4 text-base font-semibold hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  {pill.label}
                </button>
              ))}
              <button
                onClick={() => router.push("/domains")}
                className="w-full min-h-[64px] rounded-xl border border-primary/30 text-primary bg-primary/5 px-5 py-4 text-base font-semibold hover:bg-primary/10 transition-colors"
              >
                More
              </button>
            </div>
          </div>
        </section>

        {/* Existing Situations Grid */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">{t("home.ongoing_journeys")}</h2>
              <button
                onClick={() => router.push("/situations")}
                className="text-sm font-bold text-primary hover:underline"
              >
                {t("home.view_all")}
              </button>
            </div>

            {loadingSituations ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : ongoingSituations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ongoingSituations.map((situation) => (
                  <div
                    key={situation.id}
                    onClick={() => router.push(`/situation/${situation.id}`)}
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary/60 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">{situation.title}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-md bg-muted">{situation.primary_domain}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(situation.created_at).toLocaleDateString()}
                          </span>
                          {typeof situation.completed_steps === "number" && typeof situation.pending_steps === "number" && (
                            <span className="px-2 py-0.5 rounded-md bg-muted">
                              {situation.completed_steps} done | {situation.pending_steps} pending
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        situation.priority === "urgent"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      )}>
                        {situation.priority === "urgent" ? t("home.urgent") : situation.priority}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-muted uppercase font-bold text-[9px]">
                        {situation.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/situation/${situation.id}`);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Resume
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-3xl">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">No ongoing journeys</h3>
                <p className="text-muted-foreground mb-8">
                  You are all caught up. Start a new intake to create a new guided journey.
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  {t("home.start_intake")}
                </button>
              </div>
            )}
          </div>
        </section>

      </main>

      <Footer />
      <ScrollButton />
    </div >
  );
}
