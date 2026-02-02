import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_intake():
    print("Testing Intake API...")
    
    # query that should match
    payload = {"user_message": "My father passed away last week"}
    resp = requests.post(f"{BASE_URL}/intake/situational", json=payload)
    
    print(f"Response ({resp.status_code}):")
    try:
        data = resp.json()
        print(json.dumps(data, indent=2))
        
        if len(data) > 0 and "Death" in data[0]["title"]:
            print("SUCCESS: Found relevant workflow.")
        else:
            print("FAILURE: Did not find expected workflow.")
            
    except Exception as e:
        print(f"Error parsing response: {e}")

if __name__ == "__main__":
    test_intake()
