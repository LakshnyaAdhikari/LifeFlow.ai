"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ExternalLink, Loader2, MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ClarificationAnswer,
    FollowUpChatResponse,
    FollowUpChatTurn,
    GuidanceResponse,
} from "@/types/guidance";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    text: string;
    citations?: FollowUpChatResponse["citations"];
    confidence?: number;
    followUpQuestions?: string[];
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
}: FollowUpChatbotProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            text:
                "Ask anything about this case. I will answer in plain language using your situation context and official sources.",
        },
    ]);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
                text: detail || "Session expired. Please log in again to continue.",
            },
        ]);
        setTimeout(() => {
            router.push(`/auth/login?next=/situation/${situationId}`);
        }, 500);
    };

    const buildHistoryPayload = (): FollowUpChatTurn[] => {
        return messages
            .filter((m) => m.id !== "welcome")
            .slice(-8)
            .map((m) => ({
                role: m.role,
                content: m.text,
            }));
    };

    const sendMessage = async (explicitText?: string) => {
        const text = (explicitText ?? input).trim();
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
            const res = await fetch("http://127.0.0.1:8000/guidance/followup-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    situation_id: situationId,
                    message: text,
                    clarification_answers: clarificationAnswers,
                    history: buildHistoryPayload(),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const detail = errorData?.detail || "Failed to get follow-up answer.";
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

            const reply: FollowUpChatResponse = await res.json();
            setMessages((prev) => [
                ...prev,
                {
                    id: `a-${Date.now()}`,
                    role: "assistant",
                    text: reply.answer,
                    citations: reply.citations || [],
                    confidence: reply.confidence,
                    followUpQuestions: reply.follow_up_questions || [],
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `a-net-${Date.now()}`,
                    role: "assistant",
                    text: "Network issue while generating follow-up answer. Please try again.",
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
                        "bottom-20 right-5 w-[380px] max-w-[calc(100vw-2rem)] h-[600px]",
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
                                <p className="text-xs text-muted-foreground">Context-aware follow-up chat</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{domain}</p>
                    </div>

                    <div className="h-[470px] overflow-y-auto px-4 py-3 space-y-3">
                        {messages.map((message) => {
                            if (message.role === "user") {
                                return (
                                    <div key={message.id} className="flex justify-end">
                                        <div className="max-w-[88%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground whitespace-pre-wrap">
                                            {message.text}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={message.id} className="max-w-[94%] rounded-xl border border-border bg-background p-3">
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>

                                    {typeof message.confidence === "number" && (
                                        <p className="mt-2 text-[11px] text-muted-foreground">
                                            Confidence {(message.confidence * 100).toFixed(0)}%
                                        </p>
                                    )}

                                    {!!message.citations?.length && (
                                        <div className="mt-2 border-t border-border pt-2 space-y-1">
                                            <p className="text-[11px] font-medium text-muted-foreground">Sources</p>
                                            {message.citations.slice(0, 3).map((citation, idx) => (
                                                <div key={`${message.id}-src-${idx}`} className="text-xs">
                                                    {citation.url && !citation.url.startsWith("file://") ? (
                                                        <a
                                                            href={citation.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-primary hover:underline"
                                                        >
                                                            {citation.title}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="font-medium">{citation.title}</span>
                                                    )}
                                                    <p className="text-muted-foreground">{citation.authority}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!!message.followUpQuestions?.length && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {message.followUpQuestions.slice(0, 2).map((q, idx) => (
                                                <button
                                                    key={`${message.id}-q-${idx}`}
                                                    onClick={() => sendMessage(q)}
                                                    className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
                                onClick={() => sendMessage()}
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
