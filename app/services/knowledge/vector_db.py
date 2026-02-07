"""
Vector Database Service

FAISS-based vector storage for development
Can be swapped for Pinecone/Milvus in production
"""

import faiss
import numpy as np
import pickle
import os
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel
from loguru import logger
from pathlib import Path


class SearchResult(BaseModel):
    """Single search result"""
    chunk_id: int
    score: float
    content: str
    metadata: Dict[str, Any]
    document_id: int
    source_authority: str


class VectorDatabase:
    """
    FAISS-based vector database
    
    For production, replace with Pinecone or Milvus
    """
    
    def __init__(self, dimension: int = 384, index_path: str = "data/vector_index"):
        """
        Initialize vector database
        
        Args:
            dimension: Embedding dimension (3072 for text-embedding-3-large)
            index_path: Path to save/load index
        """
        self.dimension = dimension
        self.index_path = Path(index_path)
        self.index_path.mkdir(parents=True, exist_ok=True)
        
        # FAISS index
        self.index: Optional[faiss.Index] = None
        
        # Metadata storage (chunk_id -> metadata)
        self.metadata: Dict[int, Dict[str, Any]] = {}
        
        # ID mapping (faiss_id -> chunk_id)
        self.id_mapping: Dict[int, int] = {}
        
        # Load existing index if available
        self._load_index()
        
        logger.info(f"Vector database initialized with dimension {dimension}")
    
    def _load_index(self):
        """Load existing index from disk"""
        index_file = self.index_path / "faiss.index"
        metadata_file = self.index_path / "metadata.pkl"
        mapping_file = self.index_path / "id_mapping.pkl"
        
        if index_file.exists() and metadata_file.exists():
            try:
                self.index = faiss.read_index(str(index_file))
                
                with open(metadata_file, "rb") as f:
                    self.metadata = pickle.load(f)
                
                with open(mapping_file, "rb") as f:
                    self.id_mapping = pickle.load(f)
                
                logger.info(f"Loaded existing index with {self.index.ntotal} vectors")
            except Exception as e:
                logger.error(f"Failed to load index: {e}")
                self._create_new_index()
        else:
            self._create_new_index()
    
    def _create_new_index(self):
        """Create new FAISS index"""
        # Use IndexFlatIP for inner product (cosine similarity with normalized vectors)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = {}
        self.id_mapping = {}
        logger.info("Created new FAISS index")
    
    def save_index(self):
        """Save index to disk"""
        try:
            index_file = self.index_path / "faiss.index"
            metadata_file = self.index_path / "metadata.pkl"
            mapping_file = self.index_path / "id_mapping.pkl"
            
            faiss.write_index(self.index, str(index_file))
            
            with open(metadata_file, "wb") as f:
                pickle.dump(self.metadata, f)
            
            with open(mapping_file, "wb") as f:
                pickle.dump(self.id_mapping, f)
            
            logger.info(f"Saved index with {self.index.ntotal} vectors")
        except Exception as e:
            logger.error(f"Failed to save index: {e}")
    
    def add_vectors(
        self,
        embeddings: List[List[float]],
        chunk_ids: List[int],
        metadata_list: List[Dict[str, Any]]
    ):
        """
        Add vectors to index
        
        Args:
            embeddings: List of embedding vectors
            chunk_ids: List of chunk IDs
            metadata_list: List of metadata dicts
        """
        if len(embeddings) != len(chunk_ids) or len(embeddings) != len(metadata_list):
            raise ValueError("Embeddings, chunk_ids, and metadata_list must have same length")
        
        # Convert to numpy array and normalize
        vectors = np.array(embeddings, dtype=np.float32)
        faiss.normalize_L2(vectors)  # Normalize for cosine similarity
        
        # Get current index size
        start_id = self.index.ntotal
        
        # Add to FAISS
        self.index.add(vectors)
        
        # Store metadata and mapping
        for i, (chunk_id, metadata) in enumerate(zip(chunk_ids, metadata_list)):
            faiss_id = start_id + i
            self.id_mapping[faiss_id] = chunk_id
            self.metadata[chunk_id] = metadata
        
        logger.info(f"Added {len(embeddings)} vectors to index")
        
        # Auto-save after adding
        self.save_index()
    
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """
        Search for similar vectors
        
        Args:
            query_embedding: Query vector
            top_k: Number of results to return
            filter_metadata: Optional metadata filters (e.g., {"domain": "Insurance"})
        
        Returns:
            List of SearchResult objects
        """
        if self.index.ntotal == 0:
            logger.warning("Index is empty, returning no results")
            return []
        
        # Convert to numpy and normalize
        query_vector = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(query_vector)
        
        # Search
        # Get more results if filtering
        search_k = top_k * 3 if filter_metadata else top_k
        scores, faiss_ids = self.index.search(query_vector, search_k)
        
        # Convert to results
        results = []
        for score, faiss_id in zip(scores[0], faiss_ids[0]):
            if faiss_id == -1:  # FAISS returns -1 for missing results
                continue
            
            chunk_id = self.id_mapping.get(int(faiss_id))
            if chunk_id is None:
                continue
            
            metadata = self.metadata.get(chunk_id, {})
            
            # Apply filters
            if filter_metadata:
                if not self._matches_filter(metadata, filter_metadata):
                    continue
            
            results.append(SearchResult(
                chunk_id=chunk_id,
                score=float(score),
                content=metadata.get("content", ""),
                metadata=metadata,
                document_id=metadata.get("document_id", 0),
                source_authority=metadata.get("source_authority", "Unknown")
            ))
            
            if len(results) >= top_k:
                break
        
        logger.info(f"Search returned {len(results)} results")
        return results
    
    def _matches_filter(self, metadata: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Check if metadata matches filters"""
        for key, value in filters.items():
            if metadata.get(key) != value:
                return False
        return True
    
    def delete_by_document_id(self, document_id: int):
        """
        Delete all chunks for a document
        
        Note: FAISS doesn't support deletion, so we rebuild the index
        """
        logger.info(f"Deleting chunks for document {document_id}")
        
        # Find chunks to keep
        chunks_to_keep = []
        for chunk_id, metadata in self.metadata.items():
            if metadata.get("document_id") != document_id:
                chunks_to_keep.append(chunk_id)
        
        if len(chunks_to_keep) == len(self.metadata):
            logger.info("No chunks to delete")
            return
        
        # Rebuild index (expensive operation)
        logger.warning("Rebuilding index after deletion (this may take time)")
        
        # This is a simplified approach
        # In production, use a database that supports deletion
        # or implement a more sophisticated rebuild strategy
        
        # For now, just remove from metadata
        # The vectors will remain in FAISS but won't be accessible
        self.metadata = {
            chunk_id: meta
            for chunk_id, meta in self.metadata.items()
            if meta.get("document_id") != document_id
        }
        
        self.save_index()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        return {
            "total_vectors": self.index.ntotal if self.index else 0,
            "dimension": self.dimension,
            "total_chunks": len(self.metadata),
            "unique_documents": len(set(
                meta.get("document_id", 0)
                for meta in self.metadata.values()
            ))
        }


# Global vector database instance
_vector_db: Optional[VectorDatabase] = None


def get_vector_db() -> VectorDatabase:
    """Get or create global vector database instance"""
    global _vector_db
    
    if _vector_db is None:
        _vector_db = VectorDatabase()
    
    return _vector_db
