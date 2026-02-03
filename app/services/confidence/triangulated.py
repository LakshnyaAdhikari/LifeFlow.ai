"""
Triangulated Confidence System

Combines multiple confidence signals for robust decision-making
NO single-score reliance
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from loguru import logger

from app.models.situation import UserFeedback


class ConfidenceScore(BaseModel):
    """Multi-signal confidence score"""
    overall: float  # 0.0 to 1.0
    breakdown: Dict[str, float]  # {signal: score}
    reliability: str  # "high", "medium", "low"
    explanation: str


class TriangulatedConfidence:
    """
    Combines multiple confidence signals:
    1. LLM confidence (from model probabilities)
    2. Retrieval strength (from vector similarity + source authority)
    3. Historical accuracy (from user feedback)
    """
    
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        
        # Weights for each signal
        self.llm_weight = 0.4
        self.retrieval_weight = 0.35
        self.historical_weight = 0.25
    
    async def calculate(
        self,
        llm_confidence: float,
        retrieval_strength: float,
        domain: str,
        context: Optional[Dict[str, Any]] = None
    ) -> ConfidenceScore:
        """
        Triangulate confidence from multiple sources
        
        Args:
            llm_confidence: Confidence from LLM (0.0 to 1.0)
            retrieval_strength: Strength of retrieval (0.0 to 1.0)
            domain: Domain for historical lookup
            context: Additional context for adjustments
        """
        context = context or {}
        
        # 1. Normalize LLM confidence
        llm_score = self._normalize_llm_confidence(llm_confidence)
        
        # 2. Calculate retrieval strength
        retrieval_score = self._calculate_retrieval_strength(retrieval_strength, context)
        
        # 3. Get historical accuracy
        historical_score = await self._get_historical_accuracy(domain)
        
        # 4. Weighted combination
        final_score = (
            llm_score * self.llm_weight +
            retrieval_score * self.retrieval_weight +
            historical_score * self.historical_weight
        )
        
        # 5. Apply adjustments for edge cases
        final_score = self._apply_adjustments(final_score, context)
        
        # 6. Assess reliability
        reliability = self._assess_reliability(llm_score, retrieval_score, historical_score)
        
        # 7. Generate explanation
        explanation = self._generate_explanation(
            llm_score, retrieval_score, historical_score, reliability
        )
        
        logger.info(
            f"Confidence calculated: {final_score:.2f} "
            f"(LLM: {llm_score:.2f}, Retrieval: {retrieval_score:.2f}, "
            f"Historical: {historical_score:.2f}, Reliability: {reliability})"
        )
        
        return ConfidenceScore(
            overall=final_score,
            breakdown={
                "llm": llm_score,
                "retrieval": retrieval_score,
                "historical": historical_score
            },
            reliability=reliability,
            explanation=explanation
        )
    
    def _normalize_llm_confidence(self, confidence: float) -> float:
        """
        Normalize LLM confidence to 0.0-1.0 range
        """
        # Ensure in range
        return max(0.0, min(1.0, confidence))
    
    def _calculate_retrieval_strength(
        self,
        similarity_score: float,
        context: Dict[str, Any]
    ) -> float:
        """
        Calculate retrieval strength from multiple factors
        """
        # Base: vector similarity
        strength = similarity_score
        
        # Boost for authoritative sources
        source_authority = context.get("source_authority", "")
        if source_authority in ["IRDAI", "UIDAI", "IT Dept", "Passport Seva", "Parivahan"]:
            strength *= 1.2
        
        # Boost for recent documents
        doc_age_days = context.get("document_age_days", 365)
        if doc_age_days < 90:
            strength *= 1.1
        elif doc_age_days > 730:  # >2 years old
            strength *= 0.9
        
        # Penalize for low document count
        doc_count = context.get("retrieved_docs", 0)
        if doc_count < 3:
            strength *= 0.8
        elif doc_count >= 5:
            strength *= 1.1
        
        # Cap at 1.0
        return min(strength, 1.0)
    
    async def _get_historical_accuracy(self, domain: str) -> float:
        """
        Get historical accuracy for this domain from user feedback
        """
        if not self.db:
            return 0.5  # Neutral when no database
        
        try:
            # Query feedback from last 30 days
            feedback = (
                self.db.query(UserFeedback)
                .filter(
                    UserFeedback.domain == domain,
                    UserFeedback.created_at > datetime.utcnow() - timedelta(days=30)
                )
                .all()
            )
            
            if not feedback:
                return 0.5  # Neutral when no data
            
            # Calculate positive ratio
            positive = sum(1 for f in feedback if f.helpful == 1)
            total = len(feedback)
            
            accuracy = positive / total
            
            logger.debug(f"Historical accuracy for {domain}: {accuracy:.2f} ({positive}/{total})")
            
            return accuracy
        
        except Exception as e:
            logger.warning(f"Failed to get historical accuracy: {e}")
            return 0.5
    
    def _apply_adjustments(self, score: float, context: Dict[str, Any]) -> float:
        """
        Apply adjustments for edge cases
        """
        # Penalize if query is very vague
        query_length = context.get("query_length", 0)
        if query_length < 10:
            score *= 0.9
        
        # Boost if user provided detailed context
        if context.get("detailed_context", False):
            score *= 1.1
        
        # Cap at 1.0
        return min(score, 1.0)
    
    def _assess_reliability(
        self,
        llm_score: float,
        retrieval_score: float,
        historical_score: float
    ) -> str:
        """
        Assess overall reliability of the confidence score
        
        High reliability: All signals agree
        Medium reliability: Moderate agreement
        Low reliability: Signals disagree
        """
        scores = [llm_score, retrieval_score, historical_score]
        
        # Calculate variance
        mean = sum(scores) / len(scores)
        variance = sum((s - mean) ** 2 for s in scores) / len(scores)
        
        if variance < 0.05:
            return "high"  # All signals agree
        elif variance < 0.15:
            return "medium"  # Moderate agreement
        else:
            return "low"  # Signals disagree
    
    def _generate_explanation(
        self,
        llm_score: float,
        retrieval_score: float,
        historical_score: float,
        reliability: str
    ) -> str:
        """
        Human-readable explanation of confidence
        """
        if llm_score > 0.8 and retrieval_score > 0.8:
            return "High confidence: Strong model certainty backed by authoritative sources"
        
        elif retrieval_score < 0.5:
            return "Limited confidence: Few authoritative sources found for this specific situation"
        
        elif historical_score < 0.5:
            return "Moderate confidence: This domain has mixed user feedback"
        
        elif reliability == "low":
            return "Moderate confidence: Signals show some disagreement"
        
        elif llm_score > 0.7:
            return "Good confidence: Based on strong model understanding"
        
        else:
            return "Moderate confidence: Based on available information"


class ConfidenceBasedResponseStrategy:
    """
    Adjust response based on confidence level
    """
    
    def apply_strategy(
        self,
        guidance: Dict[str, Any],
        confidence: ConfidenceScore
    ) -> Dict[str, Any]:
        """
        Modify guidance based on confidence
        
        Args:
            guidance: Guidance to modify
            confidence: Confidence score
        
        Returns:
            Modified guidance with appropriate caveats
        """
        # Add confidence metadata
        guidance["metadata"] = guidance.get("metadata", {})
        guidance["metadata"]["confidence"] = {
            "score": confidence.overall,
            "reliability": confidence.reliability,
            "explanation": confidence.explanation,
            "breakdown": confidence.breakdown
        }
        
        # Add caveats based on confidence
        guidance["caveats"] = guidance.get("caveats", [])
        
        if confidence.overall < 0.5:
            # Low confidence: Add strong caveats
            guidance = self._add_low_confidence_caveats(guidance)
            guidance = self._suggest_professional_help(guidance)
        
        elif confidence.overall < 0.7:
            # Medium confidence: Add moderate caveats
            guidance = self._add_medium_confidence_caveats(guidance)
        
        # Adjust suggestion urgency based on confidence
        if "suggestions" in guidance:
            guidance["suggestions"] = self._adjust_urgency(
                guidance["suggestions"],
                confidence.overall
            )
        
        return guidance
    
    def _add_low_confidence_caveats(self, guidance: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add strong caveats for low-confidence responses
        """
        caveat = (
            "⚠️ Our confidence in this guidance is limited. "
            "We found fewer authoritative sources than usual for this specific situation. "
            "Please verify this information with official sources or consult a professional."
        )
        
        guidance["caveats"].insert(0, caveat)
        return guidance
    
    def _add_medium_confidence_caveats(self, guidance: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add moderate caveats for medium-confidence responses
        """
        caveat = (
            "ℹ️ Please note: This guidance is based on general information. "
            "Your specific situation may have unique factors. "
            "Verify details with official sources when possible."
        )
        
        guidance["caveats"].append(caveat)
        return guidance
    
    def _suggest_professional_help(self, guidance: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add professional consultation suggestion
        """
        suggestion = {
            "title": "Consider professional consultation",
            "description": (
                "Given the complexity and our limited information about this specific situation, "
                "consulting a qualified professional may be beneficial."
            ),
            "urgency": "medium",
            "can_skip": True
        }
        
        if "suggestions" in guidance:
            guidance["suggestions"].append(suggestion)
        
        return guidance
    
    def _adjust_urgency(
        self,
        suggestions: list,
        confidence: float
    ) -> list:
        """
        Adjust urgency of suggestions based on confidence
        """
        if confidence < 0.5:
            # Lower urgency for low-confidence suggestions
            for suggestion in suggestions:
                if isinstance(suggestion, dict) and suggestion.get("urgency") == "high":
                    suggestion["urgency"] = "medium"
        
        return suggestions
