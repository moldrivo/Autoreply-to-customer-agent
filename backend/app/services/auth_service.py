from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pyotp
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.business import Business
from app.models.user import User
from app.utils.email import send_password_reset, send_verification_email
from app.utils.helpers import slugify


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register(
        self, email: str, password: str, full_name: str, business_name: str
    ) -> dict:
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        slug = slugify(business_name)
        while True:
            existing_biz = await self.db.execute(
                select(Business).where(Business.slug == slug)
            )
            if not existing_biz.scalar_one_or_none():
                break
            slug = f"{slug}-{secrets.token_hex(3)}"

        business = Business(
            id=uuid4(),
            name=business_name,
            slug=slug,
            plan=settings.DEFAULT_TENANT_PLAN,
        )
        self.db.add(business)
        await self.db.flush()

        user = User(
            id=uuid4(),
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            business_id=business.id,
        )
        self.db.add(user)
        await self.db.flush()

        verification_token = create_access_token(
            {"sub": str(user.id), "type": "email_verify"},
            expires_delta=timedelta(hours=24),
        )
        await send_verification_email(email, verification_token)

        return {
            "user_id": str(user.id),
            "business_id": str(business.id),
            "email": user.email,
        }

    async def login(self, email: str, password: str) -> dict:
        result = await self.db.execute(
            select(User).where(User.email == email, User.is_active.is_(True))
        )
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")

        if user.mfa_enabled:
            return {
                "requires_mfa": True,
                "user_id": str(user.id),
            }

        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": str(user.id),
        }

    async def verify_email(self, token: str) -> dict:
        from app.core.security import verify_token

        payload = verify_token(token)
        if payload.get("type") != "email_verify":
            raise ValueError("Invalid verification token")

        user_id = UUID(payload["sub"])
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        user.is_verified = True
        await self.db.flush()
        return {"verified": True}

    async def forgot_password(self, email: str) -> dict:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return {"message": "If the email exists, a reset link has been sent"}

        reset_token = create_access_token(
            {"sub": str(user.id), "type": "password_reset"},
            expires_delta=timedelta(hours=1),
        )
        await send_password_reset(email, reset_token)
        return {"message": "If the email exists, a reset link has been sent"}

    async def reset_password(self, token: str, new_password: str) -> dict:
        from app.core.security import verify_token

        payload = verify_token(token)
        if payload.get("type") != "password_reset":
            raise ValueError("Invalid or expired reset token")

        user_id = UUID(payload["sub"])
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        user.hashed_password = hash_password(new_password)
        await self.db.flush()
        return {"reset": True}

    async def setup_mfa(self, user_id: UUID) -> dict:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        secret = pyotp.random_base32()
        user.mfa_secret = secret
        await self.db.flush()

        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email, issuer_name=settings.PROJECT_NAME
        )

        return {
            "secret": secret,
            "qr_code_uri": provisioning_uri,
        }

    async def verify_mfa(self, user_id: UUID, code: str) -> dict:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.mfa_secret:
            raise ValueError("MFA not configured")

        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(code):
            raise ValueError("Invalid MFA code")

        user.last_login_at = datetime.now(timezone.utc)
        user.mfa_enabled = True
        await self.db.flush()

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def refresh_token(self, refresh_token: str) -> dict:
        from app.core.security import verify_token

        payload = verify_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        user_id = UUID(payload["sub"])
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        new_access_token = create_access_token({"sub": str(user.id)})
        new_refresh_token = create_refresh_token({"sub": str(user.id)})

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    async def change_password(self, user_id: UUID, current_password: str, new_password: str) -> dict:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        if not verify_password(current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")

        user.hashed_password = hash_password(new_password)
        await self.db.flush()
        return {"reset": True}

