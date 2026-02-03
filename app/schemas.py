from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ContentVariation(BaseModel):
    title: str
    description: str
    action_label: Optional[str] = None

class ReassuranceMetadata(BaseModel):
    time_expectation: Optional[str] = None
    value_prop: Optional[str] = None
    risk_if_skipped: Optional[str] = None

class StepNodeDefinition(BaseModel):
    id: str
    type: str
    layman: ContentVariation
    reassurance: Optional[ReassuranceMetadata] = None
    suggestion_level: Optional[str] = "normal"

class WorkflowGraph(BaseModel):
    nodes: List[StepNodeDefinition]
    edges: List[Dict[str, Any]]

class JourneyStep(BaseModel):
    id: str
    type: str
    state: str  # ELIGIBLE, PENDING, COMPLETED, BLOCKED
    layman: ContentVariation
    reassurance: Optional[ReassuranceMetadata] = None
    suggestion_level: Optional[str] = "normal"
    
    class Config:
        from_attributes = True
