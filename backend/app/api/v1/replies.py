from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_business, get_current_user, get_db
from app.models.business import Business
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.reply import ReplyRejectRequest, ReplyUpdateRequest
from app.services.reply_service import ReplyService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/replies", tags=["Replies"])


@router.get("/")
async def get_pending_replies(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReplyService(db)
        if status_filter:
            result = await service.get_pending_replies(business_id=business.id)
            result = [r for r in result if r.status == status_filter]
        else:
            result = await service.get_pending_replies(business_id=business.id)
        return result
    except Exception as exc:
        logger.exception("Failed to fetch replies")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch replies")


@router.get("/{reply_id}")
async def get_reply(
    reply_id: UUID,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReplyService(db)
        reply = await service.get_reply(business_id=business.id, reply_id=reply_id)
        if not reply:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
        return reply
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch reply")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch reply")


@router.patch("/{reply_id}")
async def update_reply(
    reply_id: UUID,
    body: ReplyUpdateRequest,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReplyService(db)
        reply = await service.update_reply(business_id=business.id, reply_id=reply_id, content=content)
        if not reply:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
        return SuccessResponse(message="Reply updated", data={"reply_id": str(reply.id)})
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update reply")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update reply")


@router.post("/{reply_id}/approve")
async def approve_reply(
    reply_id: UUID,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReplyService(db)
        reply = await service.approve_reply(business_id=business.id, reply_id=reply_id)
        if not reply:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
        return SuccessResponse(message="Reply approved", data={"reply_id": str(reply.id)})
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to approve reply")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to approve reply")


@router.post("/{reply_id}/reject")
async def reject_reply(
    reply_id: UUID,
    body: ReplyRejectRequest,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReplyService(db)
        reply = await service.reject_reply(business_id=business.id, reply_id=reply_id, reason=reason)
        if not reply:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
        return SuccessResponse(message="Reply rejected", data={"reply_id": str(reply.id)})
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to reject reply")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to reject reply")


@router.post("/{reply_id}/publish")
async def publish_reply(
    reply_id: UUID,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReplyService(db)
        reply = await service.publish_reply(business_id=business.id, reply_id=reply_id)
        if not reply:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
        return SuccessResponse(message="Reply published", data={"reply_id": str(reply.id)})
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to publish reply")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to publish reply")


@router.post("/{reply_id}/regenerate")
async def regenerate_reply(
    reply_id: UUID,
    body: dict = {},
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    custom_instructions = body.get("custom_instructions")
    try:
        service = ReplyService(db)
        reply = await service.get_reply(business_id=business.id, reply_id=reply_id)
        if not reply:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")

        reply = await service.regenerate_reply(
            business_id=business.id, review_id=reply.review_id
        )
        return SuccessResponse(message="Reply regenerated", data={"reply_id": str(reply.id), "content": reply.content})
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to regenerate reply")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to regenerate reply")
