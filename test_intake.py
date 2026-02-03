"""
Test script for new intake endpoint

Tests the ML-driven domain classification
"""

import asyncio
from app.services.intake.domain_classifier import DomainClassifier
from app.services.safety.legal_filter import LegalBoundaryDetector, SafetyFilter


async def test_domain_classification():
    """Test domain classifier with various queries"""
    
    classifier = DomainClassifier()
    
    test_queries = [
        "my car insurance claim got rejected",
        "I need to renew my passport",
        "how to file income tax return",
        "my landlord is not returning my deposit",
        "I want to register my new company",
        "my employer terminated me without notice",
        "I lost my Aadhaar card",
    ]
    
    print("=" * 80)
    print("DOMAIN CLASSIFICATION TESTS")
    print("=" * 80)
    
    for query in test_queries:
        print(f"\nQuery: \"{query}\"")
        print("-" * 80)
        
        try:
            result = await classifier.classify(query)
            
            print(f"Primary Domain: {result.primary_domain}")
            print(f"Secondary Domain: {result.secondary_domain}")
            print(f"Related Domains: {', '.join(result.related_domains)}")
            print(f"Confidence: {result.confidence:.2f}")
            print(f"Summary: {result.user_friendly_summary}")
            print(f"Reasoning: {result.reasoning}")
        
        except Exception as e:
            print(f"ERROR: {e}")


async def test_safety_filter():
    """Test safety filter"""
    
    filter = SafetyFilter()
    
    test_responses = [
        "You should file an appeal immediately. I recommend hiring a lawyer.",
        "According to IRDAI regulations, insurance companies typically respond within 30 days. Many people start by reviewing the rejection letter.",
        "You must submit your documents within 7 days or you will lose your rights.",
    ]
    
    print("\n" + "=" * 80)
    print("SAFETY FILTER TESTS")
    print("=" * 80)
    
    for response in test_responses:
        print(f"\nOriginal: \"{response}\"")
        print("-" * 80)
        
        result = await filter.filter_response(
            text=response,
            sources=["IRDAI Regulations 2017"],
            domain="Insurance"
        )
        
        print(f"Violations Detected: {result.violations_detected}")
        print(f"Rewrites Made: {result.rewrites_made}")
        print(f"Filtered: \"{result.content[:200]}...\"")


async def test_risk_assessment():
    """Test legal boundary detector"""
    
    detector = LegalBoundaryDetector()
    
    test_queries = [
        "my car insurance claim got rejected",
        "I am being sued by my landlord",
        "how to file a police complaint for theft",
        "I need to renew my passport",
    ]
    
    print("\n" + "=" * 80)
    print("RISK ASSESSMENT TESTS")
    print("=" * 80)
    
    for query in test_queries:
        print(f"\nQuery: \"{query}\"")
        print("-" * 80)
        
        result = await detector.assess_risk(query, "General")
        
        print(f"Risk Score: {result.risk_score}")
        print(f"Safe to Proceed: {result.safe_to_proceed}")
        print(f"Recommendation: {result.recommendation}")
        if result.message:
            print(f"Message: {result.message}")


async def main():
    """Run all tests"""
    
    print("\n🧪 TESTING NEW INTAKE SYSTEM\n")
    
    # Note: These tests require OPENAI_API_KEY to be set
    # await test_domain_classification()
    
    await test_safety_filter()
    await test_risk_assessment()
    
    print("\n✅ Tests complete!\n")


if __name__ == "__main__":
    asyncio.run(main())
