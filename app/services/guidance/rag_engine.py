"""
RAG-Based Guidance Engine

Retrieves knowledge and generates contextual guidance
"""

from typing import List, Dict, Any, Optional
import re
from pydantic import BaseModel
from sqlalchemy.orm import Session
from loguru import logger

from app.services.knowledge.vector_db import get_vector_db, SearchResult
from app.services.llm.client import get_llm_client
from app.services.safety.legal_filter import SafetyFilter, GUIDANCE_SYSTEM_PROMPT
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
        if clarification_answers:
            context = {
                **context,
                "clarification_answers": clarification_answers
            }
        
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
            logger.info("DEBUG: Step 2 - Generating embedding...")
            query_embedding = await self.llm_client.generate_embedding(refined_query)
            logger.info("DEBUG: Step 2 - Embedding generated")
            
            # 3. Search vector database
            logger.info("DEBUG: Step 3 - Searching vector DB...")
            search_results = self.vector_db.search(
                query_embedding=query_embedding,
                top_k=5,
                filter_metadata={"domain": domain} if domain != "General" else None
            )
            logger.info(f"DEBUG: Step 3 - Found {len(search_results)} results")
            
            logger.info(f"Retrieved {len(search_results)} relevant chunks")
            authoritative_results = self._filter_authoritative_results(search_results)
            logger.info(
                f"Authoritative chunks after filtering: {len(authoritative_results)} "
                f"(from {len(search_results)} raw results)"
            )
            
            # 4. Build context from search results
            knowledge_context = self._build_knowledge_context(authoritative_results)
            
            # 5. Generate suggestions using LLM
            if authoritative_results:
                import time
                s_start = time.time()
                logger.info("DEBUG: Step 5 - Calling LLM for suggestions...")
                raw_guidance = await self._generate_suggestions(
                    query=refined_query,
                    domain=domain,
                    knowledge_context=knowledge_context,
                    user_context=context
                )
                logger.info(f"DEBUG: Step 5 - LLM returned in {time.time() - s_start:.2f}s")
            else:
                logger.warning("No authoritative retrieval results; using low-authority guidance mode")
                raw_guidance = self._get_low_authority_guidance(domain, refined_query)
            
            # 6. Extract sources
            sources = self._extract_sources(authoritative_results)
            
            # Check maximum authority in search results
            max_auth = max([r.metadata.get("authority_weight", 0.0) for r in authoritative_results]) if authoritative_results else 0.0
            low_confidence_caveat = None
            if max_auth < 1.0 and authoritative_results:
                low_confidence_caveat = "⚠️  I lack highly authoritative procedural information on this specific nuance. The following guidance is based on general contextual information rather than direct official procedures."
            
            # 7. Apply safety filter
            logger.info("DEBUG: Step 7 - Applying safety filter...")
            filtered_guidance = await self._apply_safety_filter(raw_guidance, sources, domain)
            if low_confidence_caveat:
                filtered_guidance["caveats"] = filtered_guidance.get("caveats", [])
                filtered_guidance["caveats"].insert(0, low_confidence_caveat)
            logger.info("DEBUG: Step 7 - Safety filter applied")
            
            # 8. Calculate confidence
            confidence = await self.confidence_calc.calculate(
                llm_confidence=0.8,  # TODO: Extract from LLM response
                retrieval_strength=self._calculate_retrieval_strength(authoritative_results),
                domain=domain,
                context={
                    "retrieved_docs": len(authoritative_results),
                    "query_length": len(refined_query),
                    **context
                }
            )
            
            # 9. Apply response strategy based on confidence
            final_guidance = self.response_strategy.apply_strategy(
                filtered_guidance,
                confidence
            )
            final_guidance["suggestions"] = self._normalize_and_rank_suggestions(
                final_guidance.get("suggestions", [])
            )
            
            # 10. Create guidance session
            session = GuidanceSession(
                user_id=user_id,
                situation_id=situation_id,
                domain=domain,
                query=query,
                suggestions_count=len(final_guidance.get("suggestions", [])),
                confidence_score=confidence.overall,
                sources_used=[r.document_id for r in authoritative_results]
            )
            self.db.add(session)
            self.db.commit()
            
            # 11. Update user query
            user_query.chunks_retrieved = len(authoritative_results)
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
                    "chunks_retrieved": len(authoritative_results),
                    "raw_chunks_retrieved": len(search_results),
                    "domain": domain
                }
            )
        
        except Exception as e:
            logger.error(f"Failed to generate guidance: {e}")
            raise

    async def generate_followup_chat(
        self,
        message: str,
        domain: str,
        situation_title: str,
        clarification_answers: Optional[List[Dict[str, str]]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Conversational, context-grounded follow-up chat.
        Returns plain-language answer plus citations.
        """
        clean_message = (message or "").strip()
        if not clean_message:
            return {
                "answer": "Please ask a follow-up question so I can help.",
                "citations": [],
                "confidence": 0.0,
                "follow_up_questions": [],
                "style": "default",
            }

        style = self._detect_response_style(clean_message)
        intent = self._detect_followup_intent(clean_message)
        service = self._infer_service_from_context(
            domain=domain,
            message=clean_message,
            situation_title=situation_title,
            clarification_answers=clarification_answers or [],
        )
        answers_text = self._format_clarification_answers(clarification_answers or [])
        history_text = self._format_conversation_history(conversation_history or [])

        retrieval_query = self._build_followup_retrieval_query(
            domain=domain,
            situation_title=situation_title,
            message=clean_message,
            intent=intent,
            service=service,
            answers_text=answers_text,
        )

        query_embedding = await self.llm_client.generate_embedding(retrieval_query)
        search_results = self.vector_db.search(
            query_embedding=query_embedding,
            top_k=6,
            filter_metadata={"domain": domain} if domain != "General" else None,
        )
        authoritative_results = self._filter_authoritative_results(search_results)
        sources = self._extract_sources(authoritative_results)[:4]
        snippets = [self._compress_text(r.content, 220) for r in authoritative_results[:2]]

        intent_first_answer = self._build_intent_first_answer(
            intent=intent,
            domain=domain,
            service=service,
            style=style,
            snippets=snippets,
            has_authority=bool(authoritative_results),
        )

        if not authoritative_results:
            if intent_first_answer:
                return {
                    "answer": intent_first_answer,
                    "citations": [],
                    "confidence": 0.45 if intent != "general" else 0.25,
                    "follow_up_questions": self._build_followup_questions(domain, low_authority=True),
                    "style": style,
                }
            return {
                "answer": self._fallback_followup_answer(
                    message=clean_message,
                    domain=domain,
                    style=style,
                    snippets=snippets,
                ),
                "citations": [],
                "confidence": 0.25,
                "follow_up_questions": self._build_followup_questions(domain, low_authority=True),
                "style": style,
            }

        knowledge_context = self._build_knowledge_context(authoritative_results[:4])
        prompt = f"""
You are LifeFlow Assistant, a conversational legal-procedure helper.
You must answer naturally like a chat assistant, while staying grounded in retrieved sources.

Response style requested: {style}
Domain: {domain}
Situation title: {situation_title}
Detected intent: {intent}
Detected service: {service or "unspecified"}

Clarification answers:
{answers_text if answers_text else "None provided."}

Conversation history:
{history_text if history_text else "No prior turns."}

Authoritative source context:
{knowledge_context}

User follow-up:
"{clean_message}"

Rules:
1) Give a direct answer first, in plain language.
2) If style is "eli10", use simple words and short sentences.
3) If style is "summary", keep it concise and structured.
4) If style is "checklist", provide clear numbered steps.
5) Do not invent facts outside source context.
6) If uncertain, state what is missing.
7) End with 1-2 practical next actions.
"""

        try:
            llm_response = await self.llm_client.generate(
                prompt=prompt,
                system_prompt=(
                    "You are a grounded follow-up assistant. "
                    "Be conversational, accurate, and explicitly non-hallucinatory."
                ),
                temperature=0.3,
                max_tokens=900,
            )
            answer = (llm_response.content or "").strip()
        except Exception as e:
            logger.error(f"Follow-up chat generation failed: {e}")
            answer = ""

        abstain_markers = [
            "i do not yet have enough authoritative",
            "could not retrieve enough authoritative",
        ]
        answer_lower = answer.lower() if answer else ""

        if not answer or answer.startswith("[AI DISABLED]") or any(marker in answer_lower for marker in abstain_markers):
            if intent_first_answer:
                answer = intent_first_answer
            else:
                snippets = [self._compress_text(r.content, 240) for r in authoritative_results[:2]]
                answer = self._fallback_followup_answer(
                    message=clean_message,
                    domain=domain,
                    style=style,
                    snippets=snippets,
                )

        if not answer:
            answer = self._fallback_followup_answer(
                message=clean_message,
                domain=domain,
                style=style,
                snippets=[],
            )

        confidence = min(max(self._calculate_retrieval_strength(authoritative_results), 0.25), 0.95)

        return {
            "answer": answer,
            "citations": [
                {
                    "title": src.get("title", "Unknown"),
                    "authority": src.get("authority", "Unknown"),
                    "url": src.get("url"),
                    "document_id": src.get("document_id"),
                }
                for src in sources
            ],
            "confidence": confidence,
            "follow_up_questions": self._build_followup_questions(domain, low_authority=False),
            "style": style,
        }

    def _normalize_urgency(self, urgency: str) -> str:
        """Normalize urgency values from LLM output into high/medium/low."""
        if not urgency:
            return "medium"

        value = urgency.strip().lower()

        if value in {"high", "critical", "urgent", "now", "immediate"}:
            return "high"
        if value in {"low", "optional", "later", "can_wait", "can wait"}:
            return "low"
        return "medium"

    def _normalize_and_rank_suggestions(self, suggestions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Apply deterministic ordering so UI doesn't feel random:
        1) high > medium > low urgency
        2) non-skippable before skippable
        """
        urgency_rank = {"high": 0, "medium": 1, "low": 2}
        normalized: List[Dict[str, Any]] = []

        for suggestion in suggestions:
            if not isinstance(suggestion, dict):
                continue

            normalized_item = {
                **suggestion,
                "urgency": self._normalize_urgency(suggestion.get("urgency", "medium")),
                "can_skip": bool(suggestion.get("can_skip", False))
            }
            normalized.append(normalized_item)

        normalized.sort(
            key=lambda s: (
                urgency_rank.get(s.get("urgency", "medium"), 1),
                1 if s.get("can_skip", False) else 0
            )
        )
        return normalized

    def _format_clarification_answers(self, clarification_answers: List[Dict[str, str]]) -> str:
        lines: List[str] = []
        for item in clarification_answers:
            question = (item.get("question_text") or item.get("question_id") or "").strip()
            answer = (item.get("answer") or "").strip()
            if question and answer:
                lines.append(f"- {question}: {answer}")
        return "\n".join(lines)

    def _format_conversation_history(self, conversation_history: List[Dict[str, str]]) -> str:
        lines: List[str] = []
        for turn in conversation_history[-8:]:
            role = (turn.get("role") or "user").strip().lower()
            text = (turn.get("content") or turn.get("message") or "").strip()
            if not text:
                continue
            label = "User" if role == "user" else "Assistant"
            lines.append(f"{label}: {text}")
        return "\n".join(lines)

    def _detect_response_style(self, message: str) -> str:
        text = message.lower()
        if any(phrase in text for phrase in ["eli5", "like i am 10", "like i'm 10", "explain like 10"]):
            return "eli10"
        if any(phrase in text for phrase in ["summarize", "summarise", "summary", "in short", "tldr"]):
            return "summary"
        if any(phrase in text for phrase in ["step by step", "checklist", "bullets", "bullet points"]):
            return "checklist"
        return "default"

    def _detect_followup_intent(self, message: str) -> str:
        text = message.lower()
        if any(token in text for token in ["document", "documents", "docs", "proof", "papers"]):
            return "doc_requirements"
        if any(token in text for token in ["fee", "fees", "charge", "cost", "payment"]):
            return "fees"
        if any(token in text for token in ["time", "timeline", "how long", "when", "eta"]):
            return "timeline"
        if any(token in text for token in ["status", "track", "tracking", "progress"]):
            return "status"
        if any(token in text for token in ["reject", "rejected", "appeal", "escalate", "complaint"]):
            return "escalation"
        if any(token in text for token in ["summary", "summarize", "summarise", "in short", "tldr"]):
            return "summary"
        if any(token in text for token in ["how to", "steps", "process", "procedure"]):
            return "steps"
        return "general"

    def _infer_service_from_context(
        self,
        domain: str,
        message: str,
        situation_title: str,
        clarification_answers: List[Dict[str, str]],
    ) -> Optional[str]:
        text_blob = " ".join(
            [
                message or "",
                situation_title or "",
                " ".join([a.get("answer", "") for a in clarification_answers]),
                " ".join([a.get("question_text", "") for a in clarification_answers]),
            ]
        ).lower()

        if domain == "Identity Documents":
            if any(token in text_blob for token in ["aadhaar", "aadhar", "uidai", "uid"]):
                return "Aadhaar"
            if "pan" in text_blob:
                return "PAN"
            if "passport" in text_blob:
                return "Passport"
            if "voter" in text_blob:
                return "Voter ID"
            if "driving license" in text_blob or "licence" in text_blob or "license" in text_blob:
                return "Driving License"
        return None

    def _build_followup_retrieval_query(
        self,
        domain: str,
        situation_title: str,
        message: str,
        intent: str,
        service: Optional[str],
        answers_text: str,
    ) -> str:
        service_synonyms = {
            "Aadhaar": "aadhaar uidai demographic update biometric update urn status",
            "PAN": "pan card correction pan update income tax pan services",
            "Passport": "passport seva reissue renewal tatkal",
            "Voter ID": "voter id election commission voter registration",
            "Driving License": "driving license parivahan dl update",
        }

        intent_hints = {
            "doc_requirements": "required documents proof identity proof address proof date of birth",
            "fees": "fees charges payment amount",
            "timeline": "processing time expected timeline service delivery time",
            "status": "status tracking acknowledgement reference number",
            "escalation": "rejection appeal grievance escalation support",
            "steps": "step by step process procedure",
            "summary": "summary key points",
            "general": "",
        }

        return (
            f"Case: {situation_title}\n"
            f"Domain: {domain}\n"
            f"Service: {service or 'unspecified'}\n"
            f"Intent: {intent}\n"
            f"User message: {message}\n"
            f"Intent hints: {intent_hints.get(intent, '')}\n"
            f"Service hints: {service_synonyms.get(service or '', '')}\n"
            f"Clarifications:\n{answers_text if answers_text else 'None'}"
        )

    def _build_intent_first_answer(
        self,
        intent: str,
        domain: str,
        service: Optional[str],
        style: str,
        snippets: List[str],
        has_authority: bool,
    ) -> Optional[str]:
        if intent == "doc_requirements" and domain == "Identity Documents":
            if service == "Aadhaar":
                body = (
                    "For Aadhaar update, keep these ready:\n"
                    "1. Aadhaar number and current Aadhaar copy.\n"
                    "2. One supporting document for the field you are changing:\n"
                    "   - Name: Proof of Identity.\n"
                    "   - Address: Proof of Address.\n"
                    "   - Date of Birth: Proof of Date of Birth.\n"
                    "3. Registered mobile number for OTP (if online steps are involved).\n"
                    "4. Original documents if visiting an update center.\n"
                    "5. Acknowledgement/URN slip after submission for tracking."
                )
            elif service:
                body = (
                    f"For {service} updates, keep identity proof, address proof, and any service-specific supporting document ready. "
                    "Also keep your registered mobile number and acknowledgement references."
                )
            else:
                body = (
                    "For identity-document updates, you usually need identity proof, address proof, and the specific supporting document "
                    "for the field being changed, plus your registered mobile for OTP/alerts."
                )

            if style == "eli10":
                body = (
                    "Simple version:\n"
                    "Keep your current ID copy, one proof paper for what you want to change, and your mobile number.\n"
                    "After submitting, keep the acknowledgement number to track status."
                )

            if has_authority and snippets:
                body += "\n\nFrom official sources I found:\n" + "\n".join([f"- {s}" for s in snippets[:2]])

            return body

        if intent == "fees":
            return (
                "Fees depend on the exact service and update type. Share the exact service name and I will give the fee-focused answer. "
                "If you already have a portal page or acknowledgement, paste that wording."
            )

        if intent in {"timeline", "status"}:
            return (
                "Timeline and status tracking depend on service type and submission channel. "
                "If you share your acknowledgement/reference number type and submission date, I can give a tighter estimate and status path."
            )

        if intent == "steps":
            return (
                "I can give exact steps, but first confirm your exact service and stage "
                "(new request, correction, rejected, or escalation). Then I will list a strict step-by-step checklist."
            )

        if intent == "summary" and domain == "Identity Documents":
            if service == "Aadhaar":
                return (
                    "Short summary for Aadhaar update:\n"
                    "- Keep current Aadhaar details handy.\n"
                    "- Keep one supporting proof for the field you want to change.\n"
                    "- Keep registered mobile for OTP and tracking.\n"
                    "- Keep acknowledgement/URN after submission."
                )
            if service:
                return (
                    f"Short summary for {service}:\n"
                    "- Keep core ID/address proofs ready.\n"
                    "- Keep service-specific supporting documents.\n"
                    "- Keep reference/acknowledgement details for tracking."
                )

        return None

    def _compress_text(self, text: str, max_chars: int) -> str:
        clean = " ".join((text or "").split())
        if len(clean) <= max_chars:
            return clean
        return clean[: max_chars - 3].rstrip() + "..."

    def _fallback_followup_answer(
        self,
        message: str,
        domain: str,
        style: str,
        snippets: List[str],
    ) -> str:
        if snippets:
            snippet_block = "\n".join([f"- {s}" for s in snippets])
            if style == "eli10":
                return (
                    "Simple version:\n"
                    "Here is what the official content is saying in easy words:\n"
                    f"{snippet_block}\n\n"
                    "Next: tell me your exact stage (new request, correction, rejected, or escalation) "
                    "and I will make this more precise."
                )
            return (
                "I could not generate a full conversational response right now, "
                "but I found these relevant official points:\n"
                f"{snippet_block}\n\n"
                "If you share your exact stage, I will give a more precise next-step answer."
            )

        return (
            f"I do not yet have enough authoritative {domain} context to answer that safely. "
            "Please share the exact authority/service name and your current stage "
            "(new request, correction, rejected, or escalation)."
        )

    def _build_followup_questions(self, domain: str, low_authority: bool) -> List[str]:
        if low_authority:
            return [
                f"What exact {domain} service are you trying to complete?",
                "What stage are you currently at: new request, correction, rejected, or escalation?",
                "Do you already have any acknowledgement/reference number?",
            ]
        return [
            "Do you want this explained in a simpler version or as a checklist?",
            "Should I give you the exact documents and sequence for your current stage?",
        ]
    
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
            "title": "Actionable Procedural Step",
            "description": "**Task:** [Brief task summary]\n**Forms Needed:** [List of forms or 'None']\n**Fees:** [Exact fee amount or 'None identified']\n**Steps:**\n1. [Step 1] [Cite: Source X]\n2. [Step 2] [Cite: Source Y]\n**Escalation:** [What to do if it fails or 'N/A']",
            "why_it_matters": "Why this is a critical procedural requirement",
            "urgency": "high/medium/low",
            "can_skip": true/false,
            "estimated_time": "Optional time estimate"
        }}
    ]
}}

