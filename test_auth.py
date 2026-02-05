"""
Simple Auth Test Script

Creates a test user and verifies authentication works
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_auth():
    """Test authentication flow"""
    
    print("\n" + "="*80)
    print("AUTHENTICATION TEST")
    print("="*80)
    
    # Test 1: Health check
    print("\n1. Testing backend health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("\nMake sure backend is running:")
        print("  uvicorn app.main:app --reload")
        return
    
    # Test 2: Create test user (simple signup without OTP)
    print("\n2. Creating test user...")
    
    test_user = {
        "phone": "+919876543210",
        "password": "test12345",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/signup",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User created: {data.get('user_id')}")
            print(f"   Phone: {test_user['phone']}")
            print(f"   OTP sent: {data.get('otp_sent')}")
        elif response.status_code == 400:
            print("⚠️  User already exists (this is OK)")
        else:
            print(f"❌ Signup failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Signup error: {e}")
        return
    
    # Test 3: Try login (will fail without OTP verification)
    print("\n3. Testing login (without OTP verification)...")
    
    login_data = {
        "phone": test_user["phone"],
        "password": test_user["password"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful!")
            print(f"   Access token: {data.get('access_token')[:20]}...")
            print(f"   User ID: {data.get('user_id')}")
            return data.get('access_token')
        elif response.status_code == 403:
            print("⚠️  Phone not verified (OTP required)")
            print("\nNOTE: In production, you need to verify OTP.")
            print("For testing, we'll create a simplified auth endpoint.")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Login error: {e}")
    
    print("\n" + "="*80)
    print("AUTHENTICATION ISSUE IDENTIFIED")
    print("="*80)
    print("""
The issue is that the auth system requires:
1. Phone number with +91 prefix
2. OTP verification before login

SOLUTIONS:
1. Add a simplified auth endpoint for testing (recommended)
2. Update frontend to auto-add +91 prefix
3. Mock OTP verification for development

Creating fixes now...
    """)


if __name__ == "__main__":
    test_auth()
