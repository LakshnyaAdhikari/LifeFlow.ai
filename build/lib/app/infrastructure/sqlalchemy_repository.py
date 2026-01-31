from sqlalchemy.orm import Session
from typing import Optional
from app.interfaces.repositories import WorkflowRepository, AuditRepository
from app.domain.entities import WorkflowInstance as DomainInstance, NodeInstanceState as DomainNodeState, ActionLog as DomainLog, WorkflowVersion as DomainVersion, StepState
from app.models import WorkflowInstance as DBInstance, NodeInstanceState as DBNodeState, ActionLog as DBLog, WorkflowVersion as DBVersion, WorkflowTemplate

class SqlAlchemyWorkflowRepository(WorkflowRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_domain_version(self, db_v: DBVersion) -> DomainVersion:
        if not db_v: return None
        return DomainVersion(
            id=db_v.id,
            template_id=db_v.template_id,
            version_number=db_v.version_number,
            graph_definition=db_v.graph_definition,
            source_refs=db_v.source_refs,
            effective_from=db_v.effective_from
        )

    def _to_domain_node_state(self, db_ns: DBNodeState) -> DomainNodeState:
        return DomainNodeState(
            id=db_ns.id,
            instance_id=db_ns.instance_id,
            node_id=db_ns.node_id,
            state=StepState(db_ns.state.value) if db_ns.state else StepState.PENDING,
            blocking_reason=db_ns.blocking_reason,
            started_at=db_ns.started_at,
            completed_at=db_ns.completed_at
        )

    def _to_domain_instance(self, db_inst: DBInstance) -> DomainInstance:
        if not db_inst: return None
        # Eager load dependencies if possible, or lazy access
        version = self._to_domain_version(db_inst.version)
        node_states = [self._to_domain_node_state(ns) for ns in db_inst.node_states]
        
        return DomainInstance(
            id=db_inst.id,
            user_id=db_inst.user_id,
            version_id=db_inst.version_id,
            docket_number=db_inst.docket_number,
            status=db_inst.status,
            created_at=db_inst.created_at,
            version=version,
            node_states=node_states
        )

    def get_instance(self, instance_id: int) -> Optional[DomainInstance]:
        db_inst = self.db.query(DBInstance).filter(DBInstance.id == instance_id).first()
        return self._to_domain_instance(db_inst)

    def create_instance(self, instance: DomainInstance) -> DomainInstance:
        db_inst = DBInstance(
            user_id=instance.user_id,
            version_id=instance.version_id,
            docket_number=instance.docket_number,
            status=instance.status
        )
        self.db.add(db_inst)
        self.db.commit()
        self.db.refresh(db_inst)
        return self._to_domain_instance(db_inst)

    def update_node_state(self, node_state: DomainNodeState) -> DomainNodeState:
        # Check if exists
        db_ns = None
        if node_state.id:
            db_ns = self.db.query(DBNodeState).filter(DBNodeState.id == node_state.id).first()
        else:
            # Try finding by composite key
            db_ns = self.db.query(DBNodeState).filter(
                DBNodeState.instance_id == node_state.instance_id,
                DBNodeState.node_id == node_state.node_id
            ).first()

        if not db_ns:
            db_ns = DBNodeState(
                instance_id=node_state.instance_id,
                node_id=node_state.node_id
            )
            self.db.add(db_ns)
        
        # Update fields
        db_ns.state = node_state.state # Enum conversion handled by SQLAlchemy if aligned, else use .value
        db_ns.started_at = node_state.started_at
        db_ns.completed_at = node_state.completed_at
        db_ns.blocking_reason = node_state.blocking_reason
        
        self.db.commit()
        self.db.refresh(db_ns)
        return self._to_domain_node_state(db_ns)

    def get_version(self, version_id: int) -> Optional[DomainVersion]:
        db_v = self.db.query(DBVersion).filter(DBVersion.id == version_id).first()
        return self._to_domain_version(db_v)

class SqlAlchemyAuditRepository(AuditRepository):
    def __init__(self, db: Session):
        self.db = db

    def log_action(self, action: DomainLog) -> DomainLog:
        db_log = DBLog(
            instance_id=action.instance_id,
            actor_type=action.actor_type,
            actor_id=action.actor_id,
            action=action.action,
            details=action.details
        )
        self.db.add(db_log)
        self.db.commit()
        self.db.refresh(db_log)
        
        # Convert back to domain (simplified)
        action.id = db_log.id
        action.timestamp = db_log.timestamp
        return action
