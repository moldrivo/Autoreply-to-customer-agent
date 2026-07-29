from __future__ import annotations

import logging
import secrets
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_business, get_current_user, get_db
from app.models.business import Business
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.review import (
    FlagReviewRequest,
    GenerateReplyRequest,
    ReviewFilterParams,
)
from app.services.reply_service import ReplyService
from app.services.review_service import ReviewService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/reviews", tags=["Reviews"])


@router.get("/")
async def get_reviews(
    sentiment: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    rating: Optional[int] = Query(None, ge=1, le=5),
    risk_level: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        filters = ReviewFilterParams(
            sentiment=sentiment,
            platform=platform,
            rating=rating,
            risk_level=risk_level,
            date_from=date_from,
            date_to=date_to,
            search=search,
            page=page,
            page_size=page_size,
        )
        service = ReviewService(db)
        result = await service.get_reviews(business_id=business.id, filters=filters)
        return result
    except Exception as exc:
        logger.exception("Failed to fetch reviews")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch reviews")


@router.get("/stats")
async def get_review_stats(
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReviewService(db)
        stats = await service.get_review_stats(business_id=business.id)
        return stats
    except Exception as exc:
        logger.exception("Failed to fetch review stats")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch review stats")


@router.get("/{review_id}")
async def get_review(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReviewService(db)
        review = await service.get_review(business_id=business.id, review_id=review_id)
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
        return review
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch review")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch review")


@router.patch("/{review_id}/flag")
async def flag_review(
    review_id: UUID,
    body: FlagReviewRequest,
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReviewService(db)
        review = await service.flag_review(business_id=business.id, review_id=review_id, reason=body.reason)
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
        return SuccessResponse(message="Review flagged successfully", data={"review_id": str(review.id)})
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to flag review")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to flag review")


@router.post("/{review_id}/generate-reply")
async def generate_reply(
    review_id: UUID,
    body: GenerateReplyRequest = {},
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ReplyService(db)
        reply = await service.generate_reply(
            business_id=business.id, review_id=review_id, custom_instructions=body.custom_instructions
        )
        return SuccessResponse(message="Reply generated successfully", data={"reply_id": str(reply.id), "content": reply.content})
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to generate reply")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate reply")


@router.post("/webhook/{platform}")
async def ingest_webhook(
    platform: str,
    body: dict,
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret"),
    db: AsyncSession = Depends(get_db),
):
    business_id_str = body.get("business_id")
    if not business_id_str:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="business_id is required")
    try:
        business_id = UUID(business_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid business_id")

    webhook_secret = settings.WEBHOOK_SECRET
    if webhook_secret and (
        x_webhook_secret is None or not secrets.compare_digest(x_webhook_secret, webhook_secret)
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid webhook secret")

    try:
        service = ReviewService(db)
        review = await service.ingest_review(business_id=business_id, platform=platform, review_data=body)
        return SuccessResponse(message="Review ingested successfully", data={"review_id": str(review.id)})
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to ingest webhook review")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to ingest review")
