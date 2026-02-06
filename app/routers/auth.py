from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, timedelta
import re

from app.database import get_db
from app.models import User
from app.auth_models import UserAuth, UserProfile, UserSession
from app.services.jwt_service import (
    hash_password, verify_password, 
    create_access_token, create_refresh_token, decode_token
)
from app.services.otp_service import OTPService

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# --- Pydantic Schemas ---

class SignupRequest(BaseModel):
    phone: str
    password: str
    full_name: str
    
    @field_validator('phone')
    def validate_phone(cls, v):
        # Auto-add +91 if not present
        if not v.startswith('+91'):
            if v.startswith('91'):
                v = '+' + v
            elif len(v) == 10:
                v = '+91' + v
        
        # Validate format
        if not re.match(r'^\+91[6-9]\d{9}$', v):
            raise ValueError('Phone must be a valid 10-digit Indian number')
        return v
    
    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 6:  # Relaxed for testing
            raise ValueError('Password must be at least 6 characters')
        return v

class LoginRequest(BaseModel):
    phone: str
    password: str

class SimpleLoginRequest(BaseModel):
    """Simplified login for testing (no OTP required)"""
    phone: str
    password: str
    skip_otp: bool = True

class VerifyOTPRequest(BaseModel):
    phone: str
    otp_code: str

class ResendOTPRequest(BaseModel):
    phone: str

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

def normalize_phone(phone: str) -> str:
    """Normalize phone number to +91XXXXXXXXXX format"""
    # Remove spaces and dashes
    phone = phone.replace(' ', '').replace('-', '')
    
    # Add +91 if not present
    if not phone.startswith('+91'):
        if phone.startswith('91'):
            phone = '+' + phone
        elif len(phone) == 10:
            phone = '+91' + phone
    
    return phone

# --- Endpoints ---

@router.post("/signup", response_model=dict)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """
    Create a new user account
    Returns user_id and requires OTP verification before login
    """
    try:
        # Normalize phone
        phone = normalize_phone(payload.phone)
        
        # Check if phone already exists
        existing_auth = db.query(UserAuth).filter(UserAuth.phone == phone).first()
        if existing_auth:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
        
        # Create user
        from datetime import datetime
        unique_email = f"{phone}.{int(datetime.utcnow().timestamp())}@lifeflow.temp"
        user = User(
            email=unique_email,
            full_name=payload.full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create auth record
        user_auth = UserAuth(
            user_id=user.id,
            phone=phone,
            password_hash=hash_password(payload.password),
            is_phone_verified=False
        )
        db.add(user_auth)
        db.commit()
        db.refresh(user_auth)
        
        # Generate and send OTP
        otp = OTPService.create_otp(db, user_auth.id, phone)
        OTPService.send_otp_sms(phone, otp.otp_code)
        
        return {
            "message": "Account created. Please verify your phone number.",
            "user_id": user.id,
            "phone": phone,
            "otp_sent": True
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        print(f"Signup error: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with phone and password
    Requires phone to be verified via OTP
    """
    try:
        # Normalize phone
        phone = normalize_phone(payload.phone)
        
        # Find user auth
        user_auth = db.query(UserAuth).filter(UserAuth.phone == phone).first()
        if not user_auth:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone or password"
            )
        
        # Verify password
        if not verify_password(payload.password, user_auth.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone or password"
            )
        
        # Check if phone is verified
        if not user_auth.is_phone_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Phone number not verified. Please verify OTP first."
            )
        
        # Get user
        user = db.query(User).filter(User.id == user_auth.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create tokens
        access_token = create_access_token({"user_id": user.id})
        refresh_token = create_refresh_token({"user_id": user.id})
        
        # Create session
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
    Simplified login for testing (skips OTP verification)
    WARNING: Only use in development!
    """
    try:
        # Normalize phone
        phone = normalize_phone(payload.phone)
        
        # Find user auth
        user_auth = db.query(UserAuth).filter(UserAuth.phone == phone).first()
        if not user_auth:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone or password"
            )
        
        # Verify password
        if not verify_password(payload.password, user_auth.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone or password"
            )
        
        # Auto-verify phone for testing
        if payload.skip_otp and not user_auth.is_phone_verified:
            user_auth.is_phone_verified = True
            db.commit()
        
        # Get user
        user = db.query(User).filter(User.id == user_auth.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create tokens
        access_token = create_access_token({"user_id": user.id})
        refresh_token = create_refresh_token({"user_id": user.id})
        
        # Create session
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
    Verify OTP and complete phone verification
    Returns access tokens upon successful verification
    """
    try:
        # Normalize phone
        phone = normalize_phone(payload.phone)
        
        # Find user auth
        user_auth = db.query(UserAuth).filter(UserAuth.phone == phone).first()
        if not user_auth:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify OTP
        if not OTPService.verify_otp(db, user_auth.id, payload.otp_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Mark phone as verified
        user_auth.is_phone_verified = True
        db.commit()
        
        # Get user
        user = db.query(User).filter(User.id == user_auth.user_id).first()
        
        # Create tokens
        access_token = create_access_token({"user_id": user.id})
        refresh_token = create_refresh_token({"user_id": user.id})
        
        # Create session
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
    """Resend OTP to user's phone"""
    try:
        phone = normalize_phone(payload.phone)
        user_auth = db.query(UserAuth).filter(UserAuth.phone == phone).first()
        
        if not user_auth:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        # Generate and send new OTP
        otp = OTPService.create_otp(db, user_auth.id, phone)
        OTPService.send_otp_sms(phone, otp.otp_code)
        
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
        "phone": user_auth.phone if user_auth else None,
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
    
    # Update fields
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
