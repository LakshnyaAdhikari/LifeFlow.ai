#!/usr/bin/env python
"""Direct test of signup logic to see the actual error"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.routers.auth import SignupRequest
from app.services.jwt_service import hash_password
from app.models import User
from app.auth_models import UserAuth

def test_signup():
    db = SessionLocal()
    try:
        # Test data
        phone = "+919876543210"
        password = "testpass123"
        full_name = "Test User"
        
        print(f"Testing signup for: {full_name}, {phone}")
        
        # Check if exists
        existing = db.query(UserAuth).filter(UserAuth.phone == phone).first()
        if existing:
            print(f"User already exists with phone {phone}")
            return
        
        # Create user
        print("Creating User...")
        user = User(
            email=f"{phone}@lifeflow.temp",
            full_name=full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"User created with ID: {user.id}")
        
        # Hash password
        print("Hashing password...")
        password_hash = hash_password(password)
        print(f"Password hashed successfully")
        
        # Create auth
        print("Creating UserAuth...")
        user_auth = UserAuth(
            user_id=user.id,
            phone=phone,
            password_hash=password_hash,
            is_phone_verified=False
        )
        db.add(user_auth)
        db.commit()
        db.refresh(user_auth)
        print(f"UserAuth created with ID: {user_auth.id}")
        
        # Test OTP generation
        print("Testing OTP generation...")
        from app.services.otp_service import OTPService
        otp = OTPService.create_otp(db, user_auth.id, phone)
        print(f"OTP created: {otp.otp_code}")
        
        print("\n✅ All steps completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_signup()
