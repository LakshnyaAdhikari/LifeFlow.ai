from typing import List, Optional, Dict, Literal
from pydantic import BaseModel, Field

# --- Core "Human-First" Metadata ---

class ReassuranceMetadata(BaseModel):
    """
    Metadata explicitly designed to calm the user.
    """
    time_expectation: Optional[str] = Field(None, description="e.g. '15 mins', 'Wait 3 days'")
    risk_if_skipped: Literal["None", "Low", "Medium", "High"] = "None"
    common_delays: Optional[str] = Field(None, description="e.g. 'Government offices are closed on weekends'")
    value_prop: Optional[str] = Field(None, description="Why should I do this? e.g. 'Protects your assets'")

class ContentVariation(BaseModel):
    """
    Dual-mode content: Simple for Layman, Precise for Professional.
    """
    title: str
    description: str
    action_label: Optional[str] = None

class StepNodeDefinition(BaseModel):
    """
    The enriched definition of a step in the workflow graph.
    This replaces the simple dict used previously.
    """
    id: str
    step_type: Literal["action", "informational", "milestone"] = "action"
    
    # Dual Modes
    layman: ContentVariation
    professional: ContentVariation
    
    # Guidance
    suggestion_level: Literal["suggested", "critical", "optional"] = "suggested"
    reassurance: Optional[ReassuranceMetadata] = None
    
    # Mechanics
    input_schema: Optional[Dict] = None # JSON Schema for data collection if needed

class WorkflowGraph(BaseModel):
    """
    Validated graph structure.
    """
    nodes: List[StepNodeDefinition]
    edges: List[Dict[str, str]] # {"from": "A", "to": "B"}

class JourneyStep(StepNodeDefinition):
    """
    A step enriched with runtime state for the Journey Map.
    """
    state: Literal["PENDING", "ELIGIBLE", "IN_PROGRESS", "BLOCKED", "COMPLETED", "SKIPPED"] = "PENDING"
    dependencies: List[str] = []
