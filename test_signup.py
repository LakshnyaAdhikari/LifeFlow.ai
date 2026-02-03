import requests
import json

try:
    response = requests.post(
        'http://127.0.0.1:8000/auth/signup',
        json={
            'phone': '+919876543210',
            'password': 'testpass123',
            'full_name': 'Debug Test User'
        },
        timeout=10
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
    print(f"Raw Response: {response.text}")
    
    if response.status_code == 200:
        print(f"JSON Response: {response.json()}")
    else:
        print(f"Error Response: {response.text}")
        
except Exception as e:
    print(f"Exception: {type(e).__name__}: {e}")
