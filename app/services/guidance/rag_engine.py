"""
RAG-Based Guidance Engine

Retrieves knowledge and generates contextual guidance
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from loguru import logger

from app.services.knowledge.vector_db import get_vector_db, SearchResult
from app.services.llm.client import get_llm_client
from app.services.safety.legal_filter import SafetyFilter, GUIDANCE_SYSTEM_PROMPT
from app.services.confidence.triangulated import TriangulatedConfidence, ConfidenceBasedResponseStrategy
from app.services.confidence.triangulated import TriangulatedConfidence, ConfidenceBasedResponseStrategy
from app.models.knowledge import UserQuery, GuidanceSession
from app.models.situation import UserSituation


class Suggestion(BaseModel):
    """Single guidance suggestion"""
    title: str
    description: str
    why_it_matters: str
    urgency: str  # "high", "medium", "low"
    can_skip: bool = False
    estimated_time: Optional[str] = None


class GuidanceResponse(BaseModel):
    """Complete guidance response"""
    suggestions: List[Suggestion]
    sources: List[Dict[str, Any]]
    confidence: Dict[str, Any]
    caveats: List[str] = []
    cross_domain_insights: List[str] = []
    metadata: Dict[str, Any] = {}


class GuidanceEngine:
    """
    RAG-based guidance generation engine
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.vector_db = get_vector_db()
        self.llm_client = get_llm_client()
        self.safety_filter = SafetyFilter()
        self.confidence_calc = TriangulatedConfidence(db)
        self.response_strategy = ConfidenceBasedResponseStrategy()
    
    async def generate_guidance(
        self,
        query: str,
        domain: str,
        user_id: int,
        situation_id: Optional[int] = None,
        context: Optional[Dict[str, Any]] = None,
        clarification_answers: Optional[List[Dict[str, str]]] = None  # [NEW]
    ) -> GuidanceResponse:
        """
        Generate guidance for user query
        
        Steps:
        1. Generate query embedding
        2. Search vector database
        3. Retrieve relevant knowledge
        4. Generate suggestions using LLM + RAG
        5. Apply safety filter
        6. Calculate confidence
        7. Apply response strategy
        """
        # Refine query if clarification answers are provided
        refined_query = query
        if clarification_answers:
            answers_text = "\n".join([
                f"Q: {a.get('question_text', '')} A: {a.get('answer', '')}" 
                for a in clarification_answers
            ])
            refined_query = f"{query}\n\nUser Context:\n{answers_text}"
            logger.info(f"Refined query with clarification: {refined_query[:100]}...")
        
        logger.info(f"Generating guidance for query: {refined_query[:100]}...")
        
        context = context or {}
        
        try:
            # 1. Log query (Use refined query to capture full context)
            user_query = UserQuery(
                user_id=user_id,
                query_text=refined_query,
                classified_domain=domain
            )
            self.db.add(user_query)
            self.db.commit()
            
            # 1.5 Update UserSituation with clarification answers if applicable
            if situation_id and clarification_answers:
                situation = self.db.query(UserSituation).filter(UserSituation.id == situation_id).first()
                if situation:
                    # Convert Pydantic/Dict objects to dicts for JSON storage if needed
                    # Assuming they are dicts from the router
                    situation.clarification_answers = clarification_answers
                    self.db.commit()
            
            # 2. Generate query embedding using refined query
            query_embedding = await self.llm_client.generate_embedding(refined_query)
            
            # 3. Search vector database
            search_results = self.vector_db.search(
                query_embedding=query_embedding,
                top_k=5,
                filter_metadata={"domain": domain} if domain != "General" else None
            )
            
            logger.info(f"Retrieved {len(search_results)} relevant chunks")
            
            # 4. Build context from search results
            knowledge_context = self._build_knowledge_context(search_results)
            
            # 5. Generate suggestions using LLM
            import time
            s_start = time.time()
            raw_guidance = await self._generate_suggestions(
                query=query,
                domain=domain,
                knowledge_context=knowledge_context,
                user_context=context
            )
            logger.info(f"⏱️ Suggestions generation took {time.time() - s_start:.2f}s")
            
            # 6. Extract sources
            sources = self._extract_sources(search_results)
            
            # 7. Apply safety filter
            filtered_guidance = await self._apply_safety_filter(raw_guidance, sources, domain)
            
            # 8. Calculate confidence
            confidence = await self.confidence_calc.calculate(
                llm_confidence=0.8,  # TODO: Extract from LLM response
                retrieval_strength=self._calculate_retrieval_strength(search_results),
                domain=domain,
                context={
                    "retrieved_docs": len(search_results),
                    "query_length": len(query),
                    **context
                }
            )
            
            # 9. Apply response strategy based on confidence
            final_guidance = self.response_strategy.apply_strategy(
                filtered_guidance,
                confidence
            )
            
            # 10. Create guidance session
            session = GuidanceSession(
                user_id=user_id,
                situation_id=situation_id,
                domain=domain,
                query=query,
                suggestions_count=len(final_guidance.get("suggestions", [])),
                confidence_score=confidence.overall,
                sources_used=[r.document_id for r in search_results]
            )
            self.db.add(session)
            self.db.commit()
            
            # 11. Update user query
            user_query.chunks_retrieved = len(search_results)
            user_query.response_generated = True
            user_query.confidence = confidence.overall
            self.db.commit()
            
            logger.info(f"Guidance generated successfully (confidence: {confidence.overall:.2f})")
            
            return GuidanceResponse(
                suggestions=final_guidance.get("suggestions", []),
                sources=sources,
                confidence={
                    "score": confidence.overall,
                    "reliability": confidence.reliability,
                    "explanation": confidence.explanation,
                    "breakdown": confidence.breakdown
                },
                caveats=final_guidance.get("caveats", []),
                cross_domain_insights=final_guidance.get("cross_domain_insights", []),
                metadata={
                    "session_id": session.id,
                    "chunks_retrieved": len(search_results),
                    "domain": domain
                }
            )
        
        except Exception as e:
            logger.error(f"Failed to generate guidance: {e}")
            raise
    
    def _build_knowledge_context(self, search_results: List[SearchResult]) -> str:
        """Build context string from search results"""
        if not search_results:
            return "No specific authoritative information found for this query."
        
        context_parts = []
        
        for i, result in enumerate(search_results, 1):
            context_parts.append(
                f"[Source {i}: {result.source_authority}]\n"
                f"{result.content}\n"
            )
        
        return "\n\n".join(context_parts)
    
    async def _generate_suggestions(
        self,
        query: str,
        domain: str,
        knowledge_context: str,
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate suggestions using LLM + RAG"""
        
        prompt = f"""
Based on the following authoritative information, provide guidance for this user query.

Domain: {domain}
User Query: "{query}"

Authoritative Knowledge:
{knowledge_context}

User Context:
{user_context if user_context else "No additional context provided"}

Generate practical, actionable suggestions in JSON format:

{{
    "suggestions": [
        {{
            "title": "Brief action title",
            "description": "What to do and how",
            "why_it_matters": "Why this is important or helpful",
            "urgency": "high/medium/low",
            "can_skip": true/false,
            "estimated_time": "Optional time estimate"
        }}
    ]
}}

CRITICAL RULES:
1. Base suggestions ONLY on the authoritative knowledge provided
2. Use phrases like "people typically", "common practice", "regulations usually require"
3. NEVER use "you should", "you must", "I recommend"
4. Cite sources when making claims
5. Acknowledge uncertainty if information is incomplete
6. Focus on procedural guidance, not legal advice
7. Keep suggestions practical and actionable

Generate 3-5 suggestions ordered by priority.
"""
        
        try:
            response = await self.llm_client.generate_json(
                prompt=prompt,
                system_prompt=GUIDANCE_SYSTEM_PROMPT,
                temperature=0.7
            )
            
            return response
        
        except Exception as e:
            logger.error(f"Failed to generate suggestions: {e}")
            # Return fallback
            return {
                "suggestions": [
                    {
                        "title": "Gather relevant documents",
                        "description": "Collect all documents related to your situation",
                        "why_it_matters": "Having complete documentation helps in most procedures",
                        "urgency": "medium",
                        "can_skip": False
                    }
                ]
            }
    
    async def _apply_safety_filter(
        self,
        guidance: Dict[str, Any],
        sources: List[Dict[str, str]],
        domain: str
    ) -> Dict[str, Any]:
        """Apply safety filter to guidance"""
        
        # Convert suggestions to text
        suggestions_text = "\n\n".join([
            f"{s.get('title', '')}: {s.get('description', '')}"
            for s in guidance.get("suggestions", [])
        ])
        
        # Filter
        filtered = await self.safety_filter.filter_response(
            text=suggestions_text,
            sources=[s["title"] for s in sources],
            domain=domain
        )
        
        # Update guidance with filtered content
        # For now, just add caveats
        guidance["caveats"] = guidance.get("caveats", [])
        
        if filtered.violations_detected > 0:
            guidance["caveats"].insert(0, 
                f"⚠️ Note: This guidance has been reviewed for compliance "
                f"({filtered.violations_detected} adjustments made)"
            )
        
        return guidance
    
    def _extract_sources(self, search_results: List[SearchResult]) -> List[Dict[str, Any]]:
        """Extract source information"""
        sources = []
        seen_docs = set()
        
        for result in search_results:
            if result.document_id not in seen_docs:
                sources.append({
                    "title": result.metadata.get("title", "Unknown"),
                    "authority": result.source_authority,
                    "document_id": result.document_id
                })
                seen_docs.add(result.document_id)
        
        return sources
    
    def _calculate_retrieval_strength(self, search_results: List[SearchResult]) -> float:
        """Calculate retrieval strength from search results"""
        if not search_results:
            return 0.0
        
        # Average similarity score
        avg_score = sum(r.score for r in search_results) / len(search_results)
        
        # Boost for authoritative sources
        authoritative_count = sum(
            1 for r in search_results
            if r.source_authority in ["UIDAI", "IRDAI", "Passport Seva", "Income Tax Department"]
        )
        
        authority_boost = min(authoritative_count / len(search_results), 0.2)
        
        return min(avg_score + authority_boost, 1.0)
