"""
Knowledge Database Models

Stores ingested documents, chunks, and metadata
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class KnowledgeDomain(Base):
    """
    Domains for knowledge organization
    """
    __tablename__ = "knowledge_domains"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Relationships
    documents = relationship("KnowledgeDocument", back_populates="domain")
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class KnowledgeDocument(Base):
    """
    Source documents ingested into the knowledge base
    """
    __tablename__ = "knowledge_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Source information
    source_url = Column(String(1000), nullable=False)
    source_type = Column(String(50), nullable=False)  # "pdf", "html", "api"
    source_authority = Column(String(200), nullable=False)  # "UIDAI", "IRDAI", etc.
    
    # Document metadata
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    domain_id = Column(Integer, ForeignKey("knowledge_domains.id"), nullable=False)
    
    # Content
    content_hash = Column(String(64), nullable=False, index=True)  # SHA256 hash
    raw_content = Column(Text, nullable=True)  # Original content (optional)
    
    # Processing status
    status = Column(String(50), default="pending", nullable=False)  # "pending", "processing", "completed", "failed"
    error_message = Column(Text, nullable=True)
    
    # Versioning
    version = Column(Integer, default=1, nullable=False)
    is_latest = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    published_date = Column(DateTime, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    domain = relationship("KnowledgeDomain", back_populates="documents")
    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<KnowledgeDocument(id={self.id}, title='{self.title}', authority='{self.source_authority}')>"


class KnowledgeChunk(Base):
    """
    Chunked and embedded document segments
    """
    __tablename__ = "knowledge_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id"), nullable=False)
    
    # Chunk content
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)  # Position in document
    
    # Metadata
    metadata = Column(JSON, default=dict)  # Section, headers, etc.
    
    # Embedding (stored as JSON array for SQLite compatibility)
    # In production with PostgreSQL, use ARRAY type
    embedding = Column(JSON, nullable=True)  # Vector embedding
    embedding_model = Column(String(100), nullable=True)  # "text-embedding-3-large"
    
    # Quality metrics
    quality_score = Column(Float, nullable=True)  # 0.0 to 1.0
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document = relationship("KnowledgeDocument", back_populates="chunks")
    
    def __repr__(self):
        return f"<KnowledgeChunk(id={self.id}, doc_id={self.document_id}, index={self.chunk_index})>"


class UserQuery(Base):
    """
    Log of user queries for learning and improvement
    """
    __tablename__ = "user_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Query details
    query_text = Column(Text, nullable=False)
    classified_domain = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    
    # Response quality
    chunks_retrieved = Column(Integer, nullable=True)
    response_generated = Column(Boolean, default=False)
    
    # Feedback (for learning)
    user_feedback = Column(Integer, nullable=True)  # 1 = helpful, 0 = not helpful
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<UserQuery(id={self.id}, domain='{self.classified_domain}')>"


class GuidanceSession(Base):
    """
    Complete guidance sessions for analytics
    """
    __tablename__ = "guidance_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    situation_id = Column(Integer, ForeignKey("user_situations.id"), nullable=True)
    
    # Session details
    domain = Column(String(100), nullable=False)
    query = Column(Text, nullable=False)
    
    # Guidance provided
    suggestions_count = Column(Integer, default=0)
    confidence_score = Column(Float, nullable=True)
    
    # Sources used
    sources_used = Column(JSON, default=list)  # List of document IDs
    
    # Outcome
    completed = Column(Boolean, default=False)
    user_rating = Column(Integer, nullable=True)  # 1-5 stars
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<GuidanceSession(id={self.id}, domain='{self.domain}')>"
