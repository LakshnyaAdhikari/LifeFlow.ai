import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_seed_and_verify():
    # Wait a sec for potential reload
    time.sleep(2)
    
    print("1. Calling /seed...")
    try:
        resp = requests.post(f"{BASE_URL}/seed")
    except requests.exceptions.ConnectionError:
        print("Connection failed. Server might be restarting.")
        return

    print(f"Seed Response: {resp.status_code}")
    try:
        seed_data = resp.json()
        print(f"Seed Data: {seed_data}")
    except:
        print("Could not parse JSON")
        return

    if "version_id" not in seed_data:
        print("Seed verified (or already done).")
        # Proceed assuming it exists, but we need IDs. 
        # If 'Already seeded', we have a problem getting IDs for the test.
        # But we deleted the DB, so it should be fresh.
        if "Already seeded" in seed_data.get("message", ""):
            print("DB was not cleared? Exiting.")
            return

    user_id = seed_data["user_id"]
    version_id = seed_data["version_id"]
    
    print(f"2. Creating Instance for User {user_id}, Version {version_id}...")
    create_payload = {"user_id": user_id, "version_id": version_id, "docket_number": "TEST-HUMAN-FIRST-001"}
    create_resp = requests.post(
        f"{BASE_URL}/workflows",
        json=create_payload
    )
    print(f"Create Response: {create_resp.status_code}")
    
    if create_resp.status_code == 200:
        instance_data = create_resp.json()
        print(f"Instance Data: {instance_data}")
        
        # Verify the eligible steps are returned and contain what we expect
        eligible = instance_data.get("eligible_steps", [])
        print(f"Eligible Steps: {eligible}")
        
        # Since we have "step_1" as a root node (no dependencies), it should be eligible.
        if "step_1" in eligible:
            print("SUCCESS: Graph traversal works with new schema.")
        else:
            print("FAILURE: 'step_1' not found in eligible steps.")
            
        # Optional: Inspect the raw graph from the DB (requires new endpoint or direct DB access, skipping for now)

if __name__ == "__main__":
    test_seed_and_verify()
