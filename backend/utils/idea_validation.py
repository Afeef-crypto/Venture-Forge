"""Heuristic classification for startup-idea inputs before LLM evaluation."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

IdeaCategory = Literal[
    "startup",
    "question",
    "instruction",
    "chat",
    "gibberish",
    "code_only",
    "homework",
    "empty_meaning",
]

_STARTUP_SIGNALS = re.compile(
    r"\b("
    r"app|platform|saas|startup|product|mvp|marketplace|tool|service|software|"
    r"subscription|founders?|customers?|users?|revenue|b2b|b2c|monetiz|freemium|"
    r"api|mobile|web\s*app|on-?demand|fintech|healthtech|edtech|proptech|"
    r"automate|analytics|pitch|venture|business\s+model|go-?to-?market|"
    r"solve[sd]?|help(s|ing)?\s+\w+\s+(with|to)|uber\s+for|airbnb\s+for"
    r")\b",
    re.IGNORECASE,
)

_QUESTION_START = re.compile(
    r"^\s*(what|how|why|when|where|who|which|can\s+you|could\s+you|would\s+you|"
    r"please\s+(tell|explain|help|write|generate|create|summarize|translate)|"
    r"tell\s+me|explain|describe|define)\b",
    re.IGNORECASE,
)

_INSTRUCTION_PATTERNS = re.compile(
    r"\b("
    r"ignore\s+(all\s+)?(previous|prior|above)\s+(rules|instructions|prompts)|"
    r"forget\s+(your|all)\s+(rules|instructions)|"
    r"pretend\s+you\s+are|act\s+as\s+(?!a\s+startup)|role\s*play|"
    r"disregard\s+(the\s+)?(system|previous)|"
    r"output\s+(only\s+)?(markdown|html|xml|python|code)|"
    r"jailbreak|dan\s+mode|developer\s+mode"
    r")\b",
    re.IGNORECASE,
)

_CHAT_PATTERNS = re.compile(
    r"^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|how\s+are\s+you|"
    r"what'?s\s+up|thanks|thank\s+you)\b",
    re.IGNORECASE,
)

_HOMEWORK_PATTERNS = re.compile(
    r"\b(essay|homework|assignment|exam|thesis|dissertation|"
    r"for\s+my\s+(class|course|school|college|university))\b",
    re.IGNORECASE,
)

_CODE_HEAVY = re.compile(
    r"(```|def\s+\w+\s*\(|function\s+\w+\s*\(|import\s+\w+|class\s+\w+\s*:|"
    r"#include\s*<|public\s+static\s+void|console\.log\()",
    re.IGNORECASE,
)

_LOREM_IPSUM = re.compile(r"\blorem\s+ipsum\b", re.IGNORECASE)
_KEYBOARD_MASH = re.compile(
    r"\b(qwerty|asdfgh|zxcvbn|qazwsx|keyboard|mash|lorem|ipsum)\b",
    re.IGNORECASE,
)

_WORD_RE = re.compile(r"[a-zA-Z]{2,}")


@dataclass(frozen=True)
class IdeaClassification:
    is_evaluable: bool
    category: IdeaCategory
    reason: str


def _gibberish_score(text: str) -> float:
    """Return 0–1 likelihood that text is meaningless noise."""
    words = _WORD_RE.findall(text.lower())
    if not words:
        return 1.0

    if _LOREM_IPSUM.search(text) or _KEYBOARD_MASH.search(text):
        return 0.95

    # Mostly consonant-heavy tokens typical of keyboard mashing
    consonant_heavy = sum(
        1 for w in words if len(w) >= 5 and not re.search(r"[aeiou]", w)
    ) / len(words)
    if consonant_heavy >= 0.6 and len(words) >= 4:
        return 0.8

    unique_ratio = len(set(words)) / len(words)
    avg_len = sum(len(w) for w in words) / len(words)

    # Repeated keyboard mash or single-token spam
    if len(words) <= 3 and unique_ratio < 0.5:
        return 0.85

    # Very low lexical diversity with no long words suggests noise
    if unique_ratio < 0.35 and avg_len < 5 and len(words) >= 4:
        return 0.8

    vowel_poor = sum(1 for w in words if not re.search(r"[aeiou]", w)) / len(words)
    if vowel_poor > 0.6 and len(words) >= 5:
        return 0.75

    return 0.0


def _has_startup_signals(text: str) -> bool:
    return bool(_STARTUP_SIGNALS.search(text))


def classify_idea(text: str) -> IdeaClassification:
    """
    Classify user input before calling evaluators.

    Conservative: only mark clearly non-ideas as invalid. Thin or vague pitches
    still pass through so agents can score them low with guardrails.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return IdeaClassification(
            is_evaluable=False,
            category="empty_meaning",
            reason="Input is empty.",
        )

    if _has_startup_signals(cleaned):
        # Mixed jailbreak + real idea → let agents evaluate; guardrails ignore injection
        if not _INSTRUCTION_PATTERNS.search(cleaned):
            return IdeaClassification(
                is_evaluable=True,
                category="startup",
                reason="Contains describable product or business signals.",
            )
        return IdeaClassification(
            is_evaluable=True,
            category="startup",
            reason="Contains business signals; embedded instructions will be ignored by agents.",
        )

    if _INSTRUCTION_PATTERNS.search(cleaned):
        return IdeaClassification(
            is_evaluable=False,
            category="instruction",
            reason="Input is a meta-instruction or prompt injection, not a startup idea.",
        )

    if _CHAT_PATTERNS.match(cleaned) and len(cleaned) < 120:
        return IdeaClassification(
            is_evaluable=False,
            category="chat",
            reason="Input is casual conversation, not a startup or product description.",
        )

    if _HOMEWORK_PATTERNS.search(cleaned) and not _has_startup_signals(cleaned):
        return IdeaClassification(
            is_evaluable=False,
            category="homework",
            reason="Input reads as academic or homework content, not a venture pitch.",
        )

    code_matches = len(_CODE_HEAVY.findall(cleaned))
    word_count = len(_WORD_RE.findall(cleaned))
    if code_matches >= 2 or (code_matches >= 1 and word_count < 15):
        return IdeaClassification(
            is_evaluable=False,
            category="code_only",
            reason="Input is primarily code or technical snippet without a product or business concept.",
        )

    is_question = cleaned.endswith("?") or bool(_QUESTION_START.match(cleaned))
    if is_question:
        return IdeaClassification(
            is_evaluable=False,
            category="question",
            reason="Input is a general question, not a describable startup idea.",
        )

    if _gibberish_score(cleaned) >= 0.7:
        return IdeaClassification(
            is_evaluable=False,
            category="gibberish",
            reason="Input appears to be gibberish or placeholder text, not a business idea.",
        )

    # Vague but might be a thin pitch — let agents decide
    return IdeaClassification(
        is_evaluable=True,
        category="startup",
        reason="No strong non-idea signals; defer to specialist evaluators.",
    )
