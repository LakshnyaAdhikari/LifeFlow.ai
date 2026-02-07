"""
New Intake Router - ML-Driven Domain Resolution

Replaces hard-coded /intake/situational endpoint
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from loguru import logger

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User
from app.models.situation import UserSituation
from app.services.intake.question_generator import get_clarification_generator, ClarificationQuestion

class IntakeResponse(BaseModel):
    """Response with domain classification and risk assessment"""
    situation_id: Optional[int] = None  # ID of created situation
    primary_domain: str
    secondary_domain: Optional[str] = None
    related_domains: List[str] = []
    confidence: float
    user_friendly_summary: str
    suggested_keywords: List[str] = []
    reasoning: str
    risk_assessment: Optional[RiskAssessment] = None
    clarifying_questions: List[ClarificationQuestion] = []  # [NEW] Structured questions


@router.post("/resolve", response_model=IntakeResponse)
async def resolve_domain(
    payload: IntakeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resolve user query to domain using ML classification
    
    NO hard-coded examples - purely ML-driven
    
    This is the NEW intake endpoint that replaces /intake/situational
    """
    logger.info(f"Intake request from user {current_user.id}: {payload.user_message[:100]}...")
    
    try:
        # 1. Classify domain using ML
        classifier = get_domain_classifier()
        classification: DomainClassification = await classifier.classify(payload.user_message)
        
        # 2. Assess legal risk
        boundary_detector = LegalBoundaryDetector()
        risk_assessment = await boundary_detector.assess_risk(
            query=payload.user_message,
            domain=classification.primary_domain
        )
        
        # 3. Create Situation record
        situation = UserSituation(
            user_id=current_user.id,
            title=payload.user_message[:100],  # Use first 100 chars as title
            primary_domain=classification.primary_domain,
            status="active"
        )
        db.add(situation)
        db.commit()
        db.refresh(situation)
        
        # 4. Generate Clarifying Questions [NEW]
        # This replaces immediate RAG generation
        generator = get_clarification_generator()
        questions = await generator.generate_questions(
            query=payload.user_message,
            domain=classification.primary_domain
        )
        
        # Save questions to DB
        situation.clarification_questions = [q.dict() for q in questions]
        db.commit()
        
        logger.info(
            f"Domain resolved: {classification.primary_domain} "
            f"(confidence: {classification.confidence:.2f}, risk: {risk_assessment.risk_score})"
            f" - Created situation {situation.id}"
            f" - Generated {len(questions)} clarifying questions"
        )
        
        return IntakeResponse(
            situation_id=situation.id,
            primary_domain=classification.primary_domain,
            secondary_domain=classification.secondary_domain,
            related_domains=classification.related_domains,
            confidence=classification.confidence,
            user_friendly_summary=classification.user_friendly_summary,
            suggested_keywords=classification.suggested_keywords,
            reasoning=classification.reasoning,
            risk_assessment=risk_assessment,
            clarifying_questions=questions
        )
    
    except Exception as e:
        logger.error(f"Intake resolution failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to resolve domain: {str(e)}"
        )


# Keep old endpoint for backward compatibility (mark as deprecated)
@router.post("/situational", deprecated=True)
async def situational_intake_deprecated(
    payload: IntakeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    DEPRECATED: Use /intake/resolve instead
    
    This endpoint is kept for backward compatibility only.
    """
    logger.warning("Deprecated endpoint /intake/situational called. Use /intake/resolve instead.")
    
    # Redirect to new endpoint
    return await resolve_domain(payload, db, current_user)