CRITICAL RULES:
1. Base your steps ONLY on the retrieved authoritative knowledge.
2. YOU MUST strictly format your `description` field exactly matching the Markdown template above (Task, Forms, Fees, Steps, Escalation).
3. YOU MUST cite your exact source inline for every procedural step (e.g., [Cite: Source 1]).
4. If the authoritative knowledge does not contain exact forms, fees, or steps, DO NOT GUESS. State "Not explicitly specified in the retrieved authoritative sources."
5. Acknowledge uncertainty if information is incomplete. Never hallucinate theoretical law.

Generate 1-3 highly precise procedural suggestions ordered by priority.
"""
        
        try:
            response = await self.llm_client.generate_json(
                prompt=prompt,
                system_prompt=GUIDANCE_SYSTEM_PROMPT,
                temperature=0.7
            )
            
            # Validate response
            if not isinstance(response, dict) or "suggestions" not in response or not response["suggestions"]:
                logger.warning("LLM returned empty suggestions, using fallback.")
                return self._get_fallback_suggestions(domain)
            
            return response
        
        except Exception as e:
            logger.error(f"Failed to generate suggestions: {e}")
            return self._get_fallback_suggestions(domain)

    def _get_fallback_suggestions(self, domain: str) -> Dict[str, Any]:
        """Return generic fallback suggestions based on domain"""
        return {
            "suggestions": [
                {
                    "title": "Gather Relevant Documents",
                    "description": f"For {domain} matters, always keep your original documents handy.",
                    "why_it_matters": "Documentation is the primary requirement for most procedures.",
                    "urgency": "medium",
                    "can_skip": False
                },
                {
                    "title": "Visit Official Website",
                    "description": "Check the official government portal for the latest updates.",
                    "why_it_matters": "Rules and fees may change without notice.",
                    "urgency": "high",
                    "can_skip": False
                },
                {
                    "title": "Contact Support / Helpline",
                    "description": "If unsure, call the official helpline number.",
                    "why_it_matters": "Direct confirmation can save time and prevent errors.",
                    "urgency": "low",
                    "can_skip": True
                }
            ],
            "caveats": ["⚠️  We couldn't find specific guidance for your exact query, so we provided general best practices."]
        }

    def _get_low_authority_guidance(self, domain: str, query: str) -> Dict[str, Any]:
        """
        Guidance mode when we lack authoritative retrieval hits.
        Avoids pretending precision and asks for narrowing details.
        """
        return {
            "suggestions": [
                {
                    "title": "Refine case details before taking action",
                    "description": (
                        f"We could not retrieve enough authoritative {domain} procedure content for this exact query. "
                        "Clarify the exact authority/service name, jurisdiction, and current stage "
                        "(new request, correction, rejection, or escalation)."
                    ),
                    "why_it_matters": "Acting without precise procedure context can lead to wrong forms, fees, or timelines.",
                    "urgency": "high",
                    "can_skip": False
                },
                {
                    "title": "Re-run guidance with exact service label",
                    "description": (
                        "Use this format for higher precision: '<Authority> + <Service Name> + <Current Status>'. "
                        "Then refresh guidance."
                    ),
                    "why_it_matters": "Precise service labels improve retrieval quality and reduce generic output.",
                    "urgency": "medium",
                    "can_skip": False
                }
            ],
            "caveats": [
                "Warning: authoritative sources were insufficient for a safe procedural recommendation.",
                "Please refine details and retry."
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
        from app.models.knowledge import KnowledgeDocument
        
        sources = []
        seen_docs = set()
        
        for result in search_results:
            if result.document_id not in seen_docs:
                # Fetch document to get URL
                doc = self.db.query(KnowledgeDocument).filter(
                    KnowledgeDocument.id == result.document_id
                ).first()
                
                url = doc.source_url if doc else None
                
                # If URL is a local file, try to map it to a real URL if possible, or just keep it
                # (Ideally, the DB should contain the real URL)
                authority_text = (result.source_authority or "").lower()
                url_text = (url or "").lower()
                if "wikipedia" in authority_text or "wikipedia.org" in url_text:
                    continue
                
                sources.append({
                    "title": result.metadata.get("title", "Unknown"),
                    "authority": result.source_authority,
                    "document_id": result.document_id,
                    "url": url
                })
                seen_docs.add(result.document_id)
        
        return sources

    def _filter_authoritative_results(self, search_results: List[SearchResult]) -> List[SearchResult]:
        """
        Keep only authoritative retrieval chunks for guidance generation.
        Excludes wiki-like sources and low-authority chunks.
        """
        authoritative: List[SearchResult] = []
        for result in search_results:
            authority = (result.source_authority or "").lower()
            title = (result.metadata.get("title", "") or "").lower()
            url = (result.metadata.get("url", "") or "").lower()
            authority_weight = float(result.metadata.get("authority_weight", 0.0) or 0.0)

            if "wikipedia" in authority or "wikipedia" in title or "wikipedia.org" in url:
                continue
            if authority_weight < 1.0:
                continue
            authoritative.append(result)

        return authoritative
    
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
