from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class UserAuth(Base):
    """Extended user authentication information"""
    __tablename__ = "user_auth"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    phone = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_phone_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="auth")
    otp_verifications = relationship("OTPVerification", back_populates="user_auth")

class OTPVerification(Base):
    """OTP codes for phone verification"""
    __tablename__ = "otp_verification"
    
    id = Column(Integer, primary_key=True, index=True)
    user_auth_id = Column(Integer, ForeignKey("user_auth.id"))
    phone = Column(String)
    otp_code = Column(String(6))
    expires_at = Column(DateTime)
    is_verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user_auth = relationship("UserAuth", back_populates="otp_verifications")

class UserProfile(Base):
    """User context for personalization"""
    __tablename__ = "user_profile"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    location_state = Column(String, nullable=True)
    location_city = Column(String, nullable=True)
    age_range = Column(String, nullable=True)  # 18-25, 26-40, 41-60, 60+
    preferred_language = Column(String, default="en")
    family_status = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

class UserSession(Base):
    """JWT session management"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    access_token = Column(Text)
    refresh_token = Column(Text)
    expires_at = Column(DateTime)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")
