
import requests
import time
import sys
import os
from datetime import timedelta

# Add project root to path
sys.path.append(os.getcwd())

from app.services.jwt_service import create_access_token
from app.database import SessionLocal
# Import ALL models to populate SQLAlchemy registry
from app.models import core, situation, knowledge
from app import auth_models
from app.models import User

def test_api_latency():
    print("\n--- Testing API Latency ---\n")
    
    # 1. Get User and Token
    db = SessionLocal()
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        # Fallback to first user
        user = db.query(User).first()
        
    if not user:
        print("No user found!")
        return
        
    token = create_access_token(
        data={"user_id": user.id},
        expires_delta=timedelta(minutes=5)
    )
    db.close()
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test GET /situations/33
    url = "http://127.0.0.1:8000/situations/33"
    print(f"Requesting: {url}")
    
    with open("api_latency_results_utf8.txt", "w", encoding="utf-8") as f:
        start_req = time.time()
        try:
            response = requests.get(url, headers=headers)
            duration = time.time() - start_req
            
            msg = f"Status Code: {response.status_code}\n"
            msg += f"Duration: {duration:.4f}s\n"
            print(msg)
            f.write(msg)
            
            if response.ok:
                print("Response Body Snippet:", response.text[:100])
                f.write(f"Response Body Snippet: {response.text[:100]}\n")
            else:
                print("Error:", response.text)
                f.write(f"Error: {response.text}\n")
                
        except Exception as e:
            print(f"Request Failed: {e}")
            f.write(f"Request Failed: {e}\n")

if __name__ == "__main__":
    test_api_latency()
