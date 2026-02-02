import requests
import json
import time
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def test_journey():
    print("1. Getting Seed Data...")
    try:
        resp = requests.post(f"{BASE_URL}/seed")
        print(f"Seed Response: {resp.status_code}")
        seed_data = resp.json()
        print(seed_data)
        
        user_id = seed_data.get("user_id")
        version_id = seed_data.get("version_id")
        
        if not user_id or not version_id:
            print("FAILURE: Could not get user/version IDs.")
            return

    except Exception as e:
        print(f"Connection failed: {e}")
        return

    # 2. Create Workflow
    docket = f"TEST-JOURNEY-{int(datetime.now().timestamp())}"
    print(f"2. Creating Instance for User {user_id}, Version {version_id}, Docket {docket}...")
    
    create_payload = {"user_id": user_id, "version_id": version_id, "docket_number": docket}
    create_resp = requests.post(
        f"{BASE_URL}/workflows",
        json=create_payload
    )
    
    if create_resp.status_code != 200:
        print(f"Create Failed: {create_resp.text}")
        return
        
    instance_id = create_resp.json()["instance_id"]
    print(f"Instance Created: {instance_id}")

    # 3. Test Journey Map
    print(f"3. Fetching Journey Map for Instance {instance_id}...")
    resp = requests.get(f"{BASE_URL}/workflows/{instance_id}/journey_map")
    
    print(f"Journey Map Status: {resp.status_code}")
    if resp.status_code != 200:
        print("Error Details saved to error.txt")
        with open("error.txt", "w") as f:
            f.write(resp.text)
        return

    data = resp.json()
    steps = data.get("steps", [])
    print(f"Journey Map Steps: {len(steps)}")
    
    if len(steps) > 0:
        first_step = steps[0]
        # Verify structure
        print(f" - ID: {first_step.get('id')}")
        print(f" - Layman: {first_step.get('layman', {}).get('title', 'MISSING')}")
        print(f" - Suggestion: {first_step.get('suggestion_level')}")
        
        if "layman" in first_step and first_step["layman"]:
             print("SUCCESS: Human-First metadata verified.")
        else:
             print("FAILURE: Validation passed but data missing?")
    else:
        print("FAILURE: No steps returned.")

if __name__ == "__main__":
    test_journey()
