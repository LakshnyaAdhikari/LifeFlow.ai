from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base

class StepType(str, Enum):
    REQUIRED = "REQUIRED"
    OPTIONAL = "OPTIONAL"
    CONDITIONAL = "CONDITIONAL"

class StepState(str, Enum):
    PENDING = "PENDING"
    ELIGIBLE = "ELIGIBLE"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    workflow_instances = relationship("WorkflowInstance", back_populates="user")
    auth = relationship("UserAuth", back_populates="user", uselist=False)
    situations = relationship("UserSituation", back_populates="user")
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    sessions = relationship("UserSession", back_populates="user")
    dependents = relationship("UserDependent", back_populates="user")

class WorkflowTemplate(Base):
    __tablename__ = "workflow_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # e.g., "Death in Family"
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    versions = relationship("WorkflowVersion", back_populates="template")

class WorkflowVersion(Base):
    __tablename__ = "workflow_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("workflow_templates.id"))
    version_number = Column(Integer)
    effective_from = Column(DateTime, default=datetime.utcnow)
    source_refs = Column(JSON) # List of source URLs/citations
    graph_definition = Column(JSON) # JSON representation of the graph structure (Nodes, Edges) for this version
    
    template = relationship("WorkflowTemplate", back_populates="versions")
    instances = relationship("WorkflowInstance", back_populates="version")

class WorkflowInstance(Base):
    __tablename__ = "workflow_instances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    version_id = Column(Integer, ForeignKey("workflow_versions.id"))
    docket_number = Column(String, unique=True) # External ref ID
    status = Column(String) # Active, Completed, Archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="workflow_instances")
    version = relationship("WorkflowVersion", back_populates="instances")
    node_states = relationship("NodeInstanceState", back_populates="instance")
    action_logs = relationship("ActionLog", back_populates="instance")

class NodeInstanceState(Base):
    __tablename__ = "node_instance_states"
    
    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(Integer, ForeignKey("workflow_instances.id"))
    node_id = Column(String) # ID of the node from the Graph Definition (e.g., "step_1")
    state = Column(SQLEnum(StepState), default=StepState.PENDING)
    blocking_reason = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    instance = relationship("WorkflowInstance", back_populates="node_states")
    evidence = relationship("StepEvidence", back_populates="node_state", uselist=False)

class StepEvidence(Base):
    __tablename__ = "step_evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    node_instance_id = Column(Integer, ForeignKey("node_instance_states.id"))
    evidence_type = Column(String) # Document, URL, UserInput
    evidence_data = Column(JSON) # The actual payload or metadata
    validation_status = Column(String) # Valid, Invalid, Pending Review
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    node_state = relationship("NodeInstanceState", back_populates="evidence")

class ActionLog(Base):
    __tablename__ = "action_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(Integer, ForeignKey("workflow_instances.id"))
    actor_type = Column(String) # User, Agent, System
    actor_id = Column(String, nullable=True)
    action = Column(String) # e.g., "COMPLETED_STEP", "ESCALATED"
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    instance = relationship("WorkflowInstance", back_populates="action_logs")

# Domain Entities (Simplified for MVP)

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    asset_type = Column(String) # RealEstate, BankAccount
    details = Column(JSON)
