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

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# --- Guidance API Schemas ---
class IntakeRequest(BaseModel):
    user_message: str

class WorkflowPreview(BaseModel):
    template_id: int
    title: str
    description: str
    match_reason: str

# --- Endpoints ---

@app.post("/intake/situational", response_model=List[WorkflowPreview])
def intake_situational(payload: IntakeRequest, db: Session = Depends(get_db)):
    """
    Analyzes the user's situation and suggests relevant workflows.
    (Mock implementation using keyword matching for MVP)
    """
    message = payload.user_message.lower()
    results = []
    
    # Simple Keyword Matching
    templates = db.query(WorkflowTemplate).all()
    for t in templates:
        score = 0
        reason = ""
        
        # Mock Logic
        if "death" in message or "died" in message or "passed away" in message:
            if "death" in t.name.lower():
                score += 10
                reason = "It sounds like you are dealing with a loss."
        
        if score > 0:
            results.append(WorkflowPreview(
                template_id=t.id,
                title=t.name,
                description=t.description,
                match_reason=reason
            ))
            
    return results

@app.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    """Seeds a demo 'Death in Family' workflow template with Human-First metadata."""
    from app.schemas import WorkflowGraph, StepNodeDefinition, ContentVariation, ReassuranceMetadata
    
    # Check for v2 user
    email = "demo_human_first@example.com"
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        # Get the template/version
        template = db.query(WorkflowTemplate).filter(WorkflowTemplate.name == "Human-First Demo: Death in Family").first()
        version_id = None
        if template and template.versions:
            version_id = template.versions[0].id
        return {"message": "Already seeded", "user_id": existing_user.id, "version_id": version_id}
        
    user = User(email=email, full_name="Demo User V2")
    db.add(user)
    
    template = WorkflowTemplate(name="Human-First Demo: Death in Family", description="Handling estate and administration.")
    db.add(template)
    db.commit()
    
    # Human-First Graph Definition
    graph_data = WorkflowGraph(
        nodes=[
            StepNodeDefinition(
                id="step_1",
                step_type="action",
                layman=ContentVariation(
                    title="Obtain Death Certificate",
                    description="This is the official document that proves the death. You'll need multiple copies regarding banks and insurance.",
                    action_label="I have the certificates"
                ),
                professional=ContentVariation(
                    title="Procure Certified Death Certificates",
                    description="Request certified copies from the county clerk or funeral director. Required for 401k, probate, and title transfers.",
                    action_label="Certificates Verified"
                ),
                suggestion_level="critical",
                reassurance=ReassuranceMetadata(
                    time_expectation="1-2 weeks",
                    risk_if_skipped="High",
                    common_delays="County clerk backlog",
                    value_prop="Unlocks all other accounts"
                )
            ),
            StepNodeDefinition(
                id="step_2",
                step_type="informational",
                layman=ContentVariation(
                    title="Locate the Will",
                    description="Check their safe places, safety deposit boxes, or ask their lawyer. If you can't find it, don't panic.",
                    action_label="Found it / No Will exists"
                ),
                professional=ContentVariation(
                    title="Locate Last Will and Testament",
                    description="Identify the executor and beneficiaries. If intestate, determine administrator priority.",
                    action_label="Will Reviewed"
                ),
                suggestion_level="suggested",
                reassurance=ReassuranceMetadata(
                    time_expectation="1-5 days",
                    risk_if_skipped="Medium",
                    value_prop="Determines who is in charge"
                )
            ),
            StepNodeDefinition(
                id="step_3",
                step_type="action",
                layman=ContentVariation(
                    title="Notify Banks",
                    description="Let their main bank know. They will freeze the accounts to keep the money safe.",
                    action_label="Banks Notified"
                ),
                professional=ContentVariation(
                    title="Notify Financial Institutions",
                    description="Provide death certificate to Freeze accounts. prevents unauthorized withdrawals and triggers Date of Death valuation.",
                    action_label="Accounts Frozen"
                ),
                suggestion_level="suggested",
                reassurance=ReassuranceMetadata(
                    time_expectation="1 day",
                    risk_if_skipped="Medium",
                    common_delays="Need appt with branch manager"
                )
            )
        ],
        edges=[
            {"from": "step_1", "to": "step_2"},
            {"from": "step_2", "to": "step_3"}
        ]
    )
    
    version = WorkflowVersion(
        template_id=template.id,
        version_number=1,
        graph_definition=graph_data.model_dump(), 
        source_refs=["https://govt.example/probate"]
    )
    db.add(version)
    db.commit()
    return {"message": "Seeded Human-First Workflow", "user_id": user.id, "version_id": version.id}

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

@app.get("/workflows/{instance_id}/journey_map")
def get_journey_map(instance_id: int, db: Session = Depends(get_db)):
    """
    Returns the full "Journey Map" merging the static definition with dynamic state.
    Enable the frontend to show "what's next" and "suggested" paths.
    """
    try:
        from app.schemas import JourneyStep
        repo = SqlAlchemyWorkflowRepository(db)
        instance = repo.get_instance(instance_id)
        if not instance:
            raise HTTPException(status_code=404, detail="Instance not found")
            
        # 1. Get Graph Structure
        if not instance.version:
             raise HTTPException(status_code=500, detail=f"Instance {instance_id} has no version attached")

        graph = instance.version.graph_definition 
        
        nodes_data = graph.get("nodes", [])
        edges_data = graph.get("edges", [])
        
        # Map dependencies
        dependencies = {n["id"]: [] for n in nodes_data}
        for edge in edges_data:
            if edge["to"] in dependencies:
                dependencies[edge["to"]].append(edge["from"])
                
        # 2. Get Current States
        current_states = {ns.node_id: ns.state for ns in instance.node_states}
        
        # 3. Build Journey Steps
        journey_steps = []
        for n in nodes_data:
            # Pydantic model creation
            step = JourneyStep(
                **n,
                state=current_states.get(n["id"], "PENDING"),
                dependencies=dependencies.get(n["id"], [])
            )
            journey_steps.append(step)
            
        return {"steps": journey_steps}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

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
