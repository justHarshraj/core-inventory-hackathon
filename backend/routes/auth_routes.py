from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models, schemas
from dependencies import get_db
from auth import hash_password, verify_password
import re

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. login ID should be unique and between 6-12 chars
    if len(user.login_id) < 6 or len(user.login_id) > 12:
        raise HTTPException(status_code=400, detail="Login ID must be between 6-12 characters")
        
    db_login_id = db.query(models.User).filter(models.User.login_id == user.login_id).first()
    if db_login_id:
        raise HTTPException(status_code=400, detail="Login ID already registered")

    # 2. Email ID should not be a duplicate
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # 3. Password constraints
    # Must be > 8 chars, contain small case, large case, special character
    if len(user.password) <= 8:
        raise HTTPException(status_code=400, detail="Password must be more than 8 characters")
    if not re.search(r"[a-z]", user.password):
        raise HTTPException(status_code=400, detail="Password must contain a lowercase letter")
    if not re.search(r"[A-Z]", user.password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", user.password):
        raise HTTPException(status_code=400, detail="Password must contain a special character")
        
    hashed = hash_password(user.password)
    new_user = models.User(
        login_id=user.login_id,
        email=user.email,
        password=hashed
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.UserResponse)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.login_id == user.login_id).first()
    
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid Login Id or Password")
        
    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid Login Id or Password")
        
    return db_user

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == req.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = "123456"
    print(f"OTP for {req.email} is {otp}")
    return {"message": "OTP sent successfully"}

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if req.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    db_user = db.query(models.User).filter(models.User.email == req.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_user.password = hash_password(req.new_password)
    db.commit()
    return {"message": "Password reset successful"}
