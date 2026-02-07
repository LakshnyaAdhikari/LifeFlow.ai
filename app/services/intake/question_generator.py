"""
Clarification Question Generator
Generates structured questions to clarify user intent before RAG execution.
Uses fast model (gemini-2.5-flash-lite) for low latency (<3s).
"""

from typing import List, Optional
from pydantic import BaseModel
from loguru import logger
import json

from app.services.llm.client import get_llm_client

class ClarificationQuestion(BaseModel):
    id: str
    text: str
    type: str  # "choice" or "text"
    options: Optional[List[str]] = None

class ClarificationResponse(BaseModel):
    questions: List[ClarificationQuestion]

class ClarificationGenerator:
    def __init__(self):
        self.llm_client = get_llm_client()
        # Ensure we use the fast model
        # Note: Client defaults to gemini-2.5-flash-lite which is perfect

    async def generate_questions(self, query: str, domain: str) -> List[ClarificationQuestion]:
        """
        Generate 2-3 high-signal clarifying questions
        """
        logger.info(f"Generating clarification questions for: {query} ({domain})")
        
        prompt = f"""
You are an expert intake specialist for: {domain}.
The user has asked: "{query}"

Your goal is to ask 2-3 short, high-signal questions to clarify their situation so we can give better guidance.
Answers should help narrow down: Jurisdiction, Specific Policy Type, or Currect Status.

Refuse to ask about PII (Name, Phone, etc).
Focus on dropdown/choice questions where possible.

Return a JSON object strictly following this schema:
{{
  "questions": [
    {{
      "id": "unique_id",
      "text": "The question text?",
      "type": "choice", 
      "options": ["Option A", "Option B", "Other"]
    }},
    {{
      "id": "open_ended_id",
      "text": "Briefly explain X...",
      "type": "text"
    }}
  ]
}}

Generate exactly 2 or 3 questions.
"""
        
        try:
            # We use generate_json directly
            # Note: For Gemini, we must ensure the prompt asks for JSON (which it does above)
            response_dict = await self.llm_client.generate_json(
                prompt=prompt,
                temperature=0.3 # Low temp for consistency
            )
            
            # Parse into Pydantic models for validation
            validated = ClarificationResponse(**response_dict)
            return validated.questions
            
        except Exception as e:
            logger.error(f"Failed to generate questions: {e}")
            # Fallback questions if LLM fails
            return [
                ClarificationQuestion(
                    id="generic_context",
                    text="Could you provide more details about your specific situation?",
                    type="text"
                )
            ]

_generator: Optional[ClarificationGenerator] = None

def get_clarification_generator() -> ClarificationGenerator:
    global _generator
    if not _generator:
        _generator = ClarificationGenerator()
    return _generator
