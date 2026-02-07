
import asyncio
import time
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
# Import ALL models
from app.models import core, situation, knowledge
from app import auth_models

from app.services.intake.domain_classifier import get_domain_classifier
from app.services.safety.legal_filter import LegalBoundaryDetector

async def test_intake_latency():
    print("\n--- Testing Intake Resolution Latency ---\n")
    
    try:
        query = "How do I update my Aadhaar address online?"
        print(f"Query: {query}")
        
        # 1. Warmup / Init
        print("Initializing Classifier...")
        start_init = time.time()
        classifier = get_domain_classifier()
        # Trigger client init
        _ = classifier.llm
        print(f"Init took: {time.time() - start_init:.4f}s")
        
        # 2. Classify
        print("Running Classification...")
        start_classify = time.time()
        classification = await classifier.classify(query)
        duration_classify = time.time() - start_classify
        print(f"Classification took: {duration_classify:.4f}s")
        print(f"Result: {classification.primary_domain} ({classification.confidence})")
        
        # 3. Legal Check
        print("Running Legal Check...")
        start_legal = time.time()
        detector = LegalBoundaryDetector()
        risk = await detector.assess_risk(query, classification.primary_domain)
        duration_legal = time.time() - start_legal
        print(f"Legal Check took: {duration_legal:.4f}s")
        print(f"Risk: {risk.risk_score}")
        
        # Total
        print(f"\nTotal Logic Duration: {duration_classify + duration_legal:.4f}s")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_intake_latency())
