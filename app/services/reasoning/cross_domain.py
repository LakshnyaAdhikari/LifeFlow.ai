"""
Cross-Domain Reasoning Engine

Aggregates guidance across related domains
Presents unified, human-centric guidance
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from loguru import logger


class DomainRelationship(BaseModel):
    """Relationship between domains"""
    often_requires: List[str] = []
    may_involve: List[str] = []
    common_sequences: List[List[str]] = []


class Overlap(BaseModel):
    """Overlapping suggestion across domains"""
    suggestion: Dict[str, Any]
    domains: List[str]
    priority: str = "high"


class Conflict(BaseModel):
    """Conflicting suggestions across domains"""
    suggestion1: Dict[str, Any]
    suggestion2: Dict[str, Any]
    domains: List[str]
    resolution: Optional[str] = None


class UnifiedGuidance(BaseModel):
    """Unified guidance across multiple domains"""
    suggestions: List[Dict[str, Any]]
    domains_covered: List[str]
    overlaps_detected: int
    conflicts_resolved: int
    cross_domain_insights: List[str] = []


class DomainRelationshipGraph:
    """
    Defines relationships between domains
    
    This is data-driven, not hard-coded logic
    """
    
    RELATIONSHIPS: Dict[str, DomainRelationship] = {
        "Insurance": DomainRelationship(
            often_requires=["Consumer Protection"],
            may_involve=["Legal Disputes", "Taxation"],
            common_sequences=[
                ["Motor Insurance", "Consumer Protection", "Legal Disputes"]
            ]
        ),
        "Property": DomainRelationship(
            often_requires=["Taxation", "Legal Documentation"],
            may_involve=["Family Law", "Banking"],
            common_sequences=[
                ["Property Registration", "Taxation", "Legal Documentation"]
            ]
        ),
        "Employment": DomainRelationship(
            often_requires=["Labour Law", "PF/ESI"],
            may_involve=["Legal Disputes", "Taxation"],
            common_sequences=[
                ["Employment Dispute", "Labour Law", "Legal Disputes"]
            ]
        ),
        "Business Compliance": DomainRelationship(
            often_requires=["Taxation", "Legal Documentation"],
            may_involve=["Banking", "Property"],
            common_sequences=[
                ["Business Registration", "Taxation", "GST Compliance"]
            ]
        ),
        "Family & Legal": DomainRelationship(
            often_requires=["Legal Documentation", "Property"],
            may_involve=["Taxation", "Banking"],
            common_sequences=[
                ["Marriage", "Property", "Taxation"],
                ["Succession", "Property", "Taxation"]
            ]
        ),
        "Vehicle & Transport": DomainRelationship(
            often_requires=["Insurance", "Taxation"],
            may_involve=["Consumer Protection"],
            common_sequences=[
                ["Vehicle Registration", "Insurance", "Taxation"]
            ]
        ),
    }
    
    def get_related_domains(self, primary_domain: str) -> List[str]:
        """
        Get all potentially relevant domains
        """
        if primary_domain not in self.RELATIONSHIPS:
            return []
        
        related = []
        rel = self.RELATIONSHIPS[primary_domain]
        
        related.extend(rel.often_requires)
        related.extend(rel.may_involve)
        
        return list(set(related))
    
    def predict_next_domains(
        self,
        current_domain: str,
        context: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Predict which domains user might need next
        """
        if current_domain not in self.RELATIONSHIPS:
            return []
        
        sequences = self.RELATIONSHIPS[current_domain].common_sequences
        predictions = []
        
        for sequence in sequences:
            if current_domain in sequence:
                idx = sequence.index(current_domain)
                if idx < len(sequence) - 1:
                    predictions.append(sequence[idx + 1])
        
        return list(set(predictions))
    
    def get_common_sequence(self, domain: str) -> Optional[List[str]]:
        """
        Get most common sequence for a domain
        """
        if domain not in self.RELATIONSHIPS:
            return None
        
        sequences = self.RELATIONSHIPS[domain].common_sequences
        return sequences[0] if sequences else None


