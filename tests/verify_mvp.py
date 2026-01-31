import sys
import os

try:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from fastapi.testclient import TestClient
    from app.main import app
    import json

    client = TestClient(app)

    def run_verification():
        print(">>> Starting Verification...")

        # 1. Seed Data
        print("\n[1] Seeding Data...")
        resp = client.post("/seed")
        # print(f"Seed Response: {resp.json()}") # Comment out to avoid encoding errors if any
        if resp.status_code != 200:
            raise Exception(f"Seed failed: {resp.text}")
        
        data = resp.json()
        user_id = data.get("user_id", 1)
        version_id = data.get("version_id", 1)

        # 2. Create Workflow
        print("\n[2] Creating Workflow...")
        payload = {
            "user_id": user_id,
            "version_id": version_id,
            "docket_number": "TX-2024-001"
        }
        resp = client.post("/workflows", json=payload)
        if resp.status_code != 200:
             raise Exception(f"Create workflow failed: {resp.text}")
             
        data = resp.json()
        instance_id = data["instance_id"]
        
        eligible = data["eligible_steps"]
        if "step_1" not in eligible:
             raise Exception(f"Step 1 not eligible: {eligible}")
        
        # 3. Explain Step
        print("\n[3] Explaining Step 1...")
        resp = client.get("/steps/explain", params={"step_name": "Obtain Death Certificate"})
        
        # 4. Submit Evidence for Step 1
        print("\n[4] Submitting Step 1...")
        ev_payload = {
            "evidence_type": "Document",
            "data": {"doc_id": "doc_123", "url": "http://s3..."}
        }
        resp = client.post(f"/workflows/{instance_id}/steps/step_1/submit", json=ev_payload)
        data = resp.json()
        
        eligible = data["next_eligible_steps"]
        if "step_2" not in eligible:
             raise Exception(f"Step 2 not eligible after submission: {eligible}")

        # 5. Check Status
        print("\n[5] Checking Final Status...")
        resp = client.get(f"/workflows/{instance_id}/status")
        status = resp.json()
        
        steps = {s["node_id"]: s["state"] for s in status["steps"]}
        if steps["step_1"] != "COMPLETED":
             raise Exception("Step 1 not COMPLETED")
        if steps["step_2"] != "ELIGIBLE":
             raise Exception("Step 2 not ELIGIBLE")

        print("\n>>> VERIFICATION SUCCESSFUL! <<<")
        with open("verify_result.txt", "w") as f:
            f.write("VERIFICATION SUCCESSFUL")

    if __name__ == "__main__":
        run_verification()

except Exception as e:
    with open("verify_result.txt", "w") as f:
        f.write(f"FAILED: {str(e)}")

