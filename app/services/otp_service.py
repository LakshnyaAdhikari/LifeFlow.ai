import os
import random
import string
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# In-memory OTP store: { email: { code, expires_at } }
_otp_store: dict = {}


def _generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


class OTPService:
    def __init__(self):
        self.gmail_user = os.getenv("GMAIL_USER")
        self.gmail_app_password = os.getenv("GMAIL_APP_PASSWORD")

        if self.gmail_user and self.gmail_app_password:
            print(f"🚀 Gmail SMTP OTP service initialized ({self.gmail_user})")
        else:
            print("🛑 [DEVELOPER MODE] GMAIL_USER or GMAIL_APP_PASSWORD missing. Using MOCK OTP service.")
            print("💡 Use code '123456' to verify any email in local development.")

    def _is_configured(self) -> bool:
        return bool(self.gmail_user and self.gmail_app_password)

    def send_otp(self, email: str) -> str:
        """Generate OTP, store it, and send via Gmail SMTP (or mock)."""
        code = _generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        _otp_store[email] = {"code": code, "expires_at": expires_at}

        if not self._is_configured():
            print(f"📡 [MOCK] OTP for {email}: {code} (valid 10 min)")
            return "pending"

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Your LifeFlow verification code"
            msg["From"] = f"LifeFlow.ai <{self.gmail_user}>"
            msg["To"] = email

            html = f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px;">
                <h2 style="color: #0d9488;">LifeFlow.ai</h2>
                <p style="font-size: 16px; color: #333;">Your email verification code is:</p>
                <h1 style="letter-spacing: 10px; font-size: 44px; color: #111; margin: 24px 0;">{code}</h1>
                <p style="color: #666; font-size: 14px;">
                    This code expires in <strong>10 minutes</strong>.<br>
                    If you didn't request this, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                <p style="color: #999; font-size: 12px;">LifeFlow.ai — Simplifying life's legal and administrative challenges.</p>
            </div>
            """

            msg.attach(MIMEText(html, "html"))

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(self.gmail_user, self.gmail_app_password)
                server.sendmail(self.gmail_user, email, msg.as_string())

            print(f"✅ Gmail OTP sent to {email}")
            return "pending"

        except smtplib.SMTPAuthenticationError:
            print(f"❌ Gmail auth failed — check GMAIL_USER and GMAIL_APP_PASSWORD in .env")
            print(f"🔄 Falling back to MOCK mode — code for {email}: {code}")
            return "pending"
        except Exception as e:
            print(f"❌ Gmail SMTP error for {email}: {e}")
            print(f"🔄 Falling back to MOCK mode — code for {email}: {code}")
            return "pending"

    def verify_otp(self, email: str, code: str) -> str:
        """Verify the OTP code for the given email."""
        # Dev mock fallback
        if not self._is_configured():
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

        _otp_store.pop(email, None)
        print(f"✅ OTP verified for {email}")
        return "approved"
