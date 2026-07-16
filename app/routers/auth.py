from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User
from app.auth_models import UserAuth, UserProfile, UserSession
from app.services.jwt_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.services.otp_service import OTPService

otp_service = OTPService()

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# --- Pydantic Schemas ---

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SimpleLoginRequest(BaseModel):
    """Simplified login for testing (no OTP required)"""
    email: EmailStr
    password: str
    skip_otp: bool = True

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str

class ResendOTPRequest(BaseModel):
    email: EmailStr

class ProfileUpdateRequest(BaseModel):
    location_state: Optional[str] = None
    location_city: Optional[str] = None
    age_range: Optional[str] = None
    preferred_language: Optional[str] = "en"
    family_status: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int

# --- Helper Functions ---

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

# --- Endpoints ---

@router.post("/signup", response_model=dict)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """
    Create a new user account with email.
    Sends OTP to email via Resend for verification.
    If account exists but is unverified, resends OTP instead of rejecting.
    """
    print("🚀 Signup endpoint triggered")
    try:
        email = payload.email.lower().strip()

        # Check if a verified account already exists — hard stop
        existing_auth = db.query(UserAuth).filter(UserAuth.email == email).first()
        if existing_auth and existing_auth.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # If unverified account exists, just resend OTP and let them verify
        if existing_auth and not existing_auth.is_email_verified:
            otp_service.send_otp(email)
            return {
                "message": "Verification code resent. Please check your email.",
                "user_id": existing_auth.user_id,
                "email": email,
                "otp_sent": True
            }

        # Fresh signup — create User + UserAuth
        user = User(
            email=email,
            full_name=payload.full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        user_auth = UserAuth(
            user_id=user.id,
            email=email,
            password_hash=hash_password(payload.password),
            is_email_verified=False
        )
        db.add(user_auth)
        db.commit()
        db.refresh(user_auth)

        # Send OTP via Resend
        otp_service.send_otp(email)

        return {
            "message": "Account created. Please check your email for the verification code.",
            "user_id": user.id,
            "email": email,
            "otp_sent": True
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Signup error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Requires email to be verified via OTP.
    """
    try:
        email = payload.email.lower().strip()

        user_auth = db.query(UserAuth).filter(UserAuth.email == email).first()
        if not user_auth:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(payload.password, user_auth.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user_auth.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify OTP first."
            )

        user = db.query(User).filter(User.id == user_auth.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        access_token = create_access_token({"user_id": user.id})
        refresh_token = create_refresh_token({"user_id": user.id})

        session = UserSession(
            user_id=user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(session)
        db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=user.id
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Login error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/login-simple", response_model=TokenResponse)
def login_simple(payload: SimpleLoginRequest, db: Session = Depends(get_db)):
    """
    Simplified login for development (skips OTP verification).
    WARNING: Only use in development!
    """
    try:
        email = payload.email.lower().strip()

        user_auth = db.query(UserAuth).filter(UserAuth.email == email).first()
        if not user_auth:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(payload.password, user_auth.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Auto-verify email for dev
        if payload.skip_otp and not user_auth.is_email_verified:
            user_auth.is_email_verified = True
            db.commit()

        user = db.query(User).filter(User.id == user_auth.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        access_token = create_access_token({"user_id": user.id})
        refresh_token = create_refresh_token({"user_id": user.id})

        session = UserSession(
            user_id=user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(session)
        db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=user.id
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Simple login error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verify OTP code sent to email.
    Returns JWT tokens on success.
    """
    try:
        email = payload.email.lower().strip()

        user_auth = db.query(UserAuth).filter(UserAuth.email == email).first()
        if not user_auth:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        verify_status = otp_service.verify_otp(email, payload.otp_code)
        if verify_status != "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )

        user_auth.is_email_verified = True
        db.commit()

        user = db.query(User).filter(User.id == user_auth.user_id).first()

        access_token = create_access_token({"user_id": user.id})
        refresh_token = create_refresh_token({"user_id": user.id})

        session = UserSession(
            user_id=user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(session)
        db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=user.id
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"OTP verification error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}"
        )

@router.post("/send-otp")
def send_otp(payload: ResendOTPRequest, db: Session = Depends(get_db)):
    """Resend OTP to user's email"""
    try:
        email = payload.email.lower().strip()

        user_auth = db.query(UserAuth).filter(UserAuth.email == email).first()
        if not user_auth:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        otp_service.send_otp(email)
        return {"message": "OTP sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Resend OTP error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resend OTP: {str(e)}"
        )

@router.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user information"""
    user_auth = db.query(UserAuth).filter(UserAuth.user_id == current_user.id).first()
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": user_auth.email if user_auth else current_user.email,
        "profile": {
            "location_state": user_profile.location_state if user_profile else None,
            "location_city": user_profile.location_city if user_profile else None,
            "age_range": user_profile.age_range if user_profile else None,
            "preferred_language": user_profile.preferred_language if user_profile else "en",
            "family_status": user_profile.family_status if user_profile else None
        } if user_profile else None
    }

@router.post("/profile")
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if payload.location_state:
        profile.location_state = payload.location_state
    if payload.location_city:
        profile.location_city = payload.location_city
    if payload.age_range:
        profile.age_range = payload.age_range
    if payload.preferred_language:
        profile.preferred_language = payload.preferred_language
    if payload.family_status:
        profile.family_status = payload.family_status

    db.commit()
    return {"message": "Profile updated successfully"}
