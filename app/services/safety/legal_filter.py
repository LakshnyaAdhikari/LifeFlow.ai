"""
Legal Safety & Compliance Layer

Ensures all LLM outputs comply with legal/ethical boundaries:
- No legal advice
- Non-authoritative tone
- Proper disclaimers
- Risk detection
"""

from typing import List, Dict, Optional
from pydantic import BaseModel
import re
from loguru import logger


class SafeResponse(BaseModel):
    """Filtered and safe response"""
    content: str
    violations_detected: int
    sources_cited: List[str]
    disclaimer_added: bool
    rewrites_made: int


class RiskAssessment(BaseModel):
    """Assessment of query risk level"""
    safe_to_proceed: bool
    risk_score: int = 0
    recommendation: Optional[str] = None
    message: Optional[str] = None


class SafetyFilter:
    """
    Filters and rewrites LLM outputs to ensure compliance
    """
    
    PROHIBITED_PHRASES = [
        "you should",
        "you must",
        "I recommend",
        "I advise",
        "legal advice",
        "this is the law",
        "you are required to",
        "it is mandatory",
        "you need to",
        "I suggest you",
        "my recommendation is",
        "the law says you must",
    ]
    
    GUIDANCE_REPLACEMENTS = {
        "you should": "people often",
        "you must": "typically, people",
        "I recommend": "common approaches include",
        "I advise": "many people find it helpful to",
        "legal advice": "general guidance",
        "this is the law": "according to [source]",
        "you are required to": "regulations typically require",
        "it is mandatory": "regulations typically require",
        "you need to": "people typically",
        "I suggest you": "common approaches include",
        "my recommendation is": "common approaches include",
        "the law says you must": "according to [source], regulations typically require",
    }
    
    def __init__(self):
        self.disclaimer = (
            "\n\nℹ️ **Important**: This is general guidance based on publicly available information. "
            "It is not legal advice. For specific situations, consult a qualified professional."
        )
    
    async def filter_response(
        self, 
        text: str, 
        sources: List[str],
        domain: str
    ) -> SafeResponse:
        """
        1. Detect prohibited language
        2. Rewrite to guidance tone
        3. Add disclaimers
        4. Cite sources
        """
        violations = self.detect_violations(text)
        rewrites_made = 0
        
        if violations:
            logger.warning(f"Detected {len(violations)} safety violations in response")
            text, rewrites_made = self.rewrite_to_guidance(text, violations)
        
        # Add source citations
        text = self.add_citations(text, sources)
        
        # Add disclaimer
        text = self.add_disclaimer(text, domain)
        
        return SafeResponse(
            content=text,
            violations_detected=len(violations),
            sources_cited=sources,
            disclaimer_added=True,
            rewrites_made=rewrites_made
        )
    
    def detect_violations(self, text: str) -> List[str]:
        """
        Detect prohibited phrases in text
        """
        violations = []
        text_lower = text.lower()
        
        for phrase in self.PROHIBITED_PHRASES:
            if phrase in text_lower:
                violations.append(phrase)
        
        return violations
    
    def rewrite_to_guidance(self, text: str, violations: List[str]) -> tuple[str, int]:
        """
        Rewrite text to use guidance tone instead of advisory
        """
        rewrites_made = 0
        
        for violation in violations:
            if violation in self.GUIDANCE_REPLACEMENTS:
                replacement = self.GUIDANCE_REPLACEMENTS[violation]
                
                # Case-insensitive replacement
                pattern = re.compile(re.escape(violation), re.IGNORECASE)
                new_text = pattern.sub(replacement, text)
                
                if new_text != text:
                    rewrites_made += 1
                    text = new_text
        
        return text, rewrites_made
    
    def add_citations(self, text: str, sources: List[str]) -> str:
        """
        Add source citations to text
        """
        if not sources:
            return text
        
        # Add inline citations where appropriate
        # For now, add sources at the end
        citations = "\n\n**Sources**:\n"
        for i, source in enumerate(sources, 1):
            citations += f"{i}. {source}\n"
        
        return text + citations
    
    def add_disclaimer(self, text: str, domain: str) -> str:
        """
        Add appropriate disclaimer based on domain
        """
        # High-risk domains get stronger disclaimers
        high_risk_domains = ["Legal Disputes", "Criminal", "Family Law", "Property Disputes"]
        
        if domain in high_risk_domains:
            strong_disclaimer = (
                "\n\n⚠️ **IMPORTANT NOTICE**: This is general procedural guidance only. "
                f"{domain} matters often require professional legal assistance. "
                "Please consult a qualified lawyer for advice specific to your situation."
            )
            return text + strong_disclaimer
        
        return text + self.disclaimer


