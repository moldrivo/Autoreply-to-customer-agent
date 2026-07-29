from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ReplyGenerateRequest(BaseModel):
    review_id: UUID
    custom_instructions: Optional[str] = Field(None, max_length=2000)


class ReplyGenerateResponse(BaseModel):
    reply: str
    sentiment: str
    confidence: float
    risk_level: str
    needs_human_review: bool
    language: str
    quality_score: float
    safety_score: float
    reasoning_summary: str


class ReplyUpdateRequest(BaseModel):
    content: str = Field(..., min_length=1)


class ReplyRejectRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=500)


class ReplyRegenerateRequest(BaseModel):
    custom_instructions: Optional[str] = Field(None, max_length=2000)


class ReplyPublishRequest(BaseModel):
    reply_id: UUID
    schedule_at: Optional[datetime] = None


class ReplyResponse(BaseModel):
    id: UUID
    review_id: UUID
    business_id: UUID
    content: str
    status: str
    risk_level: Optional[str] = None
    quality_score: Optional[float] = None
    safety_score: Optional[float] = None
    confidence_score: Optional[float] = None
    is_ai_generated: bool = True
    ai_model_version: Optional[str] = None
    prompt_version: Optional[str] = None
    human_edited: bool = False
    edited_by: Optional[UUID] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
