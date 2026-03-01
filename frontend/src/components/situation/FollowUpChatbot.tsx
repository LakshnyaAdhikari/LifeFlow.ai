"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, MessageCircle, Send, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClarificationAnswer, GuidanceResponse } from "@/types/guidance";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    text?: string;
    guidance?: GuidanceResponse;
}

interface FollowUpChatbotProps {
    domain: string;
    situationId: number;
    clarificationAnswers?: ClarificationAnswer[];
    onApplyGuidance?: (guidance: GuidanceResponse) => void;
}

export default function FollowUpChatbot({
    domain,
    situationId,
    clarificationAnswers = [],
    onApplyGuidance,
}: FollowUpChatbotProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            text: "Ask follow-up questions about this case. I will respond using official sources already retrieved for your situation.",
        },
    ]);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

    const handleSessionExpired = (detail?: string) => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_id");
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setMessages((prev) => [
            ...prev,
            {
                id: `a-exp-${Date.now()}`,
                role: "assistant",
                text: detail || "Session expired. Please log in again to continue follow-up guidance.",
            },
        ]);
        setTimeout(() => {
            router.push(`/auth/login?next=/situation/${situationId}`);
        }, 500);
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const token = localStorage.getItem("access_token");
        if (!token) {
            handleSessionExpired();
            return;
        }

        const userMessage: ChatMessage = {
            id: `u-${Date.now()}`,
            role: "user",
            text,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/guidance/suggestions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: text,
                    domain,
                    situation_id: situationId,
                    clarification_answers: clarificationAnswers,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const detail = errorData?.detail || "Failed to get follow-up guidance.";
                if (res.status === 401) {
                    handleSessionExpired(typeof detail === "string" ? detail : undefined);
                    return;
                }
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `a-error-${Date.now()}`,
                        role: "assistant",
                        text: `I could not process that follow-up right now. ${detail}`,
                    },
                ]);
                return;
            }

            const guidance: GuidanceResponse = await res.json();
            setMessages((prev) => [
                ...prev,
                {
                    id: `a-${Date.now()}`,
                    role: "assistant",
                    guidance,
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `a-net-${Date.now()}`,
                    role: "assistant",
                    text: "Network issue while generating follow-up guidance. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className={cn(
                    "fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-4 py-3",
                    "bg-primary text-primary-foreground shadow-lg hover:opacity-95 transition-all"
                )}
                aria-label="Toggle follow-up assistant"
            >
                {isOpen ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                <span className="text-sm font-semibold">{isOpen ? "Close" : "Ask Follow-up"}</span>
            </button>

            {isOpen && (
                <div
                    className={cn(
                        "fixed z-50 rounded-2xl border-2 border-border bg-card shadow-2xl",
                        "bottom-20 right-5 w-[360px] max-w-[calc(100vw-2rem)] h-[560px]",
                        "max-md:left-4 max-md:right-4 max-md:w-auto"
                    )}
                >
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">LifeFlow Assistant</p>
                                <p className="text-xs text-muted-foreground">Grounded follow-up guidance</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-[430px] overflow-y-auto px-4 py-3 space-y-3">
                        {messages.map((message) => {
                            if (message.role === "user") {
                                return (
                                    <div key={message.id} className="flex justify-end">
                                        <div className="max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground">
                                            {message.text}
                                        </div>
                                    </div>
                                );
                            }

                            if (message.guidance) {
                                const topSuggestions = message.guidance.suggestions.slice(0, 3);
                                return (
                                    <div key={message.id} className="max-w-[92%] rounded-xl border border-border bg-background p-3">
                                        <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-primary">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Follow-up guidance
                                        </div>
                                        <div className="space-y-2">
                                            {topSuggestions.map((suggestion, index) => (
                                                <div key={`${message.id}-${index}`} className="rounded-lg border border-border p-2">
                                                    <p className="text-sm font-semibold">{suggestion.title}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-3">{suggestion.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <p className="text-[11px] text-muted-foreground">
                                                Confidence {(message.guidance.confidence.score * 100).toFixed(0)}%
                                            </p>
                                            {onApplyGuidance && (
                                                <button
                                                    onClick={() => onApplyGuidance(message.guidance!)}
                                                    className="text-xs font-medium text-primary hover:underline"
                                                >
                                                    Apply to page
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={message.id} className="max-w-[90%] rounded-xl border border-border bg-background px-3 py-2 text-sm">
                                    {message.text}
                                </div>
                            );
                        })}

                        {loading && (
                            <div className="max-w-[75%] rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Thinking...
                                </span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-border p-3">
                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a follow-up question..."
                                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!canSend}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                                aria-label="Send"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
