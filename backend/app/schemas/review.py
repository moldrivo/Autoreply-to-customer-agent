from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ReviewResponse(BaseModel):
    id: UUID
    business_id: UUID
    platform: str
    platform_review_id: Optional[str] = None
    customer_name: str
    rating: int
    review_text: str
    review_date: Optional[datetime] = None
    reply_text: Optional[str] = None
    sentiment: Optional[str] = None
    sentiment_confidence: Optional[float] = None
    risk_level: Optional[str] = None
    needs_human_review: bool = False
    is_auto_replied: bool = False
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    language: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    replied_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ReviewListResponse(BaseModel):
    items: list[ReviewResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ReviewFilterParams(BaseModel):
    sentiment: Optional[str] = None
    platform: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    risk_level: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class FlagReviewRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=500)


class GenerateReplyRequest(BaseModel):
    custom_instructions: Optional[str] = Field(None, max_length=2000)
