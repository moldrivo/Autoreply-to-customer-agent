from __future__ import annotations

import json
import logging
import re
from typing import Any, NamedTuple, Optional

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class QualityResult(NamedTuple):
    overall_score: float
    weighted_score: float
    breakdown: dict[str, float]
    passes_threshold: bool
    feedback: dict[str, str] = {}
    needs_regeneration: bool = False


_PLATFORM_CHAR_LIMITS = {
    "google": {"min": 50, "max": 300},
    "yelp": {"min": 100, "max": 500},
    "trustpilot": {"min": 80, "max": 400},
    "facebook": {"min": 30, "max": 200},
    "default": {"min": 50, "max": 500},
}

_PLATFORM_MAX_WORDS = {
    "google": 80,
    "yelp": 120,
    "trustpilot": 100,
    "facebook": 50,
    "default": 120,
}

_INDUSTRY_SPECIFIC_CHECKS = {
    "healthcare": {
        "check": r"\b(consult your physician|seek medical advice|not medical advice|disclaimer|consult a healthcare professional)\b",
        "note": "Healthcare replies must include a disclaimer to consult a healthcare provider",
        "required": True,
    },
    "legal": {
        "check": r"\b(not legal advice|consult an attorney|for informational purposes only|seek legal counsel)\b",
        "note": "Legal replies must avoid providing legal advice and include a disclaimer",
        "required": True,
    },
    "financial": {
        "check": r"\b(not financial advice|consult a financial advisor|for informational purposes|seek professional financial advice)\b",
        "note": "Financial replies must avoid guarantees and include a financial disclaimer",
        "required": True,
    },
}

_WEIGHTS = {
    "empathy": 0.15,
    "brand_consistency": 0.15,
    "policy_compliance": 0.15,
    "grammar": 0.10,
    "professionalism": 0.10,
    "context_relevance": 0.10,
    "personalization": 0.10,
    "actionability": 0.05,
    "conciseness": 0.05,
    "repetition_penalty": 0.05,
}

_EVALUATION_SYSTEM_PROMPT = """You are a quality evaluation expert for customer service replies to online reviews.

Evaluate the generated reply across these dimensions, scoring each 0-100:

1. grammar (weight: 0.9): Grammar, spelling, punctuation correctness
2. brand_consistency (weight: 1.1): How well the reply matches the brand tone, style, and guidelines
3. professionalism (weight: 1.0): Level of professional conduct and courtesy
4. empathy (weight: 1.5): Degree of understanding and genuine empathy shown toward the customer. Does the reply validate their feelings?
5. context_relevance (weight: 1.3): How well the reply addresses the specific details and concerns in the review. Does it show the customer was actually heard?
6. policy_compliance (weight: 1.4): Adherence to safety rules (no liability admission, no unauthorized promises, no PII sharing)
7. personalization (weight: 1.3): How personalized the reply is vs. generic template. Does it use customer name, reference specifics?
8. actionability (weight: 1.2): Does the reply provide a clear path forward or next step for the customer?
9. conciseness (weight: 0.9): Is the reply appropriately concise without being curt? Proper length for the platform.
10. repetition_penalty (weight: 0.8): Inverse measure of repetitiveness. 100 = completely original, 0 = fully template/generic.

Return a JSON object with:
{
  "scores": {
    "grammar": <0-100>,
    "brand_consistency": <0-100>,
    "professionalism": <0-100>,
    "empathy": <0-100>,
    "context_relevance": <0-100>,
    "policy_compliance": <0-100>,
    "personalization": <0-100>,
    "actionability": <0-100>,
    "conciseness": <0-100>,
    "repetition_penalty": <0-100>
  },
  "overall_score": <0-100>,
  "feedback": {
    "strengths": "<2-3 sentences on what the reply does well>",
    "weaknesses": "<2-3 sentences on areas needing improvement>",
    "suggestions": "<2-3 concrete suggestions to improve the reply>"
  }
}

IMPORTANT: The overall_score will be calculated as a weighted average server-side. Provide individual scores honestly.
"""


