
import asyncio
import httpx
import json
import os
from colorama import init, Fore, Style

# Initialize colorama
init(autoreset=True)

API_URL = "http://127.0.0.1:8000"
USERNAME = "testuser@example.com"  # Ensure this user exists or use a valid one
PASSWORD = "password123"

async def test_clarification_flow():
    print(f"{Fore.CYAN}[INFO] Starting Clarification Flow Test...{Style.RESET_ALL}")
    
    async with httpx.AsyncClient() as client:
        # 1. Login (using simple login for test)
        print(f"\n{Fore.YELLOW}1. Authenticating...{Style.RESET_ALL}")
        
        # Test User Creds
        PHONE = "+919999999999"
        PASSWORD = "password123"
        
        try:
            # Try login first
            response = await client.post(
                f"{API_URL}/auth/login-simple",
                json={"phone": PHONE, "password": PASSWORD, "skip_otp": True},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                # Try signup if login fails
                print(f"{Fore.RED}Login failed ({response.status_code}). Attempting signup...{Style.RESET_ALL}")
                reg_response = await client.post(
                    f"{API_URL}/auth/signup",
                    json={"phone": PHONE, "password": PASSWORD, "full_name": "Test User"}
                )
                
                if reg_response.status_code == 200:
                    print(f"{Fore.GREEN}Signed up. Verification skipped via simple login...{Style.RESET_ALL}")
                    # Login again
                    response = await client.post(
                        f"{API_URL}/auth/login-simple",
                        json={"phone": PHONE, "password": PASSWORD, "skip_otp": True}
                    )
                else:
                    # If signup fails (maybe already exists but password wrong?), just try to proceed or fail
                    print(f"{Fore.RED}Signup failed: {reg_response.text}{Style.RESET_ALL}")
                    # If already exists, maybe the password was wrong in first login attempt? 
                    # We can't easily reset it via API without OTP. 
                    # But for now assuming clean state or known password.
                    # If 400 "Phone number already registered", we assume previous login failed due to password.
            
            if response.status_code == 200:
                token = response.json()["access_token"]
                headers = {"Authorization": f"Bearer {token}"}
                print(f"{Fore.GREEN}[OK] Authenticated.{Style.RESET_ALL}")
            else:
                 print(f"{Fore.RED}[FAIL] Auth Failed: {response.text}{Style.RESET_ALL}")
                 return

        except Exception as e:
            print(f"{Fore.RED}Auth Error: {e}{Style.RESET_ALL}")
            return

        # 2. Intake Resolution
        query = "My health insurance claim was rejected due to pre-existing condition"
        print(f"\n{Fore.YELLOW}2. Testing Intake Resolution (Generation Step)...{Style.RESET_ALL}")
        print(f"Query: {query}")
        
        start_time = asyncio.get_event_loop().time()
        response = await client.post(
            f"{API_URL}/intake/resolve",
            json={"user_message": query},
            headers=headers,
            timeout=30.0
        )
        latency = asyncio.get_event_loop().time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            situation_id = data.get("situation_id")
            questions = data.get("clarifying_questions", [])
            print(f"{Fore.GREEN}[OK] Intake Resolved in {latency:.2f}s{Style.RESET_ALL}")
            print(f"Situation ID: {situation_id}")
            print(f"Domain: {data.get('primary_domain')}")
            print(f"Questions Generated: {len(questions)}")
            for q in questions:
                print(f"  - [{q.get('type')}] {q.get('text')}")
                if 'options' in q and q.get('options'):
                    print(f"    Options: {q.get('options')}")
        else:
            print(f"{Fore.RED}[FAIL] Intake Failed: {response.text}{Style.RESET_ALL}")
            return

        # 3. Submit Answers & Generate Guidance
        print(f"\n{Fore.YELLOW}3. Testing Guidance Generation (RAG Step)...{Style.RESET_ALL}")
        
        # Construct answers
        answers = []
        if questions:
            # Mock answering first question
            q1 = questions[0]
            ans_val = q1['options'][0] if q1.get('options') else "Test Answer"
            answers.append({
                "question_id": q1['id'],
                "question_text": q1['text'],
                "answer": ans_val
            })
            print(f"Submitting Answer: {ans_val} for Q: {q1['text']}")
            
        start_time = asyncio.get_event_loop().time()
        # Ensure situation_id is passed
        if not situation_id:
             print(f"{Fore.RED}[FAIL] No situation_id to continue.{Style.RESET_ALL}")
             return

        payload = {
            "query": query,
            "domain": data['primary_domain'],
            "situation_id": situation_id,
            "clarification_answers": answers
        }
        
        response = await client.post(
            f"{API_URL}/guidance/suggestions",
            json=payload,
            headers=headers,
            timeout=120.0 # High timeout for RAG
        )
        latency = asyncio.get_event_loop().time() - start_time
        
        if response.status_code == 200:
            guidance = response.json()
            print(f"{Fore.GREEN}[OK] Guidance Generated in {latency:.2f}s{Style.RESET_ALL}")
            print(f"Confidence: {guidance.get('confidence', {}).get('score')}")
            print(f"Suggestions: {len(guidance.get('suggestions', []))}")
        else:
            print(f"{Fore.RED}[FAIL] Guidance Generation Failed: {response.text}{Style.RESET_ALL}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(test_clarification_flow())
