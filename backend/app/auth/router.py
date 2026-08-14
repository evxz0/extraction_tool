import uuid
import datetime
from datetime import timezone
from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.security import verify_password, hash_password, create_access_token
from app.auth.deps import get_current_user
from app.database import db_manager
from app.redis_client import session_redis
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    identifier: str  # Username or Email
    password: str
    force_login: bool = False  # Allows user to force-terminate other device session if needed


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    user = db_manager.get_user_by_email_or_username(req.identifier)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username / Email atau Password salah."
        )

    if not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username / Email atau Password salah."
        )

    user_id = str(user["id"])
    redis_key = f"session:user:{user_id}"

    # Check 1 User 1 Device Concurrent Login Restriction
    existing_session = session_redis.get(redis_key)
    if existing_session and not req.force_login:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Akun Anda sedang aktif di perangkat lain. Silakan logout dari perangkat tersebut atau gunakan opsi force login."
        )

    # Generate JWT Token (8 hours validity)
    token_data = {
        "sub": user_id,
        "username": user["username"],
        "email": user["email"],
        "jti": str(uuid.uuid4())
    }
    access_token = create_access_token(token_data)

    # Store active session in Redis with 8-hour TTL (28800s)
    session_redis.set(redis_key, access_token, ex=settings.SESSION_TTL_SECONDS)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.SESSION_TTL_SECONDS,
        user={
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "full_name": user.get("full_name") or user["username"]
        }
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["id"])
    session_redis.delete(f"session:user:{user_id}")
    return {"message": "Berhasil logout dan melepaskan sesi perangkat."}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "username": current_user["username"],
        "full_name": current_user.get("full_name") or current_user["username"],
        "session_active": True
    }


@router.post("/reset-password/request")
async def request_password_reset(req: ResetPasswordRequest):
    user = db_manager.get_user_by_email_or_username(req.email)
    # Always respond with a generic message for security, but generate token if user exists
    reset_token = str(uuid.uuid4())
    expires_at = (datetime.datetime.now(timezone.utc) + datetime.timedelta(hours=1)).isoformat()

    if user:
        db_manager.store_password_reset_token(
            reset_id=str(uuid.uuid4()),
            user_id=str(user["id"]),
            token=reset_token,
            expires_at=expires_at
        )

    return {
        "message": "Jika email terdaftar, tautan/token reset password telah dikirimkan.",
        "token_preview": reset_token if user else None  # Useful for direct UI testing
    }


@router.post("/reset-password/confirm")
async def confirm_password_reset(req: ResetPasswordConfirm):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password minimal 6 karakter.")

    record = db_manager.get_password_reset_token(req.token)
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token reset tidak valid atau sudah digunakan.")

    # Invalidate token
    db_manager.mark_reset_token_used(req.token)

    # Update password
    new_hash = hash_password(req.new_password)
    db_manager.update_password(record["user_id"], new_hash)

    # Invalidate any active session so they must log in with new password
    session_redis.delete(f"session:user:{record['user_id']}")

    return {"message": "Password berhasil diperbarui. Silakan login kembali."}


@router.post("/change-password")
async def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    if not verify_password(req.old_password, current_user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password lama salah.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password baru minimal 6 karakter.")

    new_hash = hash_password(req.new_password)
    db_manager.update_password(str(current_user["id"]), new_hash)

    return {"message": "Password berhasil diubah."}
