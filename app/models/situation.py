"""
User Situation Models

Represents ongoing life situations (not single queries)
Supports multi-domain, evolving context across sessions
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from datetime import datetime
from typing import Optional, List, Dict, Any

from app.database import Base


class UserSituation(Base):
    """
    Represents an ongoing life situation (not a single query)
    
    Example: "My car insurance claim" - this is a situation that evolves over time
    with multiple interactions, documents, and steps across potentially multiple domains.
    """
    __tablename__ = "user_situations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Core Identity
    title = Column(String(500), nullable=False)  # User-friendly: "My car insurance claim"
    primary_domain = Column(String(100), nullable=False)  # "Insurance"
    
    # SQLite doesn't support ARRAY, use JSON instead
    related_domains = Column(JSON, default=list)  # ["Consumer Protection", "Legal"]
    
    # Evolving Context
    context = Column(JSON, default=dict)  # Structured situation details
    timeline = Column(JSON, default=list)  # Events, dates, deadlines
    
    # Multi-Domain Support
    domain_states = Column(JSON, default=dict)  # {domain: {status, completed_steps, ...}}
    
    # Status
    status = Column(String(50), default="active")  # "active", "resolved", "escalated", "paused"
    priority = Column(String(50), default="normal")  # "urgent", "normal", "low"
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_interaction = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="situations")
    interactions = relationship("SituationInteraction", back_populates="situation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<UserSituation(id={self.id}, title='{self.title}', domain='{self.primary_domain}', status='{self.status}')>"


class SituationInteraction(Base):
    """
    Log of all user interactions within a situation
    
    Tracks the evolution of the situation over time
    """
    __tablename__ = "situation_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    situation_id = Column(Integer, ForeignKey("user_situations.id"), nullable=False)
    
    interaction_type = Column(String(100), nullable=False)  # "query", "step_completed", "document_uploaded", "feedback"
    content = Column(JSON, nullable=False)  # Interaction details
    
    # Context snapshot at time of interaction
    context_snapshot = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    situation = relationship("UserSituation", back_populates="interactions")
    
    def __repr__(self):
        return f"<SituationInteraction(id={self.id}, type='{self.interaction_type}', situation_id={self.situation_id})>"


class UserFeedback(Base):
    """
    User feedback on guidance quality
    
    Used for historical accuracy in confidence system
    """
    __tablename__ = "user_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    situation_id = Column(Integer, ForeignKey("user_situations.id"), nullable=True)
    
    domain = Column(String(100), nullable=False)
    
    # Feedback
    helpful = Column(Integer, nullable=False)  # 1 = helpful, 0 = not helpful
    rating = Column(Integer, nullable=True)  # 1-5 stars (optional)
    comment = Column(Text, nullable=True)
    
    # What was being rated
    guidance_type = Column(String(100), nullable=True)  # "suggestion", "next_step", "reassurance"
    guidance_content = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<UserFeedback(id={self.id}, domain='{self.domain}', helpful={self.helpful})>"


# Add relationship to User model
# This will be added via migration or manual update to User model
# User.situations = relationship("UserSituation", back_populates="user")