class QualityEvaluationAgent:
    def __init__(self, openai_client: Optional[AsyncOpenAI] = None) -> None:
        self.client = openai_client or AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def evaluate(
        self,
        reply_text: str,
        review: Any,
        brand: Any,
        context: str,
    ) -> QualityResult:
        word_count = len(reply_text.split())
        platform = getattr(review, "platform", "default") if hasattr(review, "platform") else "default"
        industry = getattr(brand, "industry", None) or "General"
        if hasattr(brand, "tone"):
            industry = getattr(getattr(brand, "business", None), "industry", None) or "General"

        user_prompt = (
            f"REVIEW:\nRating: {review.rating}/5\n"
            f"Platform: {platform}\n"
            f"Industry: {industry}\n"
            f"Content: {review.content[:1000]}\n\n"
            f"GENERATED REPLY:\n{reply_text[:1500]}\n\n"
            f"BRAND CONTEXT:\n{context[:1000]}"
        )

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": _EVALUATION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=500,
            )

            raw = response.choices[0].message.content or ""
            data = json.loads(raw)

            scores_raw = data.get("scores", {})
            feedback_raw = data.get("feedback", {})

            breakdown = {
                "grammar": float(scores_raw.get("grammar", 80)),
                "brand_consistency": float(scores_raw.get("brand_consistency", 80)),
                "professionalism": float(scores_raw.get("professionalism", 80)),
                "empathy": float(scores_raw.get("empathy", 80)),
                "policy_compliance": float(scores_raw.get("policy_compliance", 80)),
                "context_relevance": float(scores_raw.get("context_relevance", 80)),
                "personalization": float(scores_raw.get("personalization", 60)),
                "actionability": float(scores_raw.get("actionability", 60)),
                "conciseness": float(scores_raw.get("conciseness", 80)),
                "repetition_penalty": float(scores_raw.get("repetition_penalty", 80)),
            }

            total_weight = sum(_WEIGHTS.values())
            overall = sum(
                breakdown[k] * _WEIGHTS.get(k, 1.0) for k in breakdown
            ) / total_weight

            # Platform-appropriate length validation
            max_words = _PLATFORM_MAX_WORDS.get(platform.lower(), _PLATFORM_MAX_WORDS["default"])
            if word_count > max_words:
                length_penalty = min(20, (word_count - max_words) / max_words * 15)
                breakdown["conciseness"] = max(0, breakdown["conciseness"] - length_penalty)

            # Industry-specific checks
            industry_lower = industry.lower()
            for ind_key, ind_check in _INDUSTRY_SPECIFIC_CHECKS.items():
                if ind_key in industry_lower and ind_check["required"]:
                    if not re.search(ind_check["check"], reply_text, re.IGNORECASE):
                        breakdown["policy_compliance"] = max(0, breakdown["policy_compliance"] - 20)

            overall = round(min(max(overall, 0), 100), 2)
            breakdown = {k: round(min(max(v, 0), 100), 2) for k, v in breakdown.items()}

            threshold = settings.AI_QUALITY_THRESHOLD * 100
            passes = overall >= threshold
            needs_regeneration = overall < (threshold - 10)

            feedback = {}
            if isinstance(feedback_raw, dict):
                feedback = {
                    "strengths": str(feedback_raw.get("strengths", "")),
                    "weaknesses": str(feedback_raw.get("weaknesses", "")),
                    "suggestions": str(feedback_raw.get("suggestions", "")),
                }
            elif isinstance(feedback_raw, str):
                feedback = {"general": feedback_raw}

            return QualityResult(
                overall_score=overall,
                breakdown=breakdown,
                passes_threshold=passes,
                feedback=feedback,
                needs_regeneration=needs_regeneration,
            )

        except Exception as exc:
            logger.warning("Quality evaluation failed: %s", exc)

            fallback_score = 50.0
            breakdown = {
                "grammar": fallback_score,
                "brand_consistency": fallback_score,
                "professionalism": fallback_score,
                "empathy": fallback_score,
                "policy_compliance": fallback_score,
                "context_relevance": fallback_score,
                "personalization": fallback_score,
                "actionability": fallback_score,
                "conciseness": fallback_score,
                "repetition_penalty": fallback_score,
            }

            return QualityResult(
                overall_score=fallback_score,
                breakdown=breakdown,
                passes_threshold=fallback_score >= settings.AI_QUALITY_THRESHOLD * 100,
                feedback={"error": "Quality evaluation API failed, using fallback scores"},
                needs_regeneration=False,
            )
