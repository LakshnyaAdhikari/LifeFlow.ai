import sys
import os
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_verification():
    print(">>> Starting Refactor Verification...")

    # 1. Seed Data
    print("\n[1] Seeding Data...")
    resp = client.post("/seed")
    if resp.status_code != 200:
        print(f"Seed info: {resp.text}") 
    
    user_id = 1
    version_id = 1
    if resp.status_code == 200 and resp.json().get("user_id"):
        user_id = resp.json().get("user_id")
        version_id = resp.json().get("version_id")

    # 2. Create Workflow
    print("\n[2] Creating Workflow...")
    docket = f"STRICT-TEST-{os.urandom(4).hex()}"
    payload = {
        "user_id": user_id,
        "version_id": version_id,
        "docket_number": docket
    }
    resp = client.post("/workflows", json=payload)
    if resp.status_code != 200:
            raise Exception(f"Create workflow failed: {resp.text}")
            
    data = resp.json()
    instance_id = data["instance_id"]
    
    eligible = data["eligible_steps"]
    if "step_1" not in eligible:
            raise Exception(f"Step 1 not eligible: {eligible}")
    
    # 3. Submit Evidence for Step 1
    print("\n[3] Submitting Step 1...")
    ev_payload = {
        "evidence_type": "Document",
        "data": {"doc_id": "doc_refactor"}
    }
    resp = client.post(f"/workflows/{instance_id}/steps/step_1/submit", json=ev_payload)
    data = resp.json()
    
    eligible = data["next_eligible_steps"]
    if "step_2" not in eligible:
            raise Exception(f"Step 2 not eligible after submission: {eligible}")

    # 4. Check Status via Repository-backed endpoint
    print("\n[4] Checking Status...")
    resp = client.get(f"/workflows/{instance_id}/status")
    status = resp.json()
    
    steps = {s["node_id"]: s["state"] for s in status["steps"]}
    if steps["step_1"] != "COMPLETED":
            raise Exception(f"Step 1 state mismatch: {steps.get('step_1')}")

    print("\n>>> REFACTOR VERIFICATION SUCCESSFUL! <<<")

if __name__ == "__main__":
    run_verification()
