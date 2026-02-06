from datetime import datetime, timedelta
import random
import string
from typing import Optional
from sqlalchemy.orm import Session
from app.auth_models import OTPVerification

class OTPService:
    """Service for generating and verifying OTP codes"""
    
    OTP_LENGTH = 6
    OTP_EXPIRY_MINUTES = 15
    MAX_ATTEMPTS = 5
    
    @staticmethod
    def generate_otp() -> str:
        """Generate a 6-digit OTP code"""
        return ''.join(random.choices(string.digits, k=OTPService.OTP_LENGTH))
    
    @staticmethod
    def create_otp(db: Session, user_auth_id: int, phone: str) -> OTPVerification:
        """Create and store an OTP for a user"""
        # Invalidate any existing unverified OTPs for this user
        db.query(OTPVerification).filter(
            OTPVerification.user_auth_id == user_auth_id,
            OTPVerification.is_verified == False
        ).update({"is_verified": True})  # Mark as used
        
        # Generate new OTP
        otp_code = OTPService.generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=OTPService.OTP_EXPIRY_MINUTES)
        
        otp = OTPVerification(
            user_auth_id=user_auth_id,
            phone=phone,
            otp_code=otp_code,
            expires_at=expires_at
        )
        db.add(otp)
        db.commit()
        db.refresh(otp)
        
        return otp
    
    @staticmethod
    def verify_otp(db: Session, user_auth_id: int, otp_code: str) -> bool:
        """Verify an OTP code"""
        otp = db.query(OTPVerification).filter(
            OTPVerification.user_auth_id == user_auth_id,
            OTPVerification.otp_code == otp_code,
            OTPVerification.is_verified == False
        ).first()
        
        if not otp:
            return False
        
        # Check if expired
        if datetime.utcnow() > otp.expires_at:
            return False
        
        # Check attempts
        otp.attempts += 1
        if otp.attempts > OTPService.MAX_ATTEMPTS:
            db.commit()
            return False
        
        # Mark as verified
        otp.is_verified = True
        db.commit()
        
        return True
    
    @staticmethod
    def send_otp_sms(phone: str, otp_code: str) -> bool:
        """
        Send OTP via SMS using Twilio
        For now, this is a mock implementation
        TODO: Integrate with Twilio API
        """
        # Mock implementation - just print to console
        print(f"📱 SMS to {phone}: Your LifeFlow verification code is {otp_code}. Valid for 5 minutes.")
        
        # TODO: Uncomment and configure when Twilio is set up
        # from twilio.rest import Client
        # account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        # auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        # twilio_phone = os.getenv('TWILIO_PHONE_NUMBER')
        # 
        # client = Client(account_sid, auth_token)
        # message = client.messages.create(
        #     body=f"Your LifeFlow verification code is {otp_code}. Valid for 5 minutes.",
        #     from_=twilio_phone,
        #     to=phone
        # )
        # return message.sid is not None
        
        return True  # Mock success
