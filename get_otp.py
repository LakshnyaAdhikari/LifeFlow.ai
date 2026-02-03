from app.database import SessionLocal
from app.auth_models import OTPVerification, UserAuth

db = SessionLocal()
try:
    phone = "+917428036070"
    auth = db.query(UserAuth).filter(UserAuth.phone == phone).first()
    if auth:
        otp = db.query(OTPVerification).filter(
            OTPVerification.user_auth_id == auth.id
        ).order_by(OTPVerification.created_at.desc()).first()
        
        if otp:
            print(f"📱 OTP for {phone}: {otp.otp_code}")
            print(f"Expires at: {otp.expires_at}")
            print(f"Is verified: {otp.is_verified}")
        else:
            print(f"No OTP found for {phone}")
    else:
        print(f"No user found with phone {phone}")
finally:
    db.close()
