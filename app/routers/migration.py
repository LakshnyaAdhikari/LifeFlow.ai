"""
Migration Router

Provides endpoints to migrate from old workflow system to new situation system
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User, WorkflowInstance
from app.models.situation import UserSituation
from app.services.intake.domain_classifier import DomainClassifier
from app.services.llm.client import get_llm_client


router = APIRouter(prefix="/migrate", tags=["migration"])


class MigrationRequest(BaseModel):
    """Request to migrate workflow to situation"""
    workflow_instance_id: int


class MigrationResponse(BaseModel):
    """Response from migration"""
    success: bool
    situation_id: Optional[int] = None
    message: str
    details: dict


@router.post("/workflow-to-situation", response_model=MigrationResponse)
async def migrate_workflow_to_situation(
    payload: MigrationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Migrate an old workflow instance to a new situation
    
    This preserves user data and provides a smooth transition
    """
    try:
        # Get workflow instance
        workflow = db.query(WorkflowInstance).filter(
            WorkflowInstance.id == payload.workflow_instance_id,
            WorkflowInstance.user_id == current_user.id
        ).first()
        
        if not workflow:
            raise HTTPException(
                status_code=404,
                detail="Workflow instance not found or not owned by user"
            )
        
        # Check if already migrated
        existing_situation = db.query(UserSituation).filter(
            UserSituation.context.contains({"migrated_from_workflow_id": workflow.id})
        ).first()
        
        if existing_situation:
            return MigrationResponse(
                success=True,
                situation_id=existing_situation.id,
                message="Workflow already migrated",
                details={"situation_id": existing_situation.id}
            )
        
        # Extract workflow data
        workflow_data = {
            "template_name": workflow.version.template.name if workflow.version and workflow.version.template else "Unknown",
            "status": workflow.status,
            "created_at": workflow.created_at.isoformat() if workflow.created_at else None,
            "node_states": [
                {
                    "node_id": ns.node_id,
                    "state": ns.state,
                    "completed_at": ns.completed_at.isoformat() if ns.completed_at else None
                }
                for ns in workflow.node_states
            ]
        }
        
        # Classify domain from workflow template name
        llm_client = get_llm_client()
        classifier = DomainClassifier(llm_client)
        
        description = f"User working on: {workflow_data['template_name']}"
        classification = await classifier.classify(description)
        
        # Create situation
        situation = UserSituation(
            user_id=current_user.id,
            title=workflow_data['template_name'],
            primary_domain=classification.primary_domain,
            related_domains=classification.related_domains,
            context={
                "migrated_from_workflow_id": workflow.id,
                "original_workflow_data": workflow_data,
                "migration_date": datetime.utcnow().isoformat()
            },
            domain_states={
                classification.primary_domain: {
                    "status": "migrated",
                    "completed_steps": [
                        ns["node_id"] for ns in workflow_data["node_states"]
                        if ns["state"] == "COMPLETED"
                    ]
                }
            },
            status="active" if workflow.status == "IN_PROGRESS" else "resolved",
            priority="normal"
        )
        
        db.add(situation)
        db.commit()
        db.refresh(situation)
        
        logger.info(
            f"Migrated workflow {workflow.id} to situation {situation.id} "
            f"for user {current_user.id}"
        )
        
        return MigrationResponse(
            success=True,
            situation_id=situation.id,
            message="Workflow successfully migrated to situation",
            details={
                "situation_id": situation.id,
                "domain": classification.primary_domain,
                "preserved_steps": len(workflow_data["node_states"])
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Migration failed: {str(e)}"
        )


@router.get("/migration-status")
async def get_migration_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get migration status for current user
    """
    try:
        # Count old workflows
        total_workflows = db.query(WorkflowInstance).filter(
            WorkflowInstance.user_id == current_user.id
        ).count()
        
        # Count migrated situations
        migrated_situations = db.query(UserSituation).filter(
            UserSituation.user_id == current_user.id,
            UserSituation.context.contains({"migrated_from_workflow_id"})
        ).count()
        
        # Count new situations
        new_situations = db.query(UserSituation).filter(
            UserSituation.user_id == current_user.id,
            ~UserSituation.context.contains({"migrated_from_workflow_id"})
        ).count()
        
        return {
            "total_workflows": total_workflows,
            "migrated_situations": migrated_situations,
            "new_situations": new_situations,
            "migration_complete": total_workflows == migrated_situations,
            "recommendation": (
                "All workflows migrated!" if total_workflows == migrated_situations
                else f"Migrate {total_workflows - migrated_situations} remaining workflows"
            )
        }
    
    except Exception as e:
        logger.error(f"Failed to get migration status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get migration status: {str(e)}"
        )


from datetime import datetime
