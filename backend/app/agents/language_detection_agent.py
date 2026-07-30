from __future__ import annotations

import re
from typing import NamedTuple


class LanguageResult(NamedTuple):
    language: str
    confidence: float
    language_code: str


_LANGUAGE_MAP: dict[str, tuple[str, str]] = {
    "en": ("English", "en"),
    "ur": ("Urdu", "ur"),
    "ar": ("Arabic", "ar"),
    "es": ("Spanish", "es"),
    "fr": ("French", "fr"),
    "de": ("German", "de"),
    "hi": ("Hindi", "hi"),
    "pt": ("Portuguese", "pt"),
    "zh": ("Chinese", "zh"),
    "ja": ("Japanese", "ja"),
    "ko": ("Korean", "ko"),
    "it": ("Italian", "it"),
    "ru": ("Russian", "ru"),
    "tr": ("Turkish", "tr"),
    "nl": ("Dutch", "nl"),
}


_UNICODE_RANGES: dict[str, tuple[str, str, str]] = {
    "ar": ("Arabic", "ar", r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]"),
    "ur": ("Urdu", "ur", r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]"),
    "hi": ("Hindi", "hi", r"[\u0900-\u097F]"),
    "zh": ("Chinese", "zh", r"[\u4E00-\u9FFF\u3400-\u4DBF]"),
    "ja": ("Japanese", "ja", r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]"),
    "ko": ("Korean", "ko", r"[\uAC00-\uD7AF\u1100-\u11FF]"),
    "ru": ("Russian", "ru", r"[\u0400-\u04FF]"),
}


class LanguageDetectionAgent:
    async def detect(self, text: str) -> LanguageResult:
        if not text or not text.strip():
            return LanguageResult(language="Unknown", confidence=0.0, language_code="unknown")

        text = text.strip()

        try:
            from langdetect import detect as langdetect_detect
            from langdetect import DetectorFactory, lang_detect_exception

            DetectorFactory.seed = 42
            try:
                code = langdetect_detect(text)
                lang_info = _LANGUAGE_MAP.get(code)
                if lang_info:
                    return LanguageResult(
                        language=lang_info[0],
                        confidence=0.95,
                        language_code=lang_info[1],
                    )
                return LanguageResult(
                    language=code.capitalize(),
                    confidence=0.8,
                    language_code=code,
                )
            except lang_detect_exception.LangDetectException:
                pass
        except ImportError:
            pass

        script_scores: dict[str, int] = {}
        for code, (name, lang_code, pattern) in _UNICODE_RANGES.items():
            matches = len(re.findall(pattern, text))
            if matches > 0:
                script_scores[code] = script_scores.get(code, 0) + matches

        if script_scores:
            best = max(script_scores, key=script_scores.get)
            total_chars = sum(script_scores.values())
            ratio = script_scores[best] / len(text)
            lang_info = _LANGUAGE_MAP.get(best)
            if lang_info and ratio > 0.15:
                return LanguageResult(
                    language=lang_info[0],
                    confidence=round(min(ratio, 0.99), 2),
                    language_code=lang_info[1],
                )

        latin_chars = len(re.findall(r"[a-zA-Z]", text))
        if latin_chars > len(text) * 0.3:
            common_en = {
                "the", "and", "for", "are", "but", "not", "you", "all", "can",
                "had", "her", "was", "one", "our", "out", "has", "have", "been",
                "some", "very", "good", "great", "amazing", "excellent", "service",
                "food", "place", "love", "would", "could", "should", "their",
            }
            words = set(re.findall(r"[a-zA-Z]+", text.lower()))
            en_overlap = len(words & common_en)
            if en_overlap > 2:
                return LanguageResult(
                    language="English", confidence=0.75, language_code="en"
                )
            common_es = {
                "que", "los", "las", "una", "por", "para", "con", "del",
                "como", "más", "pero", "sus", "era", "entre", "todo",
            }
            es_overlap = len(words & common_es)
            if es_overlap > 2:
                return LanguageResult(
                    language="Spanish", confidence=0.7, language_code="es"
                )
            common_fr = {
                "les", "des", "pour", "dans", "avec", "sur", "tout", "plus",
                "fait", "faire", "bien", "tres", "merci", "bon",
            }
            fr_overlap = len(words & common_fr)
            if fr_overlap > 2:
                return LanguageResult(
                    language="French", confidence=0.7, language_code="fr"
                )
            common_de = {
                "die", "der", "das", "und", "mit", "auf", "für", "nicht",
                "sind", "sehr", "gut", "eine", "auch", "danke",
            }
            de_overlap = len(words & common_de)
            if de_overlap > 2:
                return LanguageResult(
                    language="German", confidence=0.7, language_code="de"
                )

            return LanguageResult(
                language="English", confidence=0.5, language_code="en"
            )

        return LanguageResult(
            language="Unknown", confidence=0.0, language_code="unknown"
        )
