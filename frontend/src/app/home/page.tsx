"use client";

import { useState, useEffect } from "react";
import { ArrowRight, MessageSquare, Loader2, LogOut, User as UserIcon, Settings, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface DomainClassification {
  primary_domain: string;
  secondary_domain?: string;
  related_domains: string[];
  confidence: number;
  user_friendly_summary: string;
  risk_assessment: {
    safe_to_proceed: boolean;
    risk_score: number;
    recommendation: string;
    message?: string;
  };
}

interface Situation {
  id: number;
  title: string;
  primary_domain: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [classification, setClassification] = useState<DomainClassification | null>(null);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingSituations, setLoadingSituations] = useState(true);

  // Load user's existing situations
  useEffect(() => {
    loadSituations();
  }, []);

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

  const handleClassify = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setClassification(null);

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch("http://127.0.0.1:8000/intake/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ user_message: message }),
      });

      if (res.ok) {
        const data = await res.json();
        setClassification(data);
      } else {
        const error = await res.json();
        alert(`Classification failed: ${error.detail || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error classifying your query");
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const createSituation = async () => {
    if (!classification) return;

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch("http://127.0.0.1:8000/situations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          description: message,
          priority: classification.risk_assessment.risk_score >= 3 ? "urgent" : "normal"
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/situation/${data.situation_id}`);
      } else {
        const error = await res.json();
        alert(`Failed to create situation: ${error.detail || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error creating situation");
    }
  };

  const openSituation = (situationId: number) => {
    router.push(`/situation/${situationId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-background text-foreground transition-colors duration-500">

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Welcome, {user?.full_name?.split(' ')[0]}</p>
            <p className="text-xs text-muted-foreground">{user?.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          LifeFlow.ai
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your AI-powered guide for legal and administrative procedures in India
        </p>

        {/* Search Input */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleClassify()}
                placeholder="Describe your situation... (e.g., 'My car insurance claim was rejected')"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleClassify}
              disabled={loading || !message.trim()}
              className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Get Guidance
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Classification Result */}
      {classification && (
        <div className="w-full max-w-4xl mb-8">
          <div className="bg-card border-2 border-border rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">We understand your situation</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Classification</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {classification.primary_domain}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {(classification.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Summary</p>
                <p className="text-foreground">{classification.user_friendly_summary}</p>
              </div>

              {classification.related_domains.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Related Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {classification.related_domains.map((domain) => (
                      <span key={domain} className="px-2 py-1 rounded-full bg-muted text-sm">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {classification.risk_assessment.message && (
                <div className={cn(
                  "p-4 rounded-lg",
                  classification.risk_assessment.risk_score >= 3
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200"
                    : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200"
                )}>
                  <p className="text-sm">{classification.risk_assessment.message}</p>
                </div>
              )}

              <button
                onClick={createSituation}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Start Tracking This Situation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Situations */}
      {situations.length > 0 && (
        <div className="w-full max-w-4xl">
          <h3 className="text-xl font-semibold mb-4">Your Ongoing Situations</h3>
          <div className="grid gap-4">
            {situations.map((situation) => (
              <div
                key={situation.id}
                onClick={() => openSituation(situation.id)}
                className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg">{situation.title}</h4>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    situation.priority === "urgent"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  )}>
                    {situation.priority}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {situation.primary_domain}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(situation.created_at).toLocaleDateString()}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    situation.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
                  )}>
                    {situation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loadingSituations && situations.length === 0 && !hasSearched && (
        <div className="w-full max-w-4xl text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No situations yet</h3>
          <p className="text-muted-foreground">
            Describe your legal or administrative situation above to get started
          </p>
        </div>
      )}
    </main>
  );
}
