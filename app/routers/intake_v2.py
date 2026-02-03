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
from app.auth import get_current_user
from app.models import User
from app.services.intake.domain_classifier import get_domain_classifier, DomainClassification
from app.services.safety.legal_filter import LegalBoundaryDetector, RiskAssessment


router = APIRouter(prefix="/intake", tags=["intake"])


class IntakeRequest(BaseModel):
    """Request to resolve user query to domain"""
    user_message: str
    context: Optional[dict] = None  # Additional context if available


class IntakeResponse(BaseModel):
    """Response with domain classification and risk assessment"""
    primary_domain: str
    secondary_domain: Optional[str] = None
    related_domains: List[str]
    confidence: float
    user_friendly_summary: str
    suggested_keywords: List[str]
    reasoning: Optional[str] = None
    risk_assessment: Optional[RiskAssessment] = None


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
        
        # 3. Log query for learning (future: improve classification)
        # TODO: Store in user_queries table for feedback loop
        
        logger.info(
            f"Domain resolved: {classification.primary_domain} "
            f"(confidence: {classification.confidence:.2f}, risk: {risk_assessment.risk_score})"
        )
        
        return IntakeResponse(
            primary_domain=classification.primary_domain,
            secondary_domain=classification.secondary_domain,
            related_domains=classification.related_domains,
            confidence=classification.confidence,
            user_friendly_summary=classification.user_friendly_summary,
            suggested_keywords=classification.suggested_keywords,
            reasoning=classification.reasoning,
            risk_assessment=risk_assessment
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
