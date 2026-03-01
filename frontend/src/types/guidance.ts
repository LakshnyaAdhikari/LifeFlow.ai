export interface ClarificationAnswer {
    question_id: string;
    question_text: string;
    answer: string;
}

export interface Suggestion {
    title: string;
    description: string;
    why_it_matters: string;
    urgency: "high" | "medium" | "low" | string;
    can_skip: boolean;
    estimated_time?: string;
}

export interface GuidanceSource {
    title: string;
    authority: string;
    document_id: number;
    url?: string;
}

export interface GuidanceResponse {
    suggestions: Suggestion[];
    sources: GuidanceSource[];
    confidence: {
        score: number;
        reliability: "high" | "medium" | "low" | string;
        explanation: string;
        breakdown: {
            llm: number;
            retrieval: number;
            historical: number;
        };
    };
    caveats: string[];
    cross_domain_insights: string[];
    metadata: {
        session_id: number;
        chunks_retrieved: number;
        domain: string;
    };
}

export interface FollowUpCitation {
    title: string;
    authority: string;
    url?: string | null;
    document_id?: number | null;
}

export interface FollowUpChatTurn {
    role: "user" | "assistant";
    content: string;
}

export interface FollowUpChatResponse {
    answer: string;
    citations: FollowUpCitation[];
    confidence: number;
    follow_up_questions: string[];
    style: string;
}
