"use client";

import { useState } from "react";
import { ArrowRight, MessageSquare, Loader2, LogOut, User as UserIcon, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkflowPreview } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<WorkflowPreview[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleIntake = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setSuggestions([]);

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch("http://127.0.0.1:8000/intake/situational", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ user_message: message }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const startWorkflow = async (versionId: number) => {
    try {
      if (!user) return;

      const token = localStorage.getItem("access_token");
      const docket = `CASE-${Date.now()}`;

      const res = await fetch("http://127.0.0.1:8000/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          version_id: versionId,
          docket_number: docket
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = `/journey/${data.instance_id}`;
      } else {
        const err = await res.json();
        alert(`Failed to start workflow: ${err.detail || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error starting workflow");
    }
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

      {/* Hero / Intake Section */}
      <div className={cn(
        "flex flex-col items-center max-w-2xl w-full text-center space-y-8 transition-all duration-700 ease-in-out",
        hasSearched ? "pt-10" : "flex-1 justify-center"
      )}>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-primary">
            LifeFlow
          </h1>
          <p className="text-xl text-muted-foreground font-light">
            Your companion for life's complex moments.
          </p>
        </div>

        <div className="w-full relative group">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative flex items-center bg-white dark:bg-card shadow-lg rounded-2xl p-2 border border-border focus-within:ring-2 ring-primary/50 transition-all">
            <MessageSquare className="ml-4 text-muted-foreground w-6 h-6" />
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleIntake()}
              placeholder="What's going on?"
              className="flex-1 bg-transparent border-none focus:ring-0 text-lg px-4 py-3 placeholder:text-muted-foreground/50"
            />
            <button
              onClick={handleIntake}
              disabled={loading || !message.trim()}
              className="bg-primary text-primary-foreground p-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!hasSearched && (
          <div className="flex gap-3 text-sm text-muted-foreground mt-4">
            <span>Try:</span>
            <button onClick={() => setMessage("I lost my dad")} className="hover:text-primary underline">"I lost my dad"</button>
            <button onClick={() => setMessage("I need to file taxes")} className="hover:text-primary underline">"I need to file taxes"</button>
          </div>
        )}
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="w-full max-w-4xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-2xl font-medium text-center mb-8 text-secondary-foreground">
            {suggestions.length > 0 ? "Here is a path that might help." : "We couldn't find a perfect match, but we are here."}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((s: WorkflowPreview) => (
              <div key={s.template_id} className="bg-card border border-border/50 hover:border-primary/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startWorkflow(s.version_id)}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{s.title}</h3>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">Suggested</span>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {s.description}
                </p>
                <div className="bg-muted/50 p-3 rounded-lg text-sm text-secondary-foreground italic">
                  "{s.match_reason}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
