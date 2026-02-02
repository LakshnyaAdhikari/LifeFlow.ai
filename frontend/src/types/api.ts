export interface ReassuranceMetadata {
    time_expectation?: string;
    risk_if_skipped?: "None" | "Low" | "Medium" | "High";
    common_delays?: string;
    value_prop?: string;
}

export interface ContentVariation {
    title: string;
    description: string;
    action_label?: string;
}

export interface StepNodeDefinition {
    id: string;
    step_type: "action" | "informational" | "milestone";
    layman: ContentVariation;
    professional: ContentVariation;
    suggestion_level: "suggested" | "critical" | "optional";
    reassurance?: ReassuranceMetadata;
}

export interface JourneyStep extends StepNodeDefinition {
    state: "PENDING" | "ELIGIBLE" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "SKIPPED";
    dependencies: string[];
}

export interface WorkflowPreview {
    template_id: number;
    version_id: number;
    title: string;
    description: string;
    match_reason: string;
}

// Helper types
export type Mode = "LAYMAN" | "PROFESSIONAL";
