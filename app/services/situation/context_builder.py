"""
Situation Context Builder

Builds rich, evolving context for guidance generation
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.situation import UserSituation, SituationInteraction


class TimelineEvent(BaseModel):
    """Single event in situation timeline"""
    date: datetime
    event: str
    type: str  # "system", "user", "step_completed", etc.
    metadata: Optional[Dict[str, Any]] = None


class SituationContext(BaseModel):
    """
    Rich context for a situation
    
    Used by guidance engine to generate personalized suggestions
    """
    # Core details
    situation_id: int
    title: str
    primary_domain: str
    related_domains: List[str]
    
    # Timeline
    timeline: List[TimelineEvent]
    upcoming_deadlines: List[Dict[str, Any]] = []
    
    # Progress
    completed_steps: List[str] = []
    pending_steps: List[str] = []
    
    # Multi-domain state
    domain_states: Dict[str, Any] = {}
    
    # Historical context
    previous_interactions: List[Dict[str, Any]] = []
    
    # User profile (optional)
    user_profile: Optional[Dict[str, Any]] = None
    
    # Current status
    status: str
    priority: str
    days_active: int


class SituationContextBuilder:
    """
    Builds rich, evolving context for guidance generation
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    async def build_context(self, situation: UserSituation) -> SituationContext:
        """
        Aggregate all relevant context for this situation
        """
        # Build timeline
        timeline = self._build_timeline(situation)
        
        # Extract deadlines
        deadlines = self._extract_deadlines(situation)
        
        # Get progress
        completed_steps = self._get_completed_steps(situation)
        pending_steps = self._get_pending_steps(situation)
        
        # Get recent interactions
        recent_interactions = await self._get_recent_interactions(situation, limit=10)
        
        # Calculate days active
        days_active = (datetime.utcnow() - situation.created_at).days
        
        return SituationContext(
            situation_id=situation.id,
            title=situation.title,
            primary_domain=situation.primary_domain,
            related_domains=situation.related_domains or [],
            timeline=timeline,
            upcoming_deadlines=deadlines,
            completed_steps=completed_steps,
            pending_steps=pending_steps,
            domain_states=situation.domain_states or {},
            previous_interactions=recent_interactions,
            user_profile=None,  # TODO: Get from user profile
            status=situation.status,
            priority=situation.priority,
            days_active=days_active
        )
    
    def _build_timeline(self, situation: UserSituation) -> List[TimelineEvent]:
        """
        Construct chronological timeline of events
        """
        events = []
        
        # Add creation
        events.append(TimelineEvent(
            date=situation.created_at,
            event="Situation started",
            type="system"
        ))
        
        # Add user interactions
        for interaction in situation.interactions:
            summary = interaction.content.get("summary", f"{interaction.interaction_type} interaction")
            events.append(TimelineEvent(
                date=interaction.created_at,
                event=summary,
                type=interaction.interaction_type,
                metadata=interaction.content
            ))
        
        # Sort by date
        return sorted(events, key=lambda e: e.date)
    
    def _extract_deadlines(self, situation: UserSituation) -> List[Dict[str, Any]]:
        """
        Extract upcoming deadlines from context and timeline
        """
        deadlines = []
        
        # Check context for deadlines
        if situation.context and "deadlines" in situation.context:
            deadlines.extend(situation.context["deadlines"])
        
        # Check timeline
        if situation.timeline:
            for event in situation.timeline:
                if isinstance(event, dict) and event.get("type") == "deadline":
                    deadlines.append(event)
        
        # Sort by date
        deadlines.sort(key=lambda d: d.get("date", "9999-12-31"))
        
        return deadlines
    
    def _get_completed_steps(self, situation: UserSituation) -> List[str]:
        """
        Get list of completed steps across all domains
        """
        completed = []
        
        # Check domain states
        if situation.domain_states:
            for domain, state in situation.domain_states.items():
                if isinstance(state, dict) and "completed_steps" in state:
                    completed.extend(state["completed_steps"])
        
        # Check context
        if situation.context and "completed_steps" in situation.context:
            completed.extend(situation.context["completed_steps"])
        
        return list(set(completed))  # Remove duplicates
    
    def _get_pending_steps(self, situation: UserSituation) -> List[str]:
        """
        Get list of pending steps
        """
        pending = []
        
        # Check domain states
        if situation.domain_states:
            for domain, state in situation.domain_states.items():
                if isinstance(state, dict) and "pending_steps" in state:
                    pending.extend(state["pending_steps"])
        
        # Check context
        if situation.context and "pending_steps" in situation.context:
            pending.extend(situation.context["pending_steps"])
        
        return list(set(pending))
    
    async def _get_recent_interactions(
        self,
        situation: UserSituation,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent interactions for this situation
        """
        interactions = (
            self.db.query(SituationInteraction)
            .filter(SituationInteraction.situation_id == situation.id)
            .order_by(SituationInteraction.created_at.desc())
            .limit(limit)
            .all()
        )
        
        return [
            {
                "type": i.interaction_type,
                "content": i.content,
                "created_at": i.created_at.isoformat()
            }
            for i in interactions
        ]
