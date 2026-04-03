"""
Guidance Router - RAG-Based Guidance APIs

Provides AI-driven guidance based on authoritative knowledge
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from loguru import logger

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User
from app.services.guidance.rag_engine import GuidanceEngine, GuidanceResponse
from app.models.situation import UserSituation, SituationInteraction


router = APIRouter(prefix="/guidance", tags=["guidance"])



class ClarificationAnswer(BaseModel):
    question_id: str
    question_text: str
    answer: str


class GuidanceRequest(BaseModel):
    """Request for guidance"""
    query: str
    domain: str
    situation_id: Optional[int] = None
    context: Optional[Dict[str, Any]] = None
    clarification_answers: List[ClarificationAnswer] = []  # [NEW]


class FeedbackRequest(BaseModel):
    """User feedback on guidance"""
    session_id: int
    helpful: bool
    rating: Optional[int] = None  # 1-5 stars
    comment: Optional[str] = None

class ChatHistoryTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class FollowUpChatRequest(BaseModel):
    situation_id: int
    message: str
    clarification_answers: List[ClarificationAnswer] = []
    history: List[ChatHistoryTurn] = []

class FollowUpCitation(BaseModel):
    title: str
    authority: str
    url: Optional[str] = None
    document_id: Optional[int] = None

class FollowUpChatResponse(BaseModel):
    answer: str
    citations: List[FollowUpCitation] = []
    confidence: float = 0.0
    follow_up_questions: List[str] = []
    style: str = "default"


@router.post("/suggestions", response_model=GuidanceResponse)
async def get_suggestions(
    payload: GuidanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-driven suggestions based on user query
    
    This is the CORE endpoint that replaces hard-coded workflows
    
    Uses RAG (Retrieval-Augmented Generation) to:
    1. Search authoritative knowledge base
    2. Generate contextual suggestions
    3. Apply safety filters
    4. Calculate confidence
    """
    logger.info(f"Guidance request from user {current_user.id}: {payload.query[:100]}...")
    
    try:
        # Initialize guidance engine
        engine = GuidanceEngine(db)

        effective_context: Dict[str, Any] = dict(payload.context or {})
        if payload.situation_id:
            situation = db.query(UserSituation).filter(
                UserSituation.id == payload.situation_id,
                UserSituation.user_id == current_user.id
            ).first()
            if situation and isinstance(situation.context, dict):
                router_decision = situation.context.get("router_decision")
                if isinstance(router_decision, dict):
                    effective_context.setdefault("router_intent", router_decision.get("intent_label"))
                    effective_context.setdefault("router_needs_clarification", router_decision.get("needs_clarification"))
                    effective_context.setdefault("router_domain_confidence", router_decision.get("domain_confidence"))
                    effective_context.setdefault("router_intent_confidence", router_decision.get("intent_confidence"))
        
        # Generate guidance
        guidance = await engine.generate_guidance(
            query=payload.query,
            domain=payload.domain,
            user_id=current_user.id,
            situation_id=payload.situation_id,
            context=effective_context or None,
            clarification_answers=[a.model_dump() for a in payload.clarification_answers]  # [NEW] Convert to dicts
        )
        
        logger.info(
            f"Guidance generated: {len(guidance.suggestions)} suggestions, "
            f"confidence: {guidance.confidence['score']:.2f}"
        )
        
        return guidance
    
    except Exception as e:
        logger.error(f"Failed to generate guidance: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate guidance: {str(e)}"
        )


