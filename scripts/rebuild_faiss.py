import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import asyncio
import json
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.knowledge import KnowledgeChunk, KnowledgeDocument, KnowledgeDomain, UserQuery, GuidanceSession
from app.models.situation import UserSituation
from app.services.knowledge.vector_db import get_vector_db

def rebuild_index():
    db = SessionLocal()
    vector_db = get_vector_db()
    vector_db._create_new_index()
    
    print("Fetching chunks from SQLite...")
    chunks = db.query(KnowledgeChunk).all()
    print(f"Found {len(chunks)} chunks.")
    
    if not chunks:
        return
        
    embeddings = []
    chunk_ids = []
    metadata_list = []
    
    print("Rebuilding index metadata...")
    for c in chunks:
        doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == c.document_id).first()
        if not doc: continue
        
        try:
            emb = json.loads(c.embedding)
        except Exception:
            emb = c.embedding
            
        embeddings.append(emb)
        chunk_ids.append(c.id)
        
        meta = {
            "chunk_id": c.id,
            "document_id": doc.id,
            "content": c.text,
            "source_authority": doc.source_authority,
            "domain": doc.domain.name,
            "title": doc.title,
            "authority_weight": c.authority_weight,
            "procedural_density": c.procedural_density,
            "chunk_type": c.chunk_type,
            "extraction_quality_score": c.extraction_quality_score
        }
        metadata_list.append(meta)
    
    print("Adding vectors to FAISS...")
    if embeddings:
        vector_db.add_vectors(embeddings, chunk_ids, metadata_list)
        vector_db.save_index()
    print("Done!")

if __name__ == "__main__":
    rebuild_index()
