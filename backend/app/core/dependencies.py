from __future__ import annotations

from typing import Any, Callable
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db as _get_db
from app.core.security import get_current_user as _get_current_user
from app.models.business import Business
from app.models.user import User

get_db = _get_db
get_current_user = _get_current_user

limiter = Limiter(key_func=get_remote_address)


async def get_current_business(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Business:
    if current_user.business_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any business",
        )
    result = await db.execute(
        select(Business).where(Business.id == current_user.business_id)
    )
    business = result.scalar_one_or_none()
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )
    if not business.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business account is disabled",
        )
    return business


def require_role(role: str) -> Callable[..., Any]:
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' is required",
            )
        return current_user

    return role_checker


class RateLimiter:
    def __init__(self, limit: str = "100/minute") -> None:
        self.limit = limit
        self._limiter = limiter

    async def __call__(self, request: Request) -> None:
        await self._limiter.limit(self.limit)(request)
