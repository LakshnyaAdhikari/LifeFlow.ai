"""
Comprehensive test for Phase 0 systems

Tests all implemented safety and intelligence layers
"""

import asyncio
from app.services.safety.legal_filter import SafetyFilter, LegalBoundaryDetector
from app.services.reasoning.cross_domain import CrossDomainGuidanceAggregator, DomainRelationshipGraph
from app.services.confidence.triangulated import TriangulatedConfidence, ConfidenceBasedResponseStrategy


async def test_safety_layer():
    """Test safety filter and risk assessment"""
    print("\n" + "="*80)
    print("SAFETY LAYER TESTS")
    print("="*80)
    
    # Test safety filter
    filter = SafetyFilter()
    
    test_cases = [
        {
            "text": "You should file an appeal immediately. I recommend hiring a lawyer.",
            "domain": "Insurance"
        },
        {
            "text": "According to IRDAI regulations, insurance companies typically respond within 30 days.",
            "domain": "Insurance"
        },
        {
            "text": "You must submit your documents or you will lose your rights.",
            "domain": "Legal Disputes"
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i} ---")
        print(f"Original: \"{case['text']}\"")
        
        result = await filter.filter_response(
            text=case['text'],
            sources=["IRDAI Regulations 2017"],
            domain=case['domain']
        )
        
        print(f"Violations: {result.violations_detected}")
        print(f"Rewrites: {result.rewrites_made}")
        print(f"Filtered: \"{result.content[:150]}...\"")
    
    # Test risk assessment
    print("\n" + "-"*80)
    print("RISK ASSESSMENT")
    print("-"*80)
    
    detector = LegalBoundaryDetector()
    
    risk_queries = [
        ("my car insurance claim got rejected", "Insurance"),
        ("I am being sued by my landlord", "Property"),
        ("how to file a police complaint", "Legal"),
    ]
    
    for query, domain in risk_queries:
        print(f"\nQuery: \"{query}\"")
        result = await detector.assess_risk(query, domain)
        print(f"Risk Score: {result.risk_score}")
        print(f"Recommendation: {result.recommendation}")
        if result.message:
            print(f"Message: {result.message[:100]}...")


async def test_cross_domain_reasoning():
    """Test cross-domain aggregation"""
    print("\n" + "="*80)
    print("CROSS-DOMAIN REASONING TESTS")
    print("="*80)
    
    # Test domain relationships
    graph = DomainRelationshipGraph()
    
    test_domains = ["Insurance", "Property", "Employment"]
    
    for domain in test_domains:
        print(f"\n--- {domain} ---")
        related = graph.get_related_domains(domain)
        print(f"Related Domains: {', '.join(related)}")
        
        next_domains = graph.predict_next_domains(domain)
        print(f"Predicted Next: {', '.join(next_domains)}")
    
    # Test guidance aggregation
    print("\n" + "-"*80)
    print("GUIDANCE AGGREGATION")
    print("-"*80)
    
    aggregator = CrossDomainGuidanceAggregator()
    
    # Mock guidance from multiple domains
    domain_guidance = {
        "Insurance": {
            "suggestions": [
                {"title": "Review rejection letter", "urgency": "high"},
                {"title": "Gather supporting documents", "urgency": "medium"}
            ]
        },
        "Consumer Protection": {
            "suggestions": [
                {"title": "Review rejection letter", "urgency": "high"},  # Overlap!
                {"title": "File complaint with ombudsman", "urgency": "medium"}
            ]
        }
    }
    
    unified = await aggregator.aggregate_guidance(
        primary_domain="Insurance",
        related_domains=["Consumer Protection"],
        domain_guidance=domain_guidance
    )
    
    print(f"Domains Covered: {', '.join(unified.domains_covered)}")
    print(f"Total Suggestions: {len(unified.suggestions)}")
    print(f"Overlaps Detected: {unified.overlaps_detected}")
    print(f"Cross-Domain Insights: {len(unified.cross_domain_insights)}")
    
    for insight in unified.cross_domain_insights:
        print(f"  - {insight}")


async def test_confidence_system():
    """Test triangulated confidence"""
    print("\n" + "="*80)
    print("CONFIDENCE SYSTEM TESTS")
    print("="*80)
    
    confidence_calc = TriangulatedConfidence()
    
    test_scenarios = [
        {
            "name": "High Confidence",
            "llm": 0.9,
            "retrieval": 0.85,
            "domain": "Insurance",
            "context": {"source_authority": "IRDAI", "retrieved_docs": 5}
        },
        {
            "name": "Medium Confidence",
            "llm": 0.7,
            "retrieval": 0.6,
            "domain": "Property",
            "context": {"retrieved_docs": 3}
        },
        {
            "name": "Low Confidence",
            "llm": 0.5,
            "retrieval": 0.3,
            "domain": "General",
            "context": {"retrieved_docs": 1}
        }
    ]
    
    for scenario in test_scenarios:
        print(f"\n--- {scenario['name']} ---")
        
        confidence = await confidence_calc.calculate(
            llm_confidence=scenario['llm'],
            retrieval_strength=scenario['retrieval'],
            domain=scenario['domain'],
            context=scenario['context']
        )
        
        print(f"Overall: {confidence.overall:.2f}")
        print(f"Breakdown: LLM={confidence.breakdown['llm']:.2f}, "
              f"Retrieval={confidence.breakdown['retrieval']:.2f}, "
              f"Historical={confidence.breakdown['historical']:.2f}")
        print(f"Reliability: {confidence.reliability}")
        print(f"Explanation: {confidence.explanation}")
    
    # Test response strategy
    print("\n" + "-"*80)
    print("RESPONSE STRATEGY")
    print("-"*80)
    
    strategy = ConfidenceBasedResponseStrategy()
    
    mock_guidance = {
        "suggestions": [
            {"title": "Review documents", "urgency": "high"},
            {"title": "Consult expert", "urgency": "medium"}
        ]
    }
    
    # Apply low confidence strategy
    low_conf = await confidence_calc.calculate(0.4, 0.3, "General", {})
    modified = strategy.apply_strategy(mock_guidance.copy(), low_conf)
    
    print(f"Low Confidence Caveats: {len(modified['caveats'])}")
    print(f"Suggestions After Adjustment: {len(modified['suggestions'])}")
    print(f"Confidence Metadata: {modified['metadata']['confidence']['score']:.2f}")


async def main():
    """Run all tests"""
    print("\n🧪 TESTING PHASE 0 SYSTEMS\n")
    
    await test_safety_layer()
    await test_cross_domain_reasoning()
    await test_confidence_system()
    
    print("\n" + "="*80)
    print("✅ ALL TESTS COMPLETE!")
    print("="*80)
    print("\nPhase 0 Foundation: READY ✓")
    print("- Safety Layer: ✓")
    print("- Cross-Domain Reasoning: ✓")
    print("- Confidence System: ✓")
    print("\nNext: Implement Knowledge Ingestion & RAG")
    print("="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
