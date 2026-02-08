from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.database import get_db
from app.routers.auth import get_current_user
from app.models.core import User
from app.models.situation import UserSituation, UserFeedback
from app.models.knowledge import UserQuery, GuidanceSession
from app.auth_models import UserDependent
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# --- Schemas ---

class DashboardStats(BaseModel):
    active_situations: int
    resolved_situations: int
    draft_situations: int
    total_interactions: int

class HistoryItem(BaseModel):
    id: int
    type: str # "query" or "session"
    title: str
    domain: Optional[str]
    confidence: Optional[float]
    created_at: datetime

class DependentBase(BaseModel):
    name: str
    relation: str
    age: Optional[int] = None
    domain_specific_notes: Optional[str] = None

class DependentResponse(DependentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DomainInsight(BaseModel):
    domain: str
    count: int
    avg_confidence: float

class DashboardInsights(BaseModel):
    top_domains: List[DomainInsight]
    risk_alerts: List[str]

# --- Endpoints ---

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregate stats for the user dashboard"""
    active = db.query(UserSituation).filter(
        UserSituation.user_id == current_user.id,
        UserSituation.status == "active"
    ).count()
    
    resolved = db.query(UserSituation).filter(
        UserSituation.user_id == current_user.id,
        UserSituation.status == "resolved"
    ).count()
    
    # Drafts are situations with no interactions yet or a specific flag
    # For now, let's say active situations with fewer than 2 interactions are "drafts"
    # Actually, let's just count all for now as SITUATIONS router might have its own logic
    drafts = 0 
    
    total_queries = db.query(UserQuery).filter(UserQuery.user_id == current_user.id).count()
    
    return DashboardStats(
        active_situations=active,
        resolved_situations=resolved,
        draft_situations=drafts,
        total_interactions=total_queries
    )

@router.get("/history", response_model=List[HistoryItem])
async def get_dashboard_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Combine search history and guidance sessions"""
    history = []
    
    # Get queries
    queries = db.query(UserQuery).filter(UserQuery.user_id == current_user.id).order_by(UserQuery.created_at.desc()).limit(20).all()
    for q in queries:
        history.append(HistoryItem(
            id=q.id,
            type="query",
            title=q.query_text,
            domain=q.classified_domain,
            confidence=q.confidence,
            created_at=q.created_at
        ))
        
    # Get sessions
    sessions = db.query(GuidanceSession).filter(GuidanceSession.user_id == current_user.id).order_by(GuidanceSession.created_at.desc()).limit(20).all()
    for s in sessions:
        history.append(HistoryItem(
            id=s.id,
            type="session",
            title=s.query,
            domain=s.domain,
            confidence=s.confidence_score,
            created_at=s.created_at
        ))
        
    # Sort combined history
    history.sort(key=lambda x: x.created_at, reverse=True)
    return history[:30]

@router.get("/dependents", response_model=List[DependentResponse])
async def get_dependents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of user dependents"""
    return db.query(UserDependent).filter(UserDependent.user_id == current_user.id).all()

@router.post("/dependents", response_model=DependentResponse)
async def add_dependent(
    payload: DependentBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new dependent"""
    dependent = UserDependent(
        user_id=current_user.id,
        **payload.model_dump()
    )
    db.add(dependent)
    db.commit()
    db.refresh(dependent)
    return dependent

@router.get("/insights", response_model=DashboardInsights)
async def get_dashboard_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Domain-centric insights and usage stats"""
    # Group by domain to see most used
    domain_stats = db.query(
        UserQuery.classified_domain,
        func.count(UserQuery.id).label("count"),
        func.avg(UserQuery.confidence).label("avg_confidence")
    ).filter(UserQuery.user_id == current_user.id).group_by(UserQuery.classified_domain).all()
    
    top_domains = [
        DomainInsight(
            domain=row[0] or "Unknown",
            count=row[1],
            avg_confidence=row[2] or 0.0
        ) for row in domain_stats
    ]
    
    # Sort by count
    top_domains.sort(key=lambda x: x.count, reverse=True)
    
    return DashboardInsights(
        top_domains=top_domains,
        risk_alerts=[] # Placeholder for future risk assessment logic
    )
