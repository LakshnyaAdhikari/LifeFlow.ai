from typing import List, Dict, Any
from langchain.vectorstores import FAISS
from langchain.docstore.document import Document
# form langchain.embeddings import OpenAIEmbeddings # Uncomment for real usage
from langchain.embeddings import FakeEmbeddings # For MVP demo without API keys

class RAGService:
    def __init__(self, index_path: str = "faiss_index"):
        self.index_path = index_path
        # Use FakeEmbeddings for safe MVP runnable demo. 
        # Replace with OpenAIEmbeddings() or HuggingFaceEmbeddings() in production.
        self.embeddings = FakeEmbeddings(size=1536) 
        self.vector_store = None
        self._load_or_create_index()

    def _load_or_create_index(self):
        try:
            self.vector_store = FAISS.load_local(self.index_path, self.embeddings)
        except Exception:
            # Initialize empty store
            self.vector_store = FAISS.from_texts(["Initial empty document"], self.embeddings)

    def ingest_documents(self, docs: List[Dict[str, Any]]):
        """
        Ingests a list of documents.
        docs format: [{"content": "text...", "metadata": {"source": "url", "type": "statute"}}]
        """
        documents = [
            Document(page_content=d["content"], metadata=d["metadata"]) 
            for d in docs
        ]
        self.vector_store.add_documents(documents)
        self.vector_store.save_local(self.index_path)

    def retrieve(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves relevant context with provenance.
        Returns: [{"content": "...", "source": "...", "score": 0.9}]
        """
        # FAISS search_with_score returns (Document, score) where score is L2 distance (lower is better)
        results = self.vector_store.similarity_search_with_score(query, k=k)
        
        structured_results = []
        for doc, score in results:
            structured_results.append({
                "content": doc.page_content,
                "source": doc.metadata.get("source", "Unknown"),
                "jurisdiction": doc.metadata.get("jurisdiction", "General"),
                "retrieval_score": float(score), # Raw distance
                "type": doc.metadata.get("type", "Info")
            })
        
        return structured_results

# Singleton instance
rag_service = RAGService()
