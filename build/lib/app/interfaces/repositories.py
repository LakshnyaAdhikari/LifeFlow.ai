from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities import WorkflowInstance, NodeInstanceState, ActionLog, WorkflowVersion

class WorkflowRepository(ABC):
    @abstractmethod
    def get_instance(self, instance_id: int) -> Optional[WorkflowInstance]:
        """Retrieve a full workflow instance by ID."""
        pass

    @abstractmethod
    def create_instance(self, instance: WorkflowInstance) -> WorkflowInstance:
        """Persist a new workflow instance."""
        pass

    @abstractmethod
    def update_node_state(self, node_state: NodeInstanceState) -> NodeInstanceState:
        """Update or create the state of a specific node."""
        pass

    @abstractmethod
    def get_version(self, version_id: int) -> Optional[WorkflowVersion]:
        """Retrieve a specific workflow version."""
        pass

class AuditRepository(ABC):
    @abstractmethod
    def log_action(self, action: ActionLog) -> ActionLog:
        """Persist an audit log entry."""
        pass

class KnowledgeRetriever(ABC):
    @abstractmethod
    def retrieve_context(self, query: str, context_keys: dict = None) -> List[dict]:
        """
        Retrieve relevant knowledge context.
        Returns list of {"content": str, "source": str, "score": float}
        """
        pass
