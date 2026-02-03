from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
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
    
    @validator('phone')
    def validate_phone(cls, v):
        # Simple validation for Indian phone numbers
        if not re.match(r'^\+91[6-9]\d{9}$', v):
            raise ValueError('Phone must be in format +91XXXXXXXXXX')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class LoginRequest(BaseModel):
    phone: str
    password: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp_code: str

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
    Create a new user account
    Returns user_id and requires OTP verification before login
    """
    try:
        # Check if phone already exists
        existing_auth = db.query(UserAuth).filter(UserAuth.phone == payload.phone).first()
        if existing_auth:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
        
        # Create user
        from datetime import datetime
        unique_email = f"{payload.phone}.{int(datetime.utcnow().timestamp())}@lifeflow.temp"
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
            phone=payload.phone,
            password_hash=hash_password(payload.password),
            is_phone_verified=False
        )
        db.add(user_auth)
        db.commit()
        db.refresh(user_auth)
        
        # Generate and send OTP
        otp = OTPService.create_otp(db, user_auth.id, payload.phone)
        OTPService.send_otp_sms(payload.phone, otp.otp_code)
        
        return {
            "message": "Account created. Please verify your phone number.",
            "user_id": user.id,
            "phone": payload.phone,
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

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verify OTP and issue JWT tokens
    """
    # Find user by phone
    user_auth = db.query(UserAuth).filter(UserAuth.phone == payload.phone).first()
    if not user_auth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
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
    
    # Create tokens
    token_data = {"user_id": user_auth.user_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Store session
    session = UserSession(
        user_id=user_auth.user_id,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user_auth.user_id
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with phone and password
    """
    # Find user
    user_auth = db.query(UserAuth).filter(UserAuth.phone == payload.phone).first()
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
            detail="Please verify your phone number first"
        )
    
    # Create tokens
    token_data = {"user_id": user_auth.user_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Store session
    session = UserSession(
        user_id=user_auth.user_id,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user_auth.user_id
    )

@router.post("/resend-otp")
def resend_otp(phone: str, db: Session = Depends(get_db)):
    """Resend OTP to phone number"""
    user_auth = db.query(UserAuth).filter(UserAuth.phone == phone).first()
    if not user_auth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )
    
    # Generate and send new OTP
    otp = OTPService.create_otp(db, user_auth.id, phone)
    OTPService.send_otp_sms(phone, otp.otp_code)
    
    return {"message": "OTP sent successfully", "phone": phone}

@router.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user profile"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    auth = db.query(UserAuth).filter(UserAuth.user_id == current_user.id).first()
    
    return {
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "phone": auth.phone if auth else None,
        "is_phone_verified": auth.is_phone_verified if auth else False,
        "profile": {
            "location_state": profile.location_state if profile else None,
            "location_city": profile.location_city if profile else None,
            "age_range": profile.age_range if profile else None,
            "preferred_language": profile.preferred_language if profile else "en",
            "family_status": profile.family_status if profile else None
        } if profile else None
    }

@router.put("/profile")
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile context"""
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
    
    profile.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Profile updated successfully"}

@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Logout and revoke session"""
    token = credentials.credentials
    
    # Find and revoke session
    session = db.query(UserSession).filter(
        UserSession.access_token == token,
        UserSession.is_revoked == False
    ).first()
    
    if session:
        session.is_revoked = True
        db.commit()
    
    return {"message": "Logged out successfully"}
