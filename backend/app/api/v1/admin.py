from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role
from app.core.database import AsyncSessionLocal
from app.models.audit_log import AuditLog
from app.models.business import Business
from app.models.usage import UsageMetric
from app.models.user import User
from app.schemas.common import HealthResponse, SuccessResponse
from app.schemas.admin import FeatureFlagsRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role("superuser")),
    db: AsyncSession = Depends(get_db),
):
    try:
        query = select(User).order_by(User.created_at.desc())
        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar() or 0
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        result = await db.execute(query)
        users = result.scalars().all()
        return {
            "items": [{"id": str(u.id), "email": u.email, "full_name": u.full_name, "is_active": u.is_active, "is_superuser": u.is_superuser, "business_id": str(u.business_id) if u.business_id else None, "created_at": u.created_at.isoformat() if u.created_at else None} for u in users],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }
    except Exception as exc:
        logger.exception("Failed to list users")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list users")


@router.get("/businesses")
async def list_businesses(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role("superuser")),
    db: AsyncSession = Depends(get_db),
):
    try:
        query = select(Business).order_by(Business.created_at.desc())
        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar() or 0
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        result = await db.execute(query)
        businesses = result.scalars().all()
        return {
            "items": [{"id": str(b.id), "name": b.name, "slug": b.slug, "plan": b.plan, "is_active": b.is_active, "created_at": b.created_at.isoformat() if b.created_at else None} for b in businesses],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }
    except Exception as exc:
        logger.exception("Failed to list businesses")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list businesses")


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    current_user: User = Depends(require_role("superuser")),
    db: AsyncSession = Depends(get_db),
):
    try:
        query = select(AuditLog)
        if action:
            query = query.where(AuditLog.action == action)
        if resource_type:
            query = query.where(AuditLog.resource_type == resource_type)

        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar() or 0
        offset = (page - 1) * page_size
        query = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size)
        result = await db.execute(query)
        logs = result.scalars().all()
        return {
            "items": [{"id": str(l.id), "business_id": str(l.business_id), "user_id": str(l.user_id) if l.user_id else None, "action": l.action, "resource_type": l.resource_type, "resource_id": l.resource_id, "details": l.details, "created_at": l.created_at.isoformat() if l.created_at else None} for l in logs],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }
    except Exception as exc:
        logger.exception("Failed to fetch audit logs")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch audit logs")


@router.get("/usage")
async def get_usage_metrics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_role("superuser")),
    db: AsyncSession = Depends(get_db),
):
    try:
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        result = await db.execute(
            select(UsageMetric).where(UsageMetric.created_at >= cutoff).order_by(UsageMetric.created_at.desc())
        )
        metrics = result.scalars().all()
        total_cost = sum(m.cost for m in metrics if m.cost)
        total_tokens = sum(m.total_tokens for m in metrics if m.total_tokens)
        return {
            "total_requests": len(metrics),
            "total_cost": round(total_cost, 6),
            "total_tokens": total_tokens,
            "items": [{"id": str(m.id), "business_id": str(m.business_id), "metric_type": m.metric_type, "model": m.model, "cost": m.cost, "total_tokens": m.total_tokens, "created_at": m.created_at.isoformat() if m.created_at else None} for m in metrics],
        }
    except Exception as exc:
        logger.exception("Failed to fetch usage metrics")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch usage metrics")


@router.get("/health", response_model=HealthResponse)
async def admin_health():
    statuses = {"database": "disconnected", "redis": "disconnected", "openai": "unknown"}
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(select(func.now()))
            statuses["database"] = "connected"
    except Exception as exc:
        logger.warning("Health check — database: %s", exc)

    try:
        from app.core.redis import get_redis
        r = await get_redis()
        if r is not None:
            await r.ping()
            statuses["redis"] = "connected"
    except Exception as exc:
        logger.warning("Health check — redis: %s", exc)

    try:
        from openai import AsyncOpenAI
        from app.core.config import settings
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        await client.models.list()
        statuses["openai"] = "connected"
    except Exception as exc:
        logger.warning("Health check — openai: %s", exc)
        statuses["openai"] = "disconnected"

    return HealthResponse(
        status="healthy" if statuses["database"] == "connected" else "unhealthy",
        version="1.0.0",
        database=statuses["database"],
        redis=statuses["redis"],
    )


@router.post("/feature-flags")
async def update_feature_flags(
    body: FeatureFlagsRequest,
    current_user: User = Depends(require_role("superuser")),
    db: AsyncSession = Depends(get_db),
):
    try:
        from app.core.redis import cache_set
        await cache_set("feature_flags", body.flags, ttl=86400)
        return SuccessResponse(message="Feature flags updated", data=body.flags)
    except Exception as exc:
        logger.exception("Failed to update feature flags")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update feature flags")
