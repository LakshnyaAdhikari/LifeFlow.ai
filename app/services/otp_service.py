from twilio.rest import Client
import os
from typing import Optional

class OTPService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")
        
        if self.account_sid and self.auth_token and self.verify_sid:
            self.client = Client(self.account_sid, self.auth_token)
            print("🚀 Twilio Verify Service initialized")
        else:
            self.client = None
            print("🛑 [DEVELOPER MODE] Twilio credentials missing. Using MOCK OTP service.")
            print("💡 Use code '123456' to verify any number in local development.")

    def send_otp(self, phone: str) -> str:
        """Send OTP via Twilio Verify (or mock)"""
        if not self.client:
            print(f"📡 [MOCK] OTP 'sent' to {phone}. (Status: pending)")
            return "pending"
            
        try:
            verification = self.client.verify.v2.services(self.verify_sid).verifications.create(
                to=phone,
                channel="sms"
            )
            print(f"✅ Twilio Verify sent to {phone}. SID: {verification.sid}")
            return verification.status
        except Exception as e:
            print(f"❌ Twilio Error sending OTP: {e}")
            print(f"🔄 Falling back to [MOCK] mode for {phone}")
            return "pending"

    def verify_otp(self, phone: str, code: str) -> str:
        """Verify OTP via Twilio Verify (or mock)"""
        if not self.client:
            if code == "123456":
                print(f"✅ [MOCK] Code '123456' accepted for {phone}")
                return "approved"
            print(f"❌ [MOCK] Invalid code '{code}' for {phone}. (Try '123456')")
            return "pending"
            
        try:
            verification_check = self.client.verify.v2.services(self.verify_sid).verification_checks.create(
                to=phone,
                code=code
            )
            print(f"🔍 OTP verification check for {phone}: {verification_check.status}")
            return verification_check.status
        except Exception as e:
            print(f"❌ Twilio Error verifying OTP: {e}")
            if code == "123456":
                print(f"✅ [MOCK FALLBACK] Code '123456' accepted due to Twilio error")
                return "approved"
            return "pending"