@router.post("/followup-chat", response_model=FollowUpChatResponse)
async def followup_chat(
    payload: FollowUpChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Conversational follow-up endpoint:
    - grounded by authoritative retrieval
    - aware of situation context + previous turns
    - returns plain-text answer with citations
    """
    try:
        situation = db.query(UserSituation).filter(
            UserSituation.id == payload.situation_id,
            UserSituation.user_id == current_user.id
        ).first()
        if not situation:
            raise HTTPException(status_code=404, detail="Situation not found")

        recent_turns = db.query(SituationInteraction).filter(
            SituationInteraction.situation_id == payload.situation_id,
            SituationInteraction.interaction_type.in_(["followup_user", "followup_assistant"])
        ).order_by(SituationInteraction.created_at.desc()).limit(12).all()

        persisted_history: List[Dict[str, str]] = []
        for turn in reversed(recent_turns):
            role = "assistant" if turn.interaction_type == "followup_assistant" else "user"
            content = ""
            if isinstance(turn.content, dict):
                content = (
                    turn.content.get("message")
                    or turn.content.get("answer")
                    or turn.content.get("text")
                    or ""
                )
            if content:
                persisted_history.append({"role": role, "content": content})

        request_history = [
            {"role": h.role, "content": h.content}
            for h in payload.history[-8:]
            if h.content.strip()
        ]

        merged_history = persisted_history + request_history
        clarification_payload = [a.model_dump() for a in payload.clarification_answers]
        effective_clarification = clarification_payload or (situation.clarification_answers or [])

        engine = GuidanceEngine(db)
        chat_result = await engine.generate_followup_chat(
            message=payload.message,
            domain=situation.primary_domain,
            situation_title=situation.title,
            clarification_answers=effective_clarification,
            conversation_history=merged_history,
        )

        db.add(SituationInteraction(
            situation_id=payload.situation_id,
            interaction_type="followup_user",
            content={"message": payload.message},
            context_snapshot=situation.context or {}
        ))
        db.add(SituationInteraction(
            situation_id=payload.situation_id,
            interaction_type="followup_assistant",
            content={
                "message": chat_result.get("answer", ""),
                "citations": chat_result.get("citations", []),
                "confidence": chat_result.get("confidence", 0.0),
                "style": chat_result.get("style", "default"),
            },
            context_snapshot=situation.context or {}
        ))
        db.commit()

        return FollowUpChatResponse(**chat_result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate follow-up chat: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate follow-up chat: {str(e)}")


@router.post("/feedback")
async def submit_feedback(
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit feedback on guidance quality
    
    Used for:
    - Historical accuracy in confidence system
    - Improving future guidance
    - Quality metrics
    """
    try:
        from app.models.knowledge import GuidanceSession, UserFeedback
        
        # Get session
        session = db.query(GuidanceSession).filter(
            GuidanceSession.id == payload.session_id,
            GuidanceSession.user_id == current_user.id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update session
        session.user_rating = payload.rating
        session.completed = True
        
        # Create feedback record
        feedback = UserFeedback(
            user_id=current_user.id,
            situation_id=session.situation_id,
            domain=session.domain,
            helpful=1 if payload.helpful else 0,
            rating=payload.rating,
            comment=payload.comment,
            guidance_type="suggestion",
            guidance_content={"session_id": session.id}
        )
        
        db.add(feedback)
        db.commit()
        
        logger.info(f"Feedback submitted for session {payload.session_id}: helpful={payload.helpful}")
        
        return {
            "status": "success",
            "message": "Thank you for your feedback!"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")


@router.get("/stats")
async def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get knowledge base and guidance statistics
    """
    try:
        from app.models.knowledge import KnowledgeDocument, KnowledgeChunk, GuidanceSession
        from app.services.knowledge.vector_db import get_vector_db
        
        # Database stats
        total_docs = db.query(KnowledgeDocument).count()
        total_chunks = db.query(KnowledgeChunk).count()
        user_sessions = db.query(GuidanceSession).filter(
            GuidanceSession.user_id == current_user.id
        ).count()
        
        # Vector DB stats
        vector_db = get_vector_db()
        vector_stats = vector_db.get_stats()
        
        return {
            "knowledge_base": {
                "total_documents": total_docs,
                "total_chunks": total_chunks,
                "vector_index_size": vector_stats["total_vectors"]
            },
            "user_activity": {
                "total_sessions": user_sessions
            }
        }
    
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
