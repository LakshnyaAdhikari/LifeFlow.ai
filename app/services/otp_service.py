import os
import random
import string
from datetime import datetime, timedelta
from typing import Optional

# In-memory OTP store for dev/mock mode: { email: { code, expires_at } }
_otp_store: dict = {}

RESEND_AVAILABLE = False
resend = None

try:
    import resend as resend_sdk
    resend = resend_sdk
    RESEND_AVAILABLE = True
except ImportError:
    pass


def _generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


class OTPService:
    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY")
        self.from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

        if RESEND_AVAILABLE and self.api_key:
            resend.api_key = self.api_key
            print("🚀 Resend email OTP service initialized")
        else:
            if not RESEND_AVAILABLE:
                print("🛑 [DEPENDENCY MISSING] 'resend' library not found. Using MOCK OTP service.")
            else:
                print("🛑 [DEVELOPER MODE] RESEND_API_KEY missing. Using MOCK OTP service.")
            print("💡 Use code '123456' to verify any email in local development.")

    def send_otp(self, email: str) -> str:
        """Generate and send OTP via Resend (or mock in dev mode)."""
        code = _generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Store for verification
        _otp_store[email] = {"code": code, "expires_at": expires_at}

        if not (RESEND_AVAILABLE and self.api_key):
            print(f"📡 [MOCK] OTP for {email}: {code} (valid 10 min)")
            return "pending"

        try:
            resend.Emails.send({
                "from": self.from_email,
                "to": email,
                "subject": "Your LifeFlow verification code",
                "html": f"""
                <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px;">
                    <h2 style="color: #0d9488;">LifeFlow.ai</h2>
                    <p>Your verification code is:</p>
                    <h1 style="letter-spacing: 8px; font-size: 40px; color: #111;">{code}</h1>
                    <p style="color: #666;">This code expires in 10 minutes. Do not share it with anyone.</p>
                </div>
                """
            })
            print(f"✅ Resend OTP sent to {email}")
            return "pending"
        except Exception as e:
            print(f"❌ Resend error sending OTP to {email}: {e}")
            print(f"🔄 Falling back to MOCK mode — code: {code}")
            return "pending"

    def verify_otp(self, email: str, code: str) -> str:
        """Verify the OTP code for the given email."""
        # Dev mock fallback: always accept 123456
        if not (RESEND_AVAILABLE and self.api_key):
            if code == "123456":
                print(f"✅ [MOCK] Code '123456' accepted for {email}")
                _otp_store.pop(email, None)
                return "approved"
            print(f"❌ [MOCK] Invalid code '{code}' for {email}. Try '123456'.")
            return "pending"

        entry = _otp_store.get(email)
        if not entry:
            print(f"❌ No OTP found for {email}")
            return "pending"

        if datetime.utcnow() > entry["expires_at"]:
            print(f"❌ OTP expired for {email}")
            _otp_store.pop(email, None)
            return "pending"

        if entry["code"] != code:
            print(f"❌ Wrong OTP for {email}")
            return "pending"

        # Valid — clean up
        _otp_store.pop(email, None)
        print(f"✅ OTP verified for {email}")
        return "approved"
