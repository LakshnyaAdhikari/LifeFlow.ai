from typing import Dict, Any
from app.interfaces.repositories import KnowledgeRetriever

class ExplanationAgent:
    def __init__(self, retriever: KnowledgeRetriever):
        self.retriever = retriever

    def explain_step(self, step_name: str, jurisdiction: str) -> Dict[str, Any]:
        """
        Generates a plain-language explanation for a step using injected RAG.
        """
        query = f"How to complete step: {step_name} in {jurisdiction}"
        context = self.retriever.retrieve_context(query)
        
        explanation = f"To complete '{step_name}', you generally need to follow the official procedures."
        
        if not context:
            explanation += " No specific legal documents found in our database."
        else:
            explanation += " Based on our records:"
            
        return {
            "explanation": explanation,
            "citations": context
        }
