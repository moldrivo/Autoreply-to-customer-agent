from __future__ import annotations

from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.brand_voice import BrandVoice
from app.models.business import Business
from app.utils.helpers import now


DEFAULT_BRAND_VOICE: dict[str, Any] = {
    "tone": "professional",
    "style": "formal",
    "language": "en",
    "personality": "Helpful, courteous, and solution-oriented",
    "values": ["customer satisfaction", "transparency", "quality"],
    "keywords": [],
    "forbidden_terms": [],
    "custom_rules": [],
    "greeting_template": "Dear {customer_name},",
    "closing_template": "Best regards,\n{company_name}",
    "sample_replies": [],
}


class BrandVoiceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_brand_voice(self, business_id: UUID) -> BrandVoice:
        result = await self.db.execute(
            select(BrandVoice).where(BrandVoice.business_id == business_id)
        )
        brand_voice = result.scalar_one_or_none()
        if not brand_voice:
            brand_voice = BrandVoice(
                id=uuid4(),
                business_id=business_id,
                **DEFAULT_BRAND_VOICE,
                is_default=True,
            )
            self.db.add(brand_voice)
            await self.db.flush()
            await self.db.refresh(brand_voice)
        return brand_voice

    async def update_brand_voice(self, business_id: UUID, data: dict[str, Any]) -> BrandVoice:
        brand_voice = await self.get_brand_voice(business_id)

        field_map = {
            "writing_style": "style",
            "greeting_style": "greeting_template",
            "closing_style": "closing_template",
            "business_description": None,
            "company_name": None,
            "industry": None,
            "reply_length": None,
            "emoji_preference": None,
            "professional_level": None,
            "personalization_level": None,
            "custom_instructions": None,
        }

        for key, value in data.items():
            mapped = field_map.get(key)
            if mapped and value is not None:
                setattr(brand_voice, mapped, value)
            elif mapped is None:
                continue
            elif key in ("tone", "style", "language", "personality", "values", "keywords", "forbidden_terms", "custom_rules", "greeting_template", "closing_template", "sample_replies") and value is not None:
                setattr(brand_voice, key, value)

        brand_voice.is_default = False
        await self.db.flush()
        await self.db.refresh(brand_voice)
        return brand_voice

    async def get_brand_context(self, business_id: UUID) -> str:
        brand_voice = await self.get_brand_voice(business_id)

        business_result = await self.db.execute(
            select(Business).where(Business.id == business_id)
        )
        business = business_result.scalar_one_or_none()

        parts = [
            f"Company: {business.name if business else 'Unknown'}",
            f"Industry: {business.industry or 'General'}",
            f"Tone: {brand_voice.tone}",
            f"Style: {brand_voice.style}",
            f"Language: {brand_voice.language}",
            f"Personality: {brand_voice.personality or 'Professional'}",
        ]

        if brand_voice.values:
            parts.append(f"Core Values: {', '.join(brand_voice.values)}")

        if brand_voice.keywords:
            parts.append(f"Keywords: {', '.join(brand_voice.keywords)}")

        if brand_voice.forbidden_terms:
            parts.append(f"Avoid: {', '.join(brand_voice.forbidden_terms)}")

        if brand_voice.custom_rules:
            for i, rule in enumerate(brand_voice.custom_rules, 1):
                parts.append(f"Rule {i}: {rule}")

        if brand_voice.greeting_template:
            parts.append(f"Greeting: {brand_voice.greeting_template}")

        if brand_voice.closing_template:
            parts.append(f"Closing: {brand_voice.closing_template}")

        if business and business.description:
            parts.append(f"Description: {business.description}")

        return "\n".join(parts)

    async def reset_to_defaults(self, business_id: UUID) -> BrandVoice:
        result = await self.db.execute(
            select(BrandVoice).where(BrandVoice.business_id == business_id)
        )
        brand_voice = result.scalar_one_or_none()

        if brand_voice:
            for key, value in DEFAULT_BRAND_VOICE.items():
                setattr(brand_voice, key, value)
            brand_voice.is_default = True
        else:
            brand_voice = BrandVoice(
                id=uuid4(),
                business_id=business_id,
                **DEFAULT_BRAND_VOICE,
                is_default=True,
            )
            self.db.add(brand_voice)

        await self.db.flush()
        await self.db.refresh(brand_voice)
        return brand_voice
