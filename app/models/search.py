"""
Search History Model

Tracks user search queries for history and recommendations
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class SearchHistory(Base):
    """
    Stores user search queries for history tracking and personalization
    """
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Search details
    query = Column(String(500), nullable=False)  # The search query text
    domain = Column(String(100), nullable=True)  # Domain detected from query (e.g., "Insurance", "Taxation")
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", backref="search_history")
    
    # Indexes for efficient queries
    __table_args__ = (
        Index("idx_user_id_created_at", "user_id", "created_at"),
    )
    
    def __repr__(self):
        return f"<SearchHistory(id={self.id}, user_id={self.user_id}, query='{self.query}', domain='{self.domain}')>"
