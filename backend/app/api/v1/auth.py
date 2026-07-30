from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    AuthUserResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MFAVerifyRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.common import ErrorResponse, SuccessResponse
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def register(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = AuthService(db)
        result = await service.register(
            email=body.email,
            password=body.password,
            full_name=body.full_name,
            business_name=body.business_name,
        )
        return SuccessResponse(
            message="Registration successful. Please check your email to verify.",
            data=result,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Registration failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.post("/login", response_model=SuccessResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = AuthService(db)
        result = await service.login(email=body.email, password=body.password)
        return SuccessResponse(message="Login successful", data=result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    except Exception as exc:
        logger.exception("Login failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.post("/verify-email", response_model=SuccessResponse)
async def verify_email(body: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = AuthService(db)
        result = await service.verify_email(token=body.token)
        return SuccessResponse(message="Email verified successfully", data=result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Email verification failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = AuthService(db)
        result = await service.forgot_password(email=body.email)
        return SuccessResponse(message="If the email exists, a reset link has been sent", data=result)
    except Exception as exc:
        logger.exception("Forgot password failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = AuthService(db)
        result = await service.reset_password(token=body.token, new_password=body.new_password)
        return SuccessResponse(message="Password reset successfully", data=result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Password reset failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.post("/mfa/setup", response_model=SuccessResponse)
async def setup_mfa(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        service = AuthService(db)
        result = await service.setup_mfa(user_id=current_user.id)
        return SuccessResponse(message="MFA setup initiated", data=result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("MFA setup failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.post("/mfa/verify", response_model=SuccessResponse)
async def verify_mfa(body: MFAVerifyRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        service = AuthService(db)
        result = await service.verify_mfa(user_id=current_user.id, code=body.code)
        return SuccessResponse(message="MFA verified successfully", data=result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("MFA verification failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.get("/me", response_model=SuccessResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(
        message="User retrieved",
        data={
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
            "is_superuser": current_user.is_superuser,
            "business_id": str(current_user.business_id) if current_user.business_id else None,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
    )


@router.post("/refresh", response_model=SuccessResponse)
async def refresh_token(body: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = AuthService(db)
        result = await service.refresh_token(refresh_token=body.refresh_token)
        return SuccessResponse(message="Token refreshed", data=result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    except Exception as exc:
        logger.exception("Token refresh failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.post("/change-password", response_model=SuccessResponse)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = AuthService(db)
        result = await service.change_password(
            user_id=current_user.id,
            current_password=body.current_password,
            new_password=body.new_password,
        )
        return SuccessResponse(message="Password changed successfully", data=result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Change password failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")
