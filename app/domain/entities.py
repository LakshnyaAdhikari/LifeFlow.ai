from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Optional

class StepType(str, Enum):
    REQUIRED = "REQUIRED"
    OPTIONAL = "OPTIONAL"
    CONDITIONAL = "CONDITIONAL"

class StepState(str, Enum):
    PENDING = "PENDING"
    ELIGIBLE = "ELIGIBLE"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"

@dataclass
class WorkflowVersion:
    id: int
    template_id: int
    version_number: int
    graph_definition: Dict[str, Any]
    source_refs: List[str]
    effective_from: datetime = field(default_factory=datetime.utcnow)

@dataclass
class NodeInstanceState:
    id: Optional[int]
    instance_id: int
    node_id: str
    state: StepState = StepState.PENDING
    blocking_reason: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

@dataclass
class WorkflowInstance:
    id: Optional[int]
    user_id: int
    version_id: int
    docket_number: str
    status: str
    version: Optional[WorkflowVersion] = None
    node_states: List[NodeInstanceState] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def get_node_state(self, node_id: str) -> Optional[NodeInstanceState]:
        for ns in self.node_states:
            if ns.node_id == node_id:
                return ns
        return None

@dataclass
class ActionLog:
    id: Optional[int]
    instance_id: int
    actor_type: str
    actor_id: str
    action: str
    details: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.utcnow)
