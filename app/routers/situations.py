"""
Situation Router - Lifecycle Management APIs

Manages ongoing user situations across sessions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from loguru import logger

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User
from app.models.situation import UserSituation, SituationInteraction
from app.services.situation.context_builder import SituationContextBuilder, SituationContext
from app.services.intake.domain_classifier import get_domain_classifier


router = APIRouter(prefix="/situations", tags=["situations"])


class CreateSituationRequest(BaseModel):
    """Request to create a new situation"""
    description: str
    title: Optional[str] = None
    priority: Optional[str] = "normal"  # "urgent", "normal", "low"
    details: Optional[Dict[str, Any]] = None


class UpdateSituationRequest(BaseModel):
    """Request to update a situation"""
    interaction_type: str  # "query", "step_completed", "document_uploaded", "feedback"
    content: Dict[str, Any]
    updates: Optional[Dict[str, Any]] = None


class SituationResponse(BaseModel):
    """Response with situation details"""
    situation_id: int
    title: str
    primary_domain: str
    related_domains: List[str]
    status: str
    priority: str
    created_at: datetime
    last_interaction: datetime
    days_active: int


@router.post("/create", response_model=SituationResponse)
async def create_situation(
    payload: CreateSituationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new ongoing situation
    
    This represents a life event that may span multiple sessions
    """
    logger.info(f"Creating situation for user {current_user.id}: {payload.description[:100]}...")
    
    try:
        # 1. Classify domain
        classifier = get_domain_classifier()
        classification = await classifier.classify(payload.description)
        
        # 2. Create situation
        situation = UserSituation(
            user_id=current_user.id,
            title=payload.title or classification.user_friendly_summary,
            primary_domain=classification.primary_domain,
            related_domains=classification.related_domains,
            context={
                "initial_description": payload.description,
                "user_provided_details": payload.details or {},
                "classification": {
                    "confidence": classification.confidence,
                    "reasoning": classification.reasoning
                }
            },
            status="active",
            priority=payload.priority,
            domain_states={
                classification.primary_domain: {
                    "status": "active",
                    "completed_steps": [],
                    "pending_steps": []
                }
            }
        )
        
        db.add(situation)
        db.commit()
        db.refresh(situation)
        
        # 3. Log initial interaction
        interaction = SituationInteraction(
            situation_id=situation.id,
            interaction_type="created",
            content={
                "summary": "Situation created",
                "description": payload.description
            },
            context_snapshot=situation.context
        )
        db.add(interaction)
        db.commit()
        
        logger.info(f"Situation created: ID={situation.id}, domain={situation.primary_domain}")
        
        days_active = (datetime.utcnow() - situation.created_at).days
        
        return SituationResponse(
            situation_id=situation.id,
            title=situation.title,
            primary_domain=situation.primary_domain,
            related_domains=situation.related_domains or [],
            status=situation.status,
            priority=situation.priority,
            created_at=situation.created_at,
            last_interaction=situation.last_interaction,
            days_active=days_active
        )
    
    except Exception as e:
        logger.error(f"Failed to create situation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create situation: {str(e)}")


@router.post("/{situation_id}/update")
async def update_situation(
    situation_id: int,
    payload: UpdateSituationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update situation with new information
    """
    logger.info(f"Updating situation {situation_id}: {payload.interaction_type}")
    
    try:
        # Get situation
        situation = db.query(UserSituation).filter(
            UserSituation.id == situation_id,
            UserSituation.user_id == current_user.id
        ).first()
        
        if not situation:
            raise HTTPException(status_code=404, detail="Situation not found")
        
        # Log interaction
        interaction = SituationInteraction(
            situation_id=situation_id,
            interaction_type=payload.interaction_type,
            content=payload.content,
            context_snapshot=situation.context
        )
        db.add(interaction)
        
        # Update context if provided
        if payload.updates:
            situation.context = {**situation.context, **payload.updates}
        
        # Update last interaction time
        situation.last_interaction = datetime.utcnow()
        situation.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Situation {situation_id} updated successfully")
        
        return {"status": "updated", "situation_id": situation_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update situation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update situation: {str(e)}")


@router.get("/{situation_id}", response_model=Dict[str, Any])
async def get_situation(
    situation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get situation details with full context
    """
    try:
        # Get situation
        situation = db.query(UserSituation).filter(
            UserSituation.id == situation_id,
            UserSituation.user_id == current_user.id
        ).first()
        
        if not situation:
            raise HTTPException(status_code=404, detail="Situation not found")
        
        # Build context
        context_builder = SituationContextBuilder(db)
        context = await context_builder.build_context(situation)
        
        return {
            "situation": {
                "id": situation.id,
                "title": situation.title,
                "primary_domain": situation.primary_domain,
                "related_domains": situation.related_domains or [],
                "status": situation.status,
                "priority": situation.priority,
                "created_at": situation.created_at.isoformat(),
                "last_interaction": situation.last_interaction.isoformat(),
                "clarification_questions": situation.clarification_questions or [],
                "clarification_answers": situation.clarification_answers or []
            },
            "context": context.dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get situation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get situation: {str(e)}")


@router.get("/", response_model=List[SituationResponse])
async def list_situations(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all situations for current user
    """
    try:
        query = db.query(UserSituation).filter(UserSituation.user_id == current_user.id)
        
        if status:
            query = query.filter(UserSituation.status == status)
        
        situations = query.order_by(UserSituation.last_interaction.desc()).all()
        
        return [
            SituationResponse(
                situation_id=s.id,
                title=s.title,
                primary_domain=s.primary_domain,
                related_domains=s.related_domains or [],
                status=s.status,
                priority=s.priority,
                created_at=s.created_at,
                last_interaction=s.last_interaction,
                days_active=(datetime.utcnow() - s.created_at).days
            )
            for s in situations
        ]
    
    except Exception as e:
        logger.error(f"Failed to list situations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list situations: {str(e)}")
