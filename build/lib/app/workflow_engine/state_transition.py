from datetime import datetime
from app.domain.entities import StepState, ActionLog, NodeInstanceState, WorkflowInstance
from app.interfaces.repositories import WorkflowRepository, AuditRepository

class StateManager:
    def __init__(self, workflow_repo: WorkflowRepository, audit_repo: AuditRepository):
        self.workflow_repo = workflow_repo
        self.audit_repo = audit_repo

    def transition_step(self, instance_id: int, node_id: str, new_state: StepState, actor_type: str, actor_id: str, justification: str = None) -> NodeInstanceState:
        """
        Transitions a step to a new state and logs the action using abstract repositories.
        """
        instance = self.workflow_repo.get_instance(instance_id)
        if not instance:
            raise ValueError(f"WorkflowInstance {instance_id} not found")

        # Find or create node state in domain object (Repository handles persistence)
        node_state = instance.get_node_state(node_id)
        
        if not node_state:
            node_state = NodeInstanceState(
                id=None, # New state
                instance_id=instance_id, 
                node_id=node_id, 
                state=StepState.PENDING
            )
        
        old_state = node_state.state
        node_state.state = new_state
        
        if new_state == StepState.IN_PROGRESS and not node_state.started_at:
            node_state.started_at = datetime.utcnow()
        if new_state == StepState.COMPLETED:
            node_state.completed_at = datetime.utcnow()

        # Persist State Update
        saved_node_state = self.workflow_repo.update_node_state(node_state)

        # Audit Log
        log = ActionLog(
            id=None,
            instance_id=instance_id,
            actor_type=actor_type,
            actor_id=actor_id,
            action="TRANSITION_STEP",
            details={
                "node_id": node_id,
                "from_state": old_state,
                "to_state": new_state,
                "justification": justification
            }
        )
        self.audit_repo.log_action(log)
        
        return saved_node_state
    
    def create_instance(self, user_id: int, version_id: int, docket_number: str) -> WorkflowInstance:
        """
        Creates a new domain workflow instance.
        """
        instance = WorkflowInstance(
            id=None,
            user_id=user_id,
            version_id=version_id,
            docket_number=docket_number,
            status="ACTIVE"
        )
        saved_instance = self.workflow_repo.create_instance(instance)
        
        # Log creation
        log = ActionLog(
            id=None,
            instance_id=saved_instance.id,
            actor_type="System",
            actor_id="System",
            action="CREATE_WORKFLOW",
            details={"version_id": version_id}
        )
        self.audit_repo.log_action(log)
        
        return saved_instance
