from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db, engine, Base
from app.models import User, WorkflowTemplate, WorkflowVersion, WorkflowInstance, NodeInstanceState, StepState, StepEvidence
from app.infrastructure.sqlalchemy_repository import SqlAlchemyWorkflowRepository, SqlAlchemyAuditRepository
from app.infrastructure.rag_adapter import FAISSRAGAdapter
from app.workflow_engine import StateManager, GraphTraverser
from app.agents.explanation_agent import ExplanationAgent
from app.agents import document_validator
from pydantic import BaseModel

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="LifeFlow.ai API", description="Procedural Intelligence Platform", lifespan=lifespan)

# --- Pydantic Schemas for API ---
class WorkflowCreate(BaseModel):
    user_id: int
    version_id: int
    docket_number: str

class EvidenceSubmit(BaseModel):
    evidence_type: str
    data: Dict[str, Any]

# --- Dependencies ---
def get_engine_components(db: Session = Depends(get_db)):
    workflow_repo = SqlAlchemyWorkflowRepository(db)
    audit_repo = SqlAlchemyAuditRepository(db)
    state_manager = StateManager(workflow_repo, audit_repo)
    traverser = GraphTraverser(workflow_repo, audit_repo)
    return state_manager, traverser

def get_explanation_agent():
    # In a real app, this might be a singleton or loaded selectively
    adapter = FAISSRAGAdapter()
    return ExplanationAgent(adapter)

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
def create_workflow(payload: WorkflowCreate, components = Depends(get_engine_components)):
    state_manager, traverser = components
    
    # Create Instance (Returns Domain Entity)
    instance = state_manager.create_instance(payload.user_id, payload.version_id, payload.docket_number)
    
    # Initialize first steps
    eligible = traverser.evaluate_next_steps(instance.id)
    
    return {"instance_id": instance.id, "status": instance.status, "eligible_steps": eligible}

@app.get("/workflows/{instance_id}/status")
def get_status(instance_id: int, db: Session = Depends(get_db)):
    # Direct read for status is okay, or use Repo
    repo = SqlAlchemyWorkflowRepository(db)
    instance = repo.get_instance(instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
        
    return {
        "instance_id": instance_id,
        "overall_status": instance.status,
        "steps": [{"node_id": ns.node_id, "state": ns.state} for ns in instance.node_states]
    }

@app.post("/workflows/{instance_id}/steps/{node_id}/submit")
def submit_evidence(instance_id: int, node_id: str, evidence: EvidenceSubmit, db: Session = Depends(get_db)):
    state_manager, traverser = get_engine_components(db)

    # 1. Validate Evidence
    validation = document_validator.validate_document(evidence.data, requirements={"required_fields": ["doc_id"]})
    
    if validation["status"] == "INVALID":
        raise HTTPException(status_code=400, detail=f"Invalid evidence: {validation['reason']}")

    # 2. Save Evidence (Evidence logic not fully refactored to domain yet, keeping minimal mixed usage for MVP Evidence)
    # Ideally: evidence_repo.save_evidence(...)
    # For now, we transition the step using the Domain Engine
    
    node_state = state_manager.transition_step(
        instance_id=instance_id,
        node_id=node_id,
        new_state=StepState.COMPLETED,
        actor_type="User",
        actor_id="1", 
        justification="Evidence submitted and validated"
    )
    
    # 3. Create Evidence Record (Direct DB for now as Evidence not in Domain Entity explicitly yet)
    # This is a bit of a leak, but acceptable for this stage of refactor
    # To be pure, we should add save_evidence to WorkflowRepository or step update
    ev_record = StepEvidence(
        node_instance_id=node_state.id, # Domain ID lines up with DB ID
        evidence_type=evidence.evidence_type,
        evidence_data=evidence.data,
        validation_status="VALID"
    )
    db.add(ev_record)
    db.commit()
    
    # 4. Trigger Traversal
    next_steps = traverser.evaluate_next_steps(instance_id)
    
    return {"status": "Step Completed", "next_eligible_steps": next_steps}

@app.get("/steps/explain")
def explain_step(step_name: str, jurisdiction: str = "General", agent: ExplanationAgent = Depends(get_explanation_agent)):
    return agent.explain_step(step_name, jurisdiction)