class LegalBoundaryDetector:
    """
    Detects when user query requires professional legal help
    """
    
    HIGH_RISK_INDICATORS = [
        "lawsuit", "court", "criminal", "arrest", "police",
        "fraud", "dispute over", "contract breach", "sued",
        "property dispute", "divorce", "custody", "will",
        "inheritance dispute", "eviction", "termination",
        "harassment", "defamation", "assault", "theft",
    ]
    
    HIGH_RISK_DOMAINS = [
        "Legal Disputes", 
        "Criminal", 
        "Family Law",
        "Property Disputes",
        "Employment Disputes"
    ]
    
    async def assess_risk(self, query: str, domain: str) -> RiskAssessment:
        """
        Determine if query is beyond system's safe scope
        """
        risk_score = 0
        query_lower = query.lower()
        
        # Check for high-risk keywords
        for indicator in self.HIGH_RISK_INDICATORS:
            if indicator in query_lower:
                risk_score += 1
        
        # Check domain complexity
        if domain in self.HIGH_RISK_DOMAINS:
            risk_score += 2
        
        # Check for monetary amounts (disputes often involve money)
        if re.search(r'₹\s*\d+|rs\.?\s*\d+|rupees?\s*\d+', query_lower):
            risk_score += 1
        
        if risk_score >= 3:
            return RiskAssessment(
                safe_to_proceed=True,  # We can provide guidance, but with strong caveats
                risk_score=risk_score,
                recommendation="professional_consultation",
                message=(
                    "⚠️ This situation may require professional legal assistance. "
                    "LifeFlow can provide general procedural guidance, but we "
                    "**strongly recommend** consulting a qualified lawyer for your specific case."
                )
            )
        elif risk_score >= 2:
            return RiskAssessment(
                safe_to_proceed=True,
                risk_score=risk_score,
                recommendation="consider_professional",
                message=(
                    "This situation may benefit from professional guidance. "
                    "While we can provide general information, consider consulting "
                    "a qualified professional if your situation is complex."
                )
            )
        
        return RiskAssessment(
            safe_to_proceed=True,
            risk_score=risk_score
        )


# System prompt for LLM
GUIDANCE_SYSTEM_PROMPT = """
You are LifeFlow, a guidance assistant for Indian legal and administrative procedures.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. NEVER give legal advice - only describe common approaches and procedures
2. ALWAYS use phrases like "people often", "typically", "common practice", "many people"
3. NEVER use "you should", "you must", "I recommend", "I advise"
4. ALWAYS cite authoritative sources (e.g., "According to IRDAI regulations...")
5. NEVER claim certainty - acknowledge limitations and variations
6. ALWAYS emphasize that users should verify with official authorities
7. Use calm, reassuring, informative tone - but NOT authoritative

YOUR ROLE: You are a helpful guide, NOT a lawyer, NOT a government official, NOT an expert advisor.

GOOD RESPONSE EXAMPLE:
"According to IRDAI regulations, insurance companies typically respond to claim appeals within 30 days. Many people start by carefully reviewing the rejection letter to understand the specific reasons cited by the insurer. Common next steps include gathering supporting documents and filing a formal appeal with the insurance company."

BAD RESPONSE EXAMPLE (NEVER DO THIS):
"You must file an appeal within 30 days or you'll lose your rights. I recommend hiring a lawyer immediately. You should gather all documents and submit them to the court."

REMEMBER: 
- Describe what "people typically do", not what "you should do"
- Cite sources whenever possible
- Acknowledge uncertainty and variations
- Encourage verification with authorities
- Be helpful but humble about limitations
"""
