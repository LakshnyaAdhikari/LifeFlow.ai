from sqlalchemy.orm import Session
from app.models import WorkflowInstance, WorkflowVersion, NodeInstanceState, StepState
from app.workflow_engine.state_transition import StateManager

class GraphTraverser:
    def __init__(self, db: Session):
        self.db = db
        self.state_manager = StateManager(db)

    def evaluate_next_steps(self, instance_id: int):
        """
        Analyzes the workflow graph and updates step statuses based on dependencies.
        Returns a list of eligible node IDs.
        """
        instance = self.db.query(WorkflowInstance).filter(WorkflowInstance.id == instance_id).first()
        if not instance:
            return []

        # Parse Graph Definition
        # Expected Format: {"nodes": [{"id": "A"}, ...], "edges": [{"from": "A", "to": "B"}]}
        graph = instance.version.graph_definition
        if not graph:
            return []
            
        edges = graph.get("edges", [])
        all_nodes = {n["id"] for n in graph.get("nodes", [])}
        
        # Build dependency map: child -> [parents]
        dependencies = {n: [] for n in all_nodes}
        for edge in edges:
            dependencies[edge["to"]].append(edge["from"])

        # Get current states
        current_states = {
            s.node_id: s.state 
            for s in self.db.query(NodeInstanceState).filter(NodeInstanceState.instance_id == instance_id).all()
        }

        eligible_nodes = []
        
        for node in all_nodes:
            # Skip if already started or completed or blocked
            current_state = current_states.get(node, StepState.PENDING)
            if current_state in [StepState.IN_PROGRESS, StepState.COMPLETED, StepState.BLOCKED, StepState.SKIPPED, StepState.ELIGIBLE]:
                continue
            
            # Check dependencies
            parents = dependencies[node]
            parents_completed = True
            for parent in parents:
                parent_state = current_states.get(parent, StepState.PENDING)
                # Simple logic: Parent must be COMPLETED or SKIPPED to proceed
                # Using a loose check here; strict mode might require COMPLETED only
                if parent_state not in [StepState.COMPLETED, StepState.SKIPPED]:
                    parents_completed = False
                    break
            
            if parents_completed:
                # Transition to ELIGIBLE
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
