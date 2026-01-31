from sqlalchemy.orm import Session
from datetime import datetime
from app.models import WorkflowInstance, NodeInstanceState, ActionLog, StepState
import json

class StateManager:
    def __init__(self, db: Session):
        self.db = db

    def transition_step(self, instance_id: int, node_id: str, new_state: StepState, actor_type: str, actor_id: str, justification: str = None):
        """
        Transitions a specific step to a new state and logs the action.
        """
        instance = self.db.query(WorkflowInstance).filter(WorkflowInstance.id == instance_id).first()
        if not instance:
            raise ValueError(f"WorkflowInstance {instance_id} not found")

        # Find or create the node state
        node_state = self.db.query(NodeInstanceState).filter(
            NodeInstanceState.instance_id == instance_id,
            NodeInstanceState.node_id == node_id
        ).first()

        if not node_state:
            node_state = NodeInstanceState(instance_id=instance_id, node_id=node_id, state=StepState.PENDING)
            self.db.add(node_state)
        
        old_state = node_state.state
        node_state.state = new_state
        
        if new_state == StepState.IN_PROGRESS and not node_state.started_at:
            node_state.started_at = datetime.utcnow()
        if new_state == StepState.COMPLETED:
            node_state.completed_at = datetime.utcnow()

        # Audit Log
        log = ActionLog(
            instance_id=instance_id,
            actor_type=actor_type,
            actor_id=actor_id,
            action=f"TRANSITION_STEP",
            details={
                "node_id": node_id,
                "from_state": old_state,
                "to_state": new_state,
                "justification": justification
            }
        )
        self.db.add(log)
        self.db.commit()
        return node_state
    
    def create_instance(self, user_id: int, version_id: int, docket_number: str):
        """
        Creates a new workflow instance.
        """
        instance = WorkflowInstance(
            user_id=user_id,
            version_id=version_id,
            docket_number=docket_number,
            status="ACTIVE"
        )
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        
        # Log creation
        log = ActionLog(
            instance_id=instance.id,
            actor_type="System",
            action="CREATE_WORKFLOW",
            details={"version_id": version_id}
        )
        self.db.add(log)
        self.db.commit()
        
        return instance
