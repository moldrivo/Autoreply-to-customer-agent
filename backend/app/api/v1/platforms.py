from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_business, get_current_user, get_db
from app.models.business import Business
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.platform import ConnectPlatformRequest
from app.services.platform_service import PlatformService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/platforms", tags=["Platforms"])


@router.get("/")
async def list_platforms(
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = PlatformService(db)
        connections = await service.get_connections(business_id=business.id)
        return [
            {
                "id": str(c.id),
                "platform": c.platform,
                "account_name": c.platform_account_name,
                "is_active": c.is_active,
                "last_sync_at": c.last_sync_at.isoformat() if c.last_sync_at else None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in connections
        ]
    except Exception as exc:
        logger.exception("Failed to list platforms")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list platforms")


@router.post("/connect")
async def connect_platform(
    body: ConnectPlatformRequest,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = PlatformService(db)
        connection = await service.connect_platform(
            business_id=business.id, platform=body.platform, credentials=body.credentials
        )
        return SuccessResponse(
            message=f"Connected to {body.platform}",
            data={"id": str(connection.id), "platform": connection.platform},
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to connect platform")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to connect platform")


@router.post("/{platform_id}/disconnect")
async def disconnect_platform(
    platform_id: UUID,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = PlatformService(db)
        success = await service.disconnect_platform(business_id=business.id, platform_id=platform_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Platform connection not found")
        return SuccessResponse(message="Platform disconnected")
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to disconnect platform")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to disconnect platform")


@router.get("/{platform_id}/status")
async def platform_status(
    platform_id: UUID,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = PlatformService(db)
        connections = await service.get_connections(business_id=business.id)
        conn = next((c for c in connections if str(c.id) == str(platform_id)), None)
        if not conn:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Platform connection not found")
        return {
            "id": str(conn.id),
            "platform": conn.platform,
            "is_active": conn.is_active,
            "last_sync_at": conn.last_sync_at.isoformat() if conn.last_sync_at else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to check platform status")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to check platform status")
