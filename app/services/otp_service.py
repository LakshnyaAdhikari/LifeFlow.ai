from twilio.rest import Client
import os
from typing import Optional

class OTPService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None

    def send_otp(self, phone: str) -> str:
        """Send OTP via Twilio Verify"""
        if not self.client or not self.verify_sid:
            print(f"⚠️ Mock OTP sent to {phone} (Twilio not configured)")
            return "pending"
            
        verification = self.client.verify.v2.services(self.verify_sid).verifications.create(
            to=phone,
            channel="sms"
        )
        print(f"✅ Twilio Verify sent to {phone}. SID: {verification.sid}")
        return verification.status

    def verify_otp(self, phone: str, code: str) -> str:
        """Verify OTP via Twilio Verify"""
        if not self.client or not self.verify_sid:
            if code == "123456": # Dev fallback
                return "approved"
            return "pending"
            
        verification_check = self.client.verify.v2.services(self.verify_sid).verification_checks.create(
            to=phone,
            code=code
        )
        print(f"🔍 OTP verification check for {phone}: {verification_check.status}")
        return verification_check.status
