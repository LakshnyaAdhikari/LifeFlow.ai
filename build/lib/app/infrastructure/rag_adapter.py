from typing import List, Dict, Any
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_community.embeddings import FakeEmbeddings
from app.interfaces.repositories import KnowledgeRetriever

class FAISSRAGAdapter(KnowledgeRetriever):
    def __init__(self, index_path: str = "faiss_index"):
        self.index_path = index_path
        self.embeddings = FakeEmbeddings(size=1536) 
        self.vector_store = None
        self._load_or_create_index()

    def _load_or_create_index(self):
        try:
            self.vector_store = FAISS.load_local(self.index_path, self.embeddings, allow_dangerous_deserialization=True)
        except Exception:
            self.vector_store = FAISS.from_texts(["Initial empty document"], self.embeddings)

    def ingest_documents(self, docs: List[Dict[str, Any]]):
        documents = [
            Document(page_content=d["content"], metadata=d["metadata"]) 
            for d in docs
        ]
        self.vector_store.add_documents(documents)
        self.vector_store.save_local(self.index_path)

    def retrieve_context(self, query: str, context_keys: dict = None) -> List[Dict[str, Any]]:
        # context_keys unused in simplified FAISS MVP
        results = self.vector_store.similarity_search_with_score(query, k=3)
        
        structured_results = []
        for doc, score in results:
            structured_results.append({
                "content": doc.page_content,
                "source": doc.metadata.get("source", "Unknown"),
                "jurisdiction": doc.metadata.get("jurisdiction", "General"),
                "retrieval_score": float(score),
                "type": doc.metadata.get("type", "Info")
            })
        return structured_results
