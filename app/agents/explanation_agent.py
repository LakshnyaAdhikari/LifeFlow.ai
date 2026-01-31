from app.rag_service import rag_service

class ExplanationAgent:
    def explain_step(self, step_name: str, jurisdiction: str) -> Dict[str, Any]:
        """
        Generates a plain-language explanation for a step using RAG.
        """
        query = f"How to complete step: {step_name} in {jurisdiction}"
        context = rag_service.retrieve(query)
        
        # In a real app, we would send 'context' + 'query' to an LLM (GPT-4)
        # to generate the summary. Here we return the raw context for MVP.
        
        explanation = f"To complete '{step_name}', you generally need to follow the official procedures."
        
        if not context:
            explanation += " No specific legal documents found in our database."
        else:
            explanation += " Based on our records:"
            
        return {
            "explanation": explanation,
            "citations": context
        }

explanation_agent = ExplanationAgent()
