"""
Domain Classification Service

ML-driven domain resolution from user queries
NO hard-coded examples or mappings
"""

from typing import List, Optional, Dict
from pydantic import BaseModel
from loguru import logger

from app.services.llm.client import get_llm_client, LLMClient


class DomainClassification(BaseModel):
    """Result of domain classification"""
    primary_domain: str
    secondary_domain: Optional[str] = None
    related_domains: List[str] = []
    confidence: float  # 0.0 to 1.0
    user_friendly_summary: str
    suggested_keywords: List[str] = []
    reasoning: Optional[str] = None  # Why this classification


# Domain Taxonomy (Dynamic, not hard-coded examples)
DOMAIN_TAXONOMY = {
    "Insurance": {
        "sub_domains": ["Motor Insurance", "Health Insurance", "Life Insurance", "Property Insurance"],
        "description": "Insurance policies, claims, disputes, and procedures",
        "keywords": ["insurance", "claim", "policy", "premium", "coverage", "insurer"]
    },
    "Identity Documents": {
        "sub_domains": ["Aadhaar", "PAN Card", "Passport", "Voter ID", "Driving License"],
        "description": "Government identity documents and verification",
        "keywords": ["aadhaar", "pan", "passport", "voter id", "identity", "verification"]
    },
    "Property": {
        "sub_domains": ["Registration", "Disputes", "Rental", "Sale/Purchase", "Mutation"],
        "description": "Property transactions, registration, and disputes",
        "keywords": ["property", "land", "house", "registration", "deed", "rental", "lease"]
    },
    "Taxation": {
        "sub_domains": ["Income Tax", "GST", "Property Tax", "TDS"],
        "description": "Tax filing, payments, and compliance",
        "keywords": ["tax", "itr", "gst", "income tax", "tds", "refund"]
    },
    "Employment": {
        "sub_domains": ["PF/ESI", "Termination", "Disputes", "Contracts"],
        "description": "Employment matters, benefits, and disputes",
        "keywords": ["employment", "job", "pf", "esi", "salary", "termination", "resignation"]
    },
    "Business Compliance": {
        "sub_domains": ["Registration", "Licenses", "GST", "ROC Compliance"],
        "description": "Business registration and regulatory compliance",
        "keywords": ["business", "company", "gst", "license", "registration", "compliance"]
    },
    "Family & Legal": {
        "sub_domains": ["Marriage", "Divorce", "Succession", "Adoption"],
        "description": "Family law matters and legal procedures",
        "keywords": ["marriage", "divorce", "will", "inheritance", "adoption", "custody"]
    },
    "Consumer Protection": {
        "sub_domains": ["Complaints", "Refunds", "Product Issues", "Service Issues"],
        "description": "Consumer rights and complaint resolution",
        "keywords": ["complaint", "refund", "defective", "consumer", "product", "service"]
    },
    "Vehicle & Transport": {
        "sub_domains": ["Registration", "License", "Transfer", "Challan"],
        "description": "Vehicle registration, licenses, and transport matters",
        "keywords": ["vehicle", "car", "bike", "license", "registration", "rc", "challan"]
    },
    "Banking & Finance": {
        "sub_domains": ["Accounts", "Loans", "Disputes", "KYC"],
        "description": "Banking services and financial matters",
        "keywords": ["bank", "loan", "account", "kyc", "credit", "debit"]
    }
}


