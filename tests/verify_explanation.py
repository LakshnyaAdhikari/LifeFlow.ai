import sys
import os
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def verify_explanation():
    print(">>> Starting Explanation (RAG) Verification...")

    step_name = "Obtain Death Certificate"
    jurisdiction = "California"
    
    print(f"\n[1] Requesting explanation for '{step_name}' in '{jurisdiction}'...")
    
    # Call the endpoint
    resp = client.get(f"/steps/explain", params={"step_name": step_name, "jurisdiction": jurisdiction})
    
    if resp.status_code != 200:
        raise Exception(f"Failed to get explanation: {resp.status_code} - {resp.text}")
        
    data = resp.json()
    print(f"Response Received:\n{json.dumps(data, indent=2)}")
    
    # Validate Structure
    if "explanation" not in data:
        raise Exception("Response missing 'explanation' field")
    
    if "citations" not in data:
        raise Exception("Response missing 'citations' field")
        
    # Check if logic worked (Mock or FAISS should return something)
    # Since we are running the full app, it uses FAISSRAGAdapter.
    # If FAISS is empty (default), it might say "No specific legal documents found".
    # This is acceptable as long as the pipeline runs without crashing.
    
    print("\n>>> EXPLANATION VERIFICATION SUCCESSFUL! <<<")

if __name__ == "__main__":
    verify_explanation()
