from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_business, get_current_user, get_db
from app.models.business import Business
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.services.knowledge_service import KnowledgeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/knowledge", tags=["Knowledge Base"])


@router.get("/")
async def list_entries(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = KnowledgeService(db)
        entries = await service.get_entries(business_id=business.id, category=category)
        return [
            {
                "id": str(e.id),
                "category": e.category,
                "title": e.title,
                "content": e.content,
                "metadata": e.extra_metadata,
                "is_active": e.is_active,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in entries
        ]
    except Exception as exc:
        logger.exception("Failed to fetch knowledge entries")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch entries")


@router.get("/{entry_id}")
async def get_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = KnowledgeService(db)
        entries = await service.get_entries(business_id=business.id)
        entry = next((e for e in entries if e.id == entry_id), None)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
        return {
            "id": str(entry.id),
            "category": entry.category,
            "title": entry.title,
            "content": entry.content,
            "metadata": entry.extra_metadata,
            "created_at": entry.created_at.isoformat() if entry.created_at else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch knowledge entry")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch entry")


@router.post("/")
async def create_entry(
    body: dict,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = KnowledgeService(db)
        entry = await service.add_entry(
            business_id=business.id,
            category=body.get("category", "general"),
            title=body.get("title", ""),
            content=body.get("content", ""),
            metadata=body.get("metadata"),
        )
        return SuccessResponse(
            message="Entry created",
            data={"id": str(entry.id)},
        )
    except Exception as exc:
        logger.exception("Failed to create knowledge entry")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create entry")


@router.patch("/{entry_id}")
async def update_entry(
    entry_id: UUID,
    body: dict,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = KnowledgeService(db)
        entry = await service.update_entry(
            business_id=business.id,
            entry_id=entry_id,
            data=body,
        )
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
        return SuccessResponse(message="Entry updated", data={"id": str(entry.id)})
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update knowledge entry")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update entry")


@router.delete("/{entry_id}")
async def delete_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = KnowledgeService(db)
        deleted = await service.delete_entry(business_id=business.id, entry_id=entry_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
        return SuccessResponse(message="Entry deleted")
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to delete knowledge entry")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete entry")