class CrossDomainGuidanceAggregator:
    """
    Combines guidance from multiple related domains
    """
    
    def __init__(self):
        self.domain_graph = DomainRelationshipGraph()
    
    async def aggregate_guidance(
        self,
        primary_domain: str,
        related_domains: List[str],
        domain_guidance: Dict[str, Any]
    ) -> UnifiedGuidance:
        """
        Generate unified guidance across all relevant domains
        
        Args:
            primary_domain: Main domain
            related_domains: Related domains
            domain_guidance: {domain: guidance} mapping
        """
        logger.info(f"Aggregating guidance across {len(domain_guidance)} domains")
        
        # 1. Detect overlaps and conflicts
        overlaps = self._detect_overlaps(domain_guidance)
        conflicts = self._detect_conflicts(domain_guidance)
        
        # 2. Merge and prioritize
        unified = self._merge_guidance(domain_guidance, overlaps, conflicts)
        
        # 3. Add cross-domain insights
        all_domains = [primary_domain] + related_domains
        unified = self._add_cross_domain_insights(unified, all_domains)
        
        logger.info(
            f"Aggregation complete: {len(unified.suggestions)} suggestions, "
            f"{unified.overlaps_detected} overlaps, {unified.conflicts_resolved} conflicts"
        )
        
        return unified
    
    def _detect_overlaps(self, domain_guidance: Dict[str, Any]) -> List[Overlap]:
        """
        Find suggestions that appear across multiple domains
        """
        overlaps = []
        
        # Compare suggestions across domains
        domains_list = list(domain_guidance.keys())
        for i, domain1 in enumerate(domains_list):
            for domain2 in domains_list[i+1:]:
                guidance1 = domain_guidance[domain1]
                guidance2 = domain_guidance[domain2]
                
                # Get suggestions (handle different formats)
                suggestions1 = self._extract_suggestions(guidance1)
                suggestions2 = self._extract_suggestions(guidance2)
                
                # Find similar suggestions
                for s1 in suggestions1:
                    for s2 in suggestions2:
                        if self._are_similar(s1, s2):
                            overlaps.append(Overlap(
                                suggestion=s1,
                                domains=[domain1, domain2],
                                priority="high"  # Cross-domain = important
                            ))
        
        return overlaps
    
    def _detect_conflicts(self, domain_guidance: Dict[str, Any]) -> List[Conflict]:
        """
        Find conflicting suggestions across domains
        """
        # For now, return empty - conflicts are rare
        # Can be enhanced to detect contradictory advice
        return []
    
    def _merge_guidance(
        self,
        domain_guidance: Dict[str, Any],
        overlaps: List[Overlap],
        conflicts: List[Conflict]
    ) -> UnifiedGuidance:
        """
        Merge guidance into single, coherent set
        """
        merged_suggestions = []
        seen_titles = set()
        
        # 1. Add high-priority overlaps first
        for overlap in overlaps:
            title = overlap.suggestion.get("title", "")
            if title and title not in seen_titles:
                merged_suggestions.append({
                    **overlap.suggestion,
                    "cross_domain": True,
                    "relevant_to": overlap.domains,
                    "priority": "high"
                })
                seen_titles.add(title)
        
        # 2. Add domain-specific suggestions
        for domain, guidance in domain_guidance.items():
            suggestions = self._extract_suggestions(guidance)
            
            for suggestion in suggestions:
                title = suggestion.get("title", "")
                
                # Skip if already in overlaps
                if title in seen_titles:
                    continue
                
                merged_suggestions.append({
                    **suggestion,
                    "domain": domain,
                    "cross_domain": False
                })
                seen_titles.add(title)
        
        # 3. Resolve conflicts (if any)
        if conflicts:
            merged_suggestions = self._resolve_conflicts(merged_suggestions, conflicts)
        
        return UnifiedGuidance(
            suggestions=merged_suggestions,
            domains_covered=list(domain_guidance.keys()),
            overlaps_detected=len(overlaps),
            conflicts_resolved=len(conflicts)
        )
    
    def _add_cross_domain_insights(
        self,
        unified: UnifiedGuidance,
        domains: List[str]
    ) -> UnifiedGuidance:
        """
        Add insights about domain interactions
        """
        insights = []
        
        # Insurance + Consumer Protection
        if "Insurance" in domains and "Consumer Protection" in domains:
            insights.append(
                "💡 Insurance claims often involve consumer protection rights. "
                "If your claim is rejected, you can escalate to the Insurance Ombudsman."
            )
        
        # Property + Taxation
        if "Property" in domains and "Taxation" in domains:
            insights.append(
                "💡 Property transactions have tax implications. "
                "Capital gains tax may apply depending on holding period and property type."
            )
        
        # Employment + PF/ESI
        if "Employment" in domains:
            insights.append(
                "💡 Employment matters often involve PF/ESI benefits. "
                "Make sure to check your entitlements and claim procedures."
            )
        
        # Business + Taxation
        if "Business Compliance" in domains and "Taxation" in domains:
            insights.append(
                "💡 Business registration and tax compliance go hand-in-hand. "
                "Ensure GST registration if your turnover exceeds the threshold."
            )
        
        # Vehicle + Insurance
        if "Vehicle & Transport" in domains and "Insurance" in domains:
            insights.append(
                "💡 Vehicle registration requires valid insurance. "
                "Keep your insurance policy updated to avoid penalties."
            )
        
        unified.cross_domain_insights = insights
        return unified
    
    def _extract_suggestions(self, guidance: Any) -> List[Dict[str, Any]]:
        """
        Extract suggestions from guidance (handle different formats)
        """
        if isinstance(guidance, dict):
            if "suggestions" in guidance:
                return guidance["suggestions"]
            elif "steps" in guidance:
                return guidance["steps"]
        elif isinstance(guidance, list):
            return guidance
        
        return []
    
    def _are_similar(self, s1: Dict[str, Any], s2: Dict[str, Any]) -> bool:
        """
        Check if two suggestions are similar
        """
        # Simple similarity check based on title
        title1 = s1.get("title", "").lower()
        title2 = s2.get("title", "").lower()
        
        if not title1 or not title2:
            return False
        
        # Exact match
        if title1 == title2:
            return True
        
        # Substring match (one contains the other)
        if title1 in title2 or title2 in title1:
            return True
        
        # Word overlap (>50% common words)
        words1 = set(title1.split())
        words2 = set(title2.split())
        
        if len(words1) == 0 or len(words2) == 0:
            return False
        
        overlap = len(words1 & words2)
        min_words = min(len(words1), len(words2))
        
        return overlap / min_words > 0.5
    
    def _resolve_conflicts(
        self,
        suggestions: List[Dict[str, Any]],
        conflicts: List[Conflict]
    ) -> List[Dict[str, Any]]:
        """
        Resolve conflicting suggestions
        """
        # For now, just return as-is
        # Can be enhanced to merge or choose between conflicts
        return suggestions
