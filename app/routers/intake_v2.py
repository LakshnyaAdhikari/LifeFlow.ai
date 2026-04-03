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
from app.services.intake.domain_classifier import get_domain_classifier, DomainClassification
from app.services.routing.lightweight_router import get_lightweight_router
from app.services.safety.legal_filter import LegalBoundaryDetector, RiskAssessment

class IntakeRequest(BaseModel):
    user_message: str

router = APIRouter(prefix="/intake", tags=["intake"])

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
    needs_clarification: bool = True
    router_intent: Optional[str] = None
    router_domain_confidence: Optional[float] = None
    router_intent_confidence: Optional[float] = None
    clarification_reason: Optional[str] = None


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

        # 1.1 Local router decision (if artifacts available)
        lightweight_router = get_lightweight_router()
        router_prediction = lightweight_router.predict(payload.user_message)
        if router_prediction:
            needs_clarification = bool(router_prediction.needs_clarification)
            clarification_reason = router_prediction.clarification_reason
            router_intent = router_prediction.intent_label
            router_domain_confidence = router_prediction.domain_confidence
            router_intent_confidence = router_prediction.intent_confidence
        else:
            # Conservative fallback when no local router artifacts are available.
            needs_clarification = classification.confidence < 0.45
            clarification_reason = "fallback_from_classification_confidence"
            router_intent = None
            router_domain_confidence = None
            router_intent_confidence = None
        
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
            related_domains=classification.related_domains,
            context={
                "initial_query": payload.user_message,
                "classification": {
                    "primary_domain": classification.primary_domain,
                    "secondary_domain": classification.secondary_domain,
                    "confidence": classification.confidence,
                    "reasoning": classification.reasoning,
                    "suggested_keywords": classification.suggested_keywords,
                },
                "router_decision": {
                    "intent_label": router_intent,
                    "domain_label": classification.primary_domain,
                    "domain_confidence": router_domain_confidence,
                    "intent_confidence": router_intent_confidence,
                    "needs_clarification": needs_clarification,
                    "clarification_reason": clarification_reason,
                },
            },
            status="active"
        )
        db.add(situation)
        db.commit()
        db.refresh(situation)
        
        # 4. Generate Clarifying Questions [LAZY LOADING]
        # We now generate these on-demand in GET /situations/{id}
        # This makes the initial redirect instant
        questions = []
        
        logger.info(
            f"Domain resolved: {classification.primary_domain} "
            f"(confidence: {classification.confidence:.2f}, risk: {risk_assessment.risk_score})"
            f" - Created situation {situation.id}"
            f" - Questions deferred to lazy load"
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
            clarifying_questions=[], # Empty list, will be populated on clarification page load
            needs_clarification=needs_clarification,
            router_intent=router_intent,
            router_domain_confidence=router_domain_confidence,
            router_intent_confidence=router_intent_confidence,
            clarification_reason=clarification_reason,
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
