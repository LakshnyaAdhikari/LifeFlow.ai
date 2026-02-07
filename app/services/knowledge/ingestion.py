"""
Knowledge Ingestion Pipeline

Orchestrates document fetching, processing, embedding, and storage
"""

import hashlib
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.models.knowledge import KnowledgeDomain, KnowledgeDocument, KnowledgeChunk
from app.services.knowledge.fetchers import get_fetcher, FetchedDocument
from app.services.knowledge.processors import get_processor, TextChunker
from app.services.knowledge.vector_db import get_vector_db
from app.services.llm.client import get_llm_client


class IngestionPipeline:
    """
    Fault-tolerant knowledge ingestion pipeline
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.vector_db = get_vector_db()
        self.llm_client = get_llm_client()
        self.chunker = TextChunker(chunk_size=1000, chunk_overlap=200)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def ingest_document(
        self,
        url: str,
        title: str,
        authority: str,
        domain_name: str,
        source_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> KnowledgeDocument:
        """
        Ingest a single document
        
        Steps:
        1. Fetch document
        2. Calculate content hash (deduplication)
        3. Process document (extract text)
        4. Chunk text
        5. Generate embeddings
        6. Store in database and vector DB
        
        Args:
            url: Document URL
            title: Document title
            authority: Source authority (e.g., "UIDAI")
            domain_name: Domain name (e.g., "Identity Documents")
            source_type: Type of document ("pdf", "html")
            metadata: Additional metadata
        """
        logger.info(f"Starting ingestion: {title} from {authority}")
        
        try:
            # 1. Get or create domain
            domain = self._get_or_create_domain(domain_name)
            
            # 2. Fetch document
            fetcher = get_fetcher(authority)
            fetched_doc = await fetcher.fetch(url, title, metadata)
            await fetcher.close()
            
            # 3. Calculate content hash
            content_hash = hashlib.sha256(fetched_doc.content).hexdigest()
            
            # 4. Check if already exists
            existing = self.db.query(KnowledgeDocument).filter(
                KnowledgeDocument.content_hash == content_hash
            ).first()
            
            if existing:
                logger.info(f"Document already exists: {title}")
                return existing
            
            # 5. Create document record
            doc = KnowledgeDocument(
                source_url=url,
                source_type=source_type,
                source_authority=authority,
                title=title,
                domain_id=domain.id,
                content_hash=content_hash,
                status="processing"
            )
            self.db.add(doc)
            self.db.commit()
            self.db.refresh(doc)
            
            # 6. Process document
            processor = get_processor(source_type)
            processed = processor.process(fetched_doc.content, fetched_doc.metadata)
            
            # 7. Store raw content (optional, for debugging)
            doc.raw_content = processed.content[:50000]  # Limit size
            
            # 8. Chunk text
            if processed.sections:
                chunks = self.chunker.chunk_with_sections(
                    processed.sections,
                    base_metadata={
                        "document_id": doc.id,
                        "source_authority": authority,
                        "domain": domain_name,
                        "title": title
                    }
                )
            else:
                chunks = self.chunker.chunk_text(
                    processed.content,
                    metadata={
                        "document_id": doc.id,
                        "source_authority": authority,
                        "domain": domain_name,
                        "title": title
                    }
                )
            
            logger.info(f"Created {len(chunks)} chunks")
            
            # 9. Generate embeddings and store chunks
            await self._process_chunks(doc, chunks)
            
            # 10. Mark as completed
            doc.status = "completed"
            doc.processed_at = datetime.utcnow()
            self.db.commit()
            
            logger.info(f"Successfully ingested: {title}")
            return doc
        
        except Exception as e:
            logger.error(f"Failed to ingest document: {e}")
            
            # Mark as failed
            if 'doc' in locals():
                doc.status = "failed"
                doc.error_message = str(e)
                self.db.commit()
            
            raise
    
    async def _process_chunks(self, doc: KnowledgeDocument, chunks: List[Dict[str, Any]]):
        """Process and store chunks with embeddings"""
        
        # Extract texts for batch embedding
        texts = [chunk["content"] for chunk in chunks]
        
        # Generate embeddings in batch
        logger.info(f"Generating embeddings for {len(texts)} chunks...")
        embeddings = await self.llm_client.generate_embeddings_batch(texts, batch_size=50)
        
        # Create chunk records
        chunk_records = []
        chunk_ids = []
        vector_metadata = []
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_record = KnowledgeChunk(
                document_id=doc.id,
                text=chunk["content"],
                chunk_index=i,
                chunk_metadata=chunk.get("metadata", {}),
                embedding=embedding,  # Store as JSON for SQLite
                embedding_model="all-MiniLM-L6-v2",
                quality_score=self._calculate_quality_score(chunk["content"])
            )
            
            self.db.add(chunk_record)
            chunk_records.append(chunk_record)
        
        # Commit to get IDs
        self.db.commit()
        
        # Prepare for vector DB
        for chunk_record, embedding in zip(chunk_records, embeddings):
            chunk_ids.append(chunk_record.id)
            vector_metadata.append({
                "chunk_id": chunk_record.id,
                "document_id": doc.id,
                "content": chunk_record.text,
                "source_authority": doc.source_authority,
                "domain": doc.domain.name,
                "title": doc.title,
                **chunk_record.chunk_metadata
            })
        
        # Add to vector database
        self.vector_db.add_vectors(embeddings, chunk_ids, vector_metadata)
        
        logger.info(f"Stored {len(chunk_records)} chunks in database and vector index")
    
    def _get_or_create_domain(self, domain_name: str) -> KnowledgeDomain:
        """Get or create knowledge domain"""
        domain = self.db.query(KnowledgeDomain).filter(
            KnowledgeDomain.name == domain_name
        ).first()
        
        if not domain:
            domain = KnowledgeDomain(name=domain_name)
            self.db.add(domain)
            self.db.commit()
            self.db.refresh(domain)
            logger.info(f"Created new domain: {domain_name}")
        
        return domain
    
    def _calculate_quality_score(self, text: str) -> float:
        """
        Calculate quality score for chunk
        
        Based on:
        - Length (not too short, not too long)
        - Completeness (ends with punctuation)
        - Information density
        """
        score = 1.0
        
        # Length penalty
        if len(text) < 100:
            score *= 0.5
        elif len(text) > 2000:
            score *= 0.8
        
        # Completeness bonus
        if text.strip().endswith(('.', '!', '?', '।')):
            score *= 1.1
        
        # Information density (word count / character count)
        words = len(text.split())
        if words > 0:
            density = words / len(text)
            if 0.15 < density < 0.25:  # Good density
                score *= 1.1
        
        return min(score, 1.0)
    
    async def ingest_batch(
        self,
        documents: List[Dict[str, Any]],
        continue_on_error: bool = True
    ) -> Dict[str, Any]:
        """
        Ingest multiple documents
        
        Args:
            documents: List of document configs
            continue_on_error: Whether to continue if one fails
        
        Returns:
            Summary of ingestion results
        """
        results = {
            "total": len(documents),
            "succeeded": 0,
            "failed": 0,
            "skipped": 0,
            "errors": []
        }
        
        for doc_config in documents:
            try:
                await self.ingest_document(**doc_config)
                results["succeeded"] += 1
            
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "document": doc_config.get("title", "Unknown"),
                    "error": str(e)
                })
                
                if not continue_on_error:
                    raise
        
        logger.info(
            f"Batch ingestion complete: {results['succeeded']} succeeded, "
            f"{results['failed']} failed, {results['skipped']} skipped"
        )
        
        return results


from datetime import datetime
