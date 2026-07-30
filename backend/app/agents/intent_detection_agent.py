from __future__ import annotations

import json
import logging
from typing import Any, NamedTuple, Optional

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class IntentResult(NamedTuple):
    intent: str
    confidence: float
    reasoning: str
    sub_intent: str
    urgency: str


_INTENT_CATEGORIES = {
    "complaint": "Customer reporting a problem or expressing dissatisfaction",
    "refund_request": "Customer asking for money back or compensation",
    "support_inquiry": "Customer asking for help, troubleshooting, or technical support",
    "feedback": "Customer providing suggestions or general feedback",
    "appreciation": "Customer expressing gratitude or praise",
    "general_inquiry": "Customer asking general questions about products or services",
    "cancellation": "Customer requesting to cancel a subscription or order",
    "feature_request": "Customer requesting a new feature or improvement",
    "partnership": "Business inquiry about partnership, collaboration, or sales",
    "spam": "Unsolicited promotional or irrelevant content",
}

_SUB_INTENTS: dict[str, list[str]] = {
    "complaint": ["late_delivery", "product_defect", "poor_service", "billing_issue", "quality_concern", "damaged_item", "wrong_item"],
    "refund_request": ["full_refund", "partial_refund", "exchange", "store_credit", "chargeback_threat"],
    "support_inquiry": ["account_help", "technical_issue", "how_to", "order_status", "shipping_query"],
    "feedback": ["positive_feedback", "constructive_feedback", "suggestion", "improvement_idea"],
    "appreciation": ["thank_you", "praise", "testimonial"],
    "general_inquiry": ["pricing", "availability", "features", "comparison", "recommendation"],
    "cancellation": ["subscription_cancel", "order_cancel", "service_termination"],
    "feature_request": ["new_feature", "integration", "enhancement", "usability"],
    "partnership": ["collaboration", "reseller", "affiliate", "media"],
    "spam": ["promotion", "irrelevant", "bot", "phishing"],
}

_URGENCY_LEVELS = ["low", "medium", "high", "critical"]

_SYSTEM_PROMPT = """You are an intent classification expert. Analyze the given customer message and classify its primary intent.

Categories:
{intents}

For each intent, also select the most specific sub-intent from the provided list.
Then assign an urgency level: low, medium, high, or critical.

Rules:
- If the customer is asking for a refund or money back → refund_request
- If the customer is reporting a problem with a product/service → complaint
- If the customer is asking for help or information → support_inquiry or general_inquiry
- If the customer is praising or thanking → appreciation
- If the customer provides suggestions or opinions → feedback
- If the customer asks to stop a subscription → cancellation
- If the customer proposes a new capability → feature_request
- If the customer represents another business → partnership
- If the message is promotional or irrelevant → spam

Return a JSON object with:
{{
  "intent": "<category>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>",
  "sub_intent": "<most specific sub-intent>",
  "urgency": "<low|medium|high|critical>"
}}
"""


class IntentDetectionAgent:
    def __init__(self, openai_client: Optional[AsyncOpenAI] = None) -> None:
        self.client = openai_client or AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    def _build_system_prompt(self) -> str:
        intent_descriptions = "\n".join(
            f"- {key}: {desc}" for key, desc in _INTENT_CATEGORIES.items()
        )
        return _SYSTEM_PROMPT.format(intents=intent_descriptions)

    def _normalize_intent(self, intent: str) -> str:
        valid = set(_INTENT_CATEGORIES.keys())
        if intent in valid:
            return intent
        for key in valid:
            if key in intent or intent in key:
                return key
        return "general_inquiry"

    def _normalize_sub_intent(self, intent: str, sub_intent: str) -> str:
        valid = _SUB_INTENTS.get(intent, [])
        if not valid:
            return "general"
        if sub_intent in valid:
            return sub_intent
        return valid[0]

    def _normalize_urgency(self, urgency: str) -> str:
        if urgency in _URGENCY_LEVELS:
            return urgency
        return "medium"

    async def detect(
        self,
        message: str,
        subject: Optional[str] = None,
        platform: Optional[str] = None,
        rating: Optional[int] = None,
    ) -> IntentResult:
        context_parts = []
        if subject:
            context_parts.append(f"Subject: {subject}")
        if platform:
            context_parts.append(f"Platform: {platform}")
        if rating is not None:
            context_parts.append(f"Rating: {rating}/5")
        context_str = "\n".join(context_parts)

        user_prompt = f"{context_str}\n\nMessage:\n{message[:3000]}"

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": self._build_system_prompt()},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=250,
            )

            raw = response.choices[0].message.content or ""
            data = json.loads(raw)

            intent = self._normalize_intent(data.get("intent", "general_inquiry"))
            confidence = float(data.get("confidence", 0.5))
            reasoning = data.get("reasoning", "")
            sub_intent = self._normalize_sub_intent(intent, data.get("sub_intent", "general"))
            urgency = self._normalize_urgency(data.get("urgency", "medium"))

            return IntentResult(
                intent=intent,
                confidence=min(max(confidence, 0.0), 1.0),
                reasoning=reasoning,
                sub_intent=sub_intent,
                urgency=urgency,
            )

        except Exception as exc:
            logger.warning("OpenAI intent detection failed: %s", exc)

            return IntentResult(
                intent="general_inquiry",
                confidence=0.4,
                reasoning=f"Fallback: intent detection unavailable ({exc})",
                sub_intent="general",
                urgency="medium",
            )
