from app.domain.entities import StepState
from app.interfaces.repositories import WorkflowRepository, AuditRepository
from app.workflow_engine.state_transition import StateManager

class GraphTraverser:
    def __init__(self, workflow_repo: WorkflowRepository, audit_repo: AuditRepository):
        self.workflow_repo = workflow_repo
        self.state_manager = StateManager(workflow_repo, audit_repo)

    def evaluate_next_steps(self, instance_id: int):
        """
        Pure logic traversal using domain entities.
        """
        instance = self.workflow_repo.get_instance(instance_id)
        if not instance:
            return []

        # Convert Dict to Domain/Dict access
        if not instance.version or not instance.version.graph_definition:
             return []

        graph = instance.version.graph_definition
        edges = graph.get("edges", [])
        all_nodes = {n["id"] for n in graph.get("nodes", [])}
        
        dependencies = {n: [] for n in all_nodes}
        for edge in edges:
            dependencies[edge["to"]].append(edge["from"])

        # Map current states from Domain Entity
        current_states = {
            ns.node_id: ns.state 
            for ns in instance.node_states
        }

        eligible_nodes = []
        
        for node in all_nodes:
            current_state = current_states.get(node, StepState.PENDING)
            
            # Using Enum comparison
            if current_state in [StepState.IN_PROGRESS, StepState.COMPLETED, StepState.BLOCKED, StepState.SKIPPED, StepState.ELIGIBLE]:
                continue
            
            parents = dependencies[node]
            parents_completed = True
            for parent in parents:
                parent_state = current_states.get(parent, StepState.PENDING)
                if parent_state not in [StepState.COMPLETED, StepState.SKIPPED]:
                    parents_completed = False
                    break
            
            if parents_completed:
                self.state_manager.transition_step(
                    instance_id=instance_id,
                    node_id=node,
                    new_state=StepState.ELIGIBLE,
                    actor_type="System",
                    actor_id="GraphTraverser",
                    justification="All dependencies met."
                )
                eligible_nodes.append(node)
                
        return eligible_nodes
