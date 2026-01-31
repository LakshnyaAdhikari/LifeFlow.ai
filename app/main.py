from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db, engine, Base
from app.models import User, WorkflowTemplate, WorkflowVersion, WorkflowInstance, NodeInstanceState, StepState, StepEvidence
from app.workflow_engine import StateManager, GraphTraverser
from app.agents import explanation_agent, document_validator
from pydantic import BaseModel

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="LifeFlow.ai API", description="Procedural Intelligence Platform")

# --- Pydantic Schemas ---
class WorkflowCreate(BaseModel):
    user_id: int
    version_id: int
    docket_number: str

class EvidenceSubmit(BaseModel):
    evidence_type: str
    data: Dict[str, Any]

# --- Endpoints ---

@app.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    """Seeds a demo 'Death in Family' workflow template."""
    if db.query(User).filter(User.email == "demo@example.com").first():
        return {"message": "Already seeded"}
        
    user = User(email="demo@example.com", full_name="Demo User")
    db.add(user)
    
    template = WorkflowTemplate(name="Death in Family", description="Handling estate and administration.")
    db.add(template)
    db.commit()
    
    # Simple linear graph: A -> B -> C
    graph = {
        "nodes": [
            {"id": "step_1", "description": "Obtain Death Certificate"},
            {"id": "step_2", "description": "Locate Will"},
            {"id": "step_3", "description": "Notify Banks"}
        ],
        "edges": [
            {"from": "step_1", "to": "step_2"},
            {"from": "step_2", "to": "step_3"}
        ]
    }
    
    version = WorkflowVersion(
        template_id=template.id,
        version_number=1,
        graph_definition=graph, 
        source_refs=["https://govt.example/probate"]
    )
    db.add(version)
    db.commit()
    return {"message": "Seeded", "user_id": user.id, "version_id": version.id}

@app.post("/workflows")
def create_workflow(payload: WorkflowCreate, db: Session = Depends(get_db)):
    state_manager = StateManager(db)
    instance = state_manager.create_instance(payload.user_id, payload.version_id, payload.docket_number)
    
    # Initialize first steps
    traverser = GraphTraverser(db)
    eligible = traverser.evaluate_next_steps(instance.id)
    
    return {"instance_id": instance.id, "status": instance.status, "eligible_steps": eligible}

@app.get("/workflows/{instance_id}/status")
def get_status(instance_id: int, db: Session = Depends(get_db)):
    instance = db.query(WorkflowInstance).filter(WorkflowInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
        
    nodes = db.query(NodeInstanceState).filter(NodeInstanceState.instance_id == instance_id).all()
    return {
        "instance_id": instance_id,
        "overall_status": instance.status,
        "steps": [{"node_id": n.node_id, "state": n.state} for n in nodes]
    }

@app.post("/workflows/{instance_id}/steps/{node_id}/submit")
def submit_evidence(instance_id: int, node_id: str, evidence: EvidenceSubmit, db: Session = Depends(get_db)):
    # 1. Validate Evidence
    # Mocking requirements fetch
    validation = document_validator.validate_document(evidence.data, requirements={"required_fields": ["doc_id"]})
    
    if validation["status"] == "INVALID":
        raise HTTPException(status_code=400, detail=f"Invalid evidence: {validation['reason']}")

    # 2. Save Evidence
    state_manager = StateManager(db)
    # Transition to IN_PROGRESS or COMPLETED? For simplicity, we complete immediately upon valid submission
    node_state = state_manager.transition_step(
        instance_id=instance_id,
        node_id=node_id,
        new_state=StepState.COMPLETED,
        actor_type="User",
        actor_id="1", # simplified
        justification="Evidence submitted and validated"
    )
    
    # 3. Create Evidence Record
    ev_record = StepEvidence(
        node_instance_id=node_state.id,
        evidence_type=evidence.evidence_type,
        evidence_data=evidence.data,
        validation_status="VALID"
    )
    db.add(ev_record)
    db.commit()
    
    # 4. Trigger Traversal for next steps
    traverser = GraphTraverser(db)
    next_steps = traverser.evaluate_next_steps(instance_id)
    
    return {"status": "Step Completed", "next_eligible_steps": next_steps}

@app.get("/steps/explain")
def explain_step(step_name: str, jurisdiction: str = "General"):
    return explanation_agent.explain_step(step_name, jurisdiction)