class DomainClassifier:
    """
    ML-driven domain classifier using LLM
    """
    
    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or get_llm_client()
        self.taxonomy = DOMAIN_TAXONOMY
    
    async def classify(self, user_query: str) -> DomainClassification:
        """
        Classify user query into domain using LLM
        
        NO hard-coded examples - purely ML-driven
        """
        logger.info(f"Classifying query: {user_query[:100]}...")
        
        # Build classification prompt
        prompt = self._build_classification_prompt(user_query)
        system_prompt = self._build_system_prompt()
        
        try:
            # Get LLM classification
            response = await self.llm.generate_json(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3  # Lower temperature for more consistent classification
            )
            
            # Parse response
            classification = self._parse_classification(response, user_query)
            
            logger.info(
                f"Classification complete: {classification.primary_domain} "
                f"(confidence: {classification.confidence:.2f})"
            )
            
            return classification
        
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            # Fallback to keyword-based classification
            return await self._fallback_classify(user_query)
    
    def _build_system_prompt(self) -> str:
        """
        Build system prompt for classification
        """
        return """
You are a domain classification system for Indian legal and administrative procedures.

Your task is to analyze user queries and classify them into the most appropriate domain.

CRITICAL RULES:
1. Classify based on the ACTUAL problem described, not keywords alone
2. Consider the user's intent and situation
3. Provide confidence based on clarity of the query
4. Identify related domains that might also be relevant
5. Generate a user-friendly summary of what you understood

Be precise but acknowledge uncertainty when the query is ambiguous.
"""
    
    def _build_classification_prompt(self, user_query: str) -> str:
        """
        Build classification prompt with taxonomy
        """
        # Build taxonomy description
        taxonomy_desc = "Available domains:\n\n"
        for domain, info in self.taxonomy.items():
            taxonomy_desc += f"**{domain}**\n"
            taxonomy_desc += f"- Description: {info['description']}\n"
            taxonomy_desc += f"- Sub-domains: {', '.join(info['sub_domains'])}\n\n"
        
        prompt = f"""
{taxonomy_desc}

User Query: "{user_query}"

Analyze this query and provide classification in JSON format:

{{
    "primary_domain": "The main domain this query belongs to",
    "secondary_domain": "Specific sub-domain if applicable (optional)",
    "related_domains": ["Other domains that might be relevant"],
    "confidence": 0.85,  // Your confidence in this classification (0.0 to 1.0)
    "user_friendly_summary": "A brief, clear summary of what the user is asking about",
    "suggested_keywords": ["key", "terms", "from", "query"],
    "reasoning": "Brief explanation of why you chose this classification"
}}

IMPORTANT:
- Be honest about confidence - if the query is vague, lower the confidence
- Consider multiple domains if the situation spans them
- Focus on the user's actual problem, not just keywords
"""
        return prompt
    
    def _parse_classification(
        self,
        response: Dict,
        original_query: str
    ) -> DomainClassification:
        """
        Parse LLM response into DomainClassification
        """
        # Validate primary domain exists in taxonomy
        primary = response.get("primary_domain", "General")
        if primary not in self.taxonomy:
            logger.warning(f"LLM returned unknown domain: {primary}. Using fallback.")
            # Find closest match
            primary = self._find_closest_domain(primary)
        
        # Validate related domains
        related = response.get("related_domains", [])
        related = [d for d in related if d in self.taxonomy and d != primary]
        
        return DomainClassification(
            primary_domain=primary,
            secondary_domain=response.get("secondary_domain"),
            related_domains=related,
            confidence=min(max(response.get("confidence", 0.5), 0.0), 1.0),
            user_friendly_summary=response.get(
                "user_friendly_summary",
                f"This appears to be related to {primary}"
            ),
            suggested_keywords=response.get("suggested_keywords", []),
            reasoning=response.get("reasoning")
        )
    
    def _find_closest_domain(self, domain_name: str) -> str:
        """
        Find closest matching domain in taxonomy
        """
        # Simple keyword matching for now
        domain_lower = domain_name.lower()
        
        for domain, info in self.taxonomy.items():
            if domain.lower() in domain_lower or domain_lower in domain.lower():
                return domain
            
            # Check keywords
            for keyword in info["keywords"]:
                if keyword in domain_lower:
                    return domain
        
        return "General"
    
    async def _fallback_classify(self, user_query: str) -> DomainClassification:
        """
        Fallback keyword-based classification when LLM fails
        """
        logger.warning("Using fallback classification")
        
        query_lower = user_query.lower()
        scores = {}
        
        # Score each domain based on keyword matches
        for domain, info in self.taxonomy.items():
            score = 0
            for keyword in info["keywords"]:
                if keyword in query_lower:
                    score += 1
            scores[domain] = score
        
        # Get best match
        if scores:
            best_domain = max(scores, key=scores.get)
            confidence = min(scores[best_domain] / 3.0, 0.7)  # Cap at 0.7 for fallback
        else:
            best_domain = "General"
            confidence = 0.3
        
        return DomainClassification(
            primary_domain=best_domain,
            confidence=confidence,
            user_friendly_summary=f"This appears to be related to {best_domain}",
            suggested_keywords=[],
            reasoning="Fallback keyword-based classification"
        )


# Global classifier instance
_classifier: Optional[DomainClassifier] = None


def get_domain_classifier() -> DomainClassifier:
    """
    Get or create global domain classifier instance
    """
    global _classifier
    
    if _classifier is None:
        _classifier = DomainClassifier()
    
    return _classifier
