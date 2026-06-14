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
    "founder_docs",
    "insufficient",
    "irrelevant",
]

# --- Venture substance (problem + product + customer) ---

_PROBLEM_SIGNALS = re.compile(
    r"\b("
    r"problem|pain\s*point|struggle|frustrat|unmet\s+need|need\s+for|lack\s+of|"
    r"challenge|bottleneck|inefficien|waste[s]?|difficult\s+to|hard\s+to|"
    r"without\s+a\s+way\s+to|currently\s+have\s+to"
    r")\b",
    re.IGNORECASE,
)

_SOLUTION_SIGNALS = re.compile(
    r"\b("
    r"we\s+(are\s+)?(building|making|creating|developing|launching)|"
    r"our\s+(product|platform|app|service|tool|software|solution)|"
    r"build(s|ing)?\s+a|platform\s+(that|helping)|app\s+(that|for)|mobile\s+app|web\s+app|"
    r"tool\s+that|software\s+that|fintech\s+app|"
    r"automate[s|d|ing]?|enable[s|d|ing]?|help(s|ing)?\s+\w+\s+(to|with|find)|"
    r"mvp\b|prototype|saas|marketplace|uber\s+for|airbnb\s+for|on-?demand"
    r")\b",
    re.IGNORECASE,
)

_CUSTOMER_SIGNALS = re.compile(
    r"\b("
    r"customers?|users?|buyers?|clients?|subscribers?|"
    r"students|developers|devs|businesses|teams|professionals|"
    r"owners|walkers|drivers|freelancers|consumers?|patients|"
    r"target\s+(market|audience|customer|user)|icp\b|persona|"
    r"b2b|b2c|indie\s+game|mid-?market|neighborhood"
    r")\b",
    re.IGNORECASE,
)

_MARKET_SIGNALS = re.compile(
    r"\b("
    r"market|industry|sector|vertical|tam|sam|som|"
    r"revenue|monetiz|pricing|subscription|go-?to-?market|gtm"
    r")\b",
    re.IGNORECASE,
)

_STARTUP_SIGNALS = re.compile(
    r"\b("
    r"startup|venture|pitch|business\s+model|product-?market|"
    r"freemium|on-?demand|fintech|healthtech|edtech|proptech|"
    r"uber\s+for|airbnb\s+for"
    r")\b",
    re.IGNORECASE,
)

_PRODUCT_DESCRIPTION = re.compile(
    r"\b("
    r"what\s+.*\s+company\s+going\s+to\s+make|product\s+description|"
    r"describe\s+what\s+your\s+company|one\s+sentence\s+(explanation|description)|"
    r"we\s+(are\s+)?(building|making|creating)|our\s+(product|platform|app)"
    r")\b",
    re.IGNORECASE,
)

# --- Non-venture / irrelevant document patterns ---

_CAP_TABLE = re.compile(
    r"\b("
    r"equity\s+(allocation|split|structure|distribution)|cap\s*table|"
    r"ownership\s+(split|percentage|structure)|founder\s+equity|vesting\s+schedule|"
    r"percentage\s+of\s+equity|equity\s+stake|split\s+equity"
    r")\b",
    re.IGNORECASE,
)

_IRRELEVANT_DOC = re.compile(
    r"\b("
    r"resume|curriculum\s+vitae|\bcv\b|cover\s+letter|"
    r"dear\s+(sir|madam|hiring\s+manager)|job\s+description|"
    r"terms\s+and\s+conditions|privacy\s+policy|legal\s+notice|"
    r"invoice\s+#|receipt\s+for|purchase\s+order|"
    r"meeting\s+minutes|agenda:|attendees:|"
    r"chapter\s+\d+|abstract:|bibliography|"
    r"ingredients:|preheat\s+oven|tablespoon|"
    r"prescription|diagnosis|patient\s+history|"
    r"unsubscribe\s+from|click\s+here\s+to\s+view\s+in\s+browser"
    r")\b",
    re.IGNORECASE,
)

_FORM_ONLY = re.compile(
    r"\b("
    r"founder\s+name|email\s+address|phone\s+number|linkedin\s+url|"
    r"date\s+of\s+birth|citizenship|work\s+authorization|"
    r"how\s+did\s+you\s+hear\s+about|referr(ed|al)\s+by"
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
    words = _WORD_RE.findall(text.lower())
    if not words:
        return 1.0

    if _LOREM_IPSUM.search(text) or _KEYBOARD_MASH.search(text):
        return 0.95

    consonant_heavy = sum(
        1 for w in words if len(w) >= 5 and not re.search(r"[aeiou]", w)
    ) / len(words)
    if consonant_heavy >= 0.6 and len(words) >= 4:
        return 0.8

    unique_ratio = len(set(words)) / len(words)
    avg_len = sum(len(w) for w in words) / len(words)

    if len(words) <= 3 and unique_ratio < 0.5:
        return 0.85

    if unique_ratio < 0.35 and avg_len < 5 and len(words) >= 4:
        return 0.8

    vowel_poor = sum(1 for w in words if not re.search(r"[aeiou]", w)) / len(words)
    if vowel_poor > 0.6 and len(words) >= 5:
        return 0.75

    return 0.0


def _venture_substance_score(text: str) -> int:
    """Count how many venture dimensions are present (0–4)."""
    score = 0
    if _PROBLEM_SIGNALS.search(text):
        score += 1
    if _SOLUTION_SIGNALS.search(text):
        score += 1
    if _CUSTOMER_SIGNALS.search(text):
        score += 1
    if _MARKET_SIGNALS.search(text) or _PRODUCT_DESCRIPTION.search(text):
        score += 1
    return score


def _word_count(text: str) -> int:
    return len(_WORD_RE.findall(text))


def _reject_insufficient(text: str, reason: str) -> IdeaClassification:
    return IdeaClassification(
        is_evaluable=False,
        category="insufficient",
        reason=reason,
    )


def classify_idea(text: str) -> IdeaClassification:
    """
    Classify user input before calling evaluators.

    Rejects anything that is clearly not a startup pitch or lacks enough
    product/customer/problem substance. Thin but genuine one-liner pitches
    may still pass with substance score >= 2, or 1 dimension in >= 20 words.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return IdeaClassification(
            is_evaluable=False,
            category="empty_meaning",
            reason="Input is empty.",
        )

    words = _word_count(cleaned)
    substance = _venture_substance_score(cleaned)
    has_product = bool(
        _SOLUTION_SIGNALS.search(cleaned) or _PRODUCT_DESCRIPTION.search(cleaned)
    )

    # --- Hard rejects: never evaluable ---

    if _INSTRUCTION_PATTERNS.search(cleaned) and substance < 2 and not has_product:
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

    if _HOMEWORK_PATTERNS.search(cleaned) and substance < 2:
        return IdeaClassification(
            is_evaluable=False,
            category="homework",
            reason="Input reads as academic or homework content, not a venture pitch.",
        )

    code_matches = len(_CODE_HEAVY.findall(cleaned))
    if (code_matches >= 2 or (code_matches >= 1 and words < 15)) and substance < 2:
        return IdeaClassification(
            is_evaluable=False,
            category="code_only",
            reason="Input is primarily code or technical snippet without a product or business concept.",
        )

    is_question = cleaned.endswith("?") or bool(_QUESTION_START.match(cleaned))
    if is_question and substance < 2:
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

    # --- Irrelevant document types ---

    if _IRRELEVANT_DOC.search(cleaned) and substance < 2:
        return IdeaClassification(
            is_evaluable=False,
            category="irrelevant",
            reason="Input looks like a resume, legal text, recipe, or other document unrelated to a startup idea.",
        )

    if _CAP_TABLE.search(cleaned) and substance < 2:
        return IdeaClassification(
            is_evaluable=False,
            category="founder_docs",
            reason=(
                "Input describes equity, ownership, or cap table details without a clear "
                "product, customer, or problem — not an evaluable startup idea."
            ),
        )

    # Application / form dumps: many metadata fields, no product substance
    form_hits = len(_FORM_ONLY.findall(cleaned))
    if form_hits >= 3 and substance < 2:
        return _reject_insufficient(
            cleaned,
            "Input reads as application form metadata (names, contact info) without describing "
            "what you are building, for whom, or what problem you solve.",
        )

    # Long documents that mention startup keywords but lack venture substance
    if words >= 150 and substance < 2:
        return _reject_insufficient(
            cleaned,
            "Document is long but lacks a clear product description, target customer, and problem statement.",
        )

    # Medium documents with weak substance
    if words >= 60 and substance < 1:
        return _reject_insufficient(
            cleaned,
            "Input does not describe a product, service, customer, or market — insufficient for evaluation.",
        )

    # Very short blurbs with no venture signals at all
    if words < 12 and substance == 0 and not _STARTUP_SIGNALS.search(cleaned):
        return _reject_insufficient(
            cleaned,
            "Input is too vague. Describe what you are building, who it is for, and what problem it solves.",
        )

    # --- Pass: enough substance for evaluation ---

    if substance >= 2:
        return IdeaClassification(
            is_evaluable=True,
            category="startup",
            reason="Describes product, customer, and/or problem with enough detail to evaluate.",
        )

    # Thin one-liner with at least one clear dimension
    if substance >= 1 and words >= 15:
        return IdeaClassification(
            is_evaluable=True,
            category="startup",
            reason="Thin pitch with some venture signals; specialist evaluators will assess further.",
        )

    # Explicit startup framing with minimal text
    if substance >= 1 and words >= 12 and (_STARTUP_SIGNALS.search(cleaned) or has_product):
        return IdeaClassification(
            is_evaluable=True,
            category="startup",
            reason="Contains a describable product or venture concept.",
        )

    return _reject_insufficient(
        cleaned,
        "Input lacks sufficient relevance to a startup idea. Submit a pitch describing "
        "what you are building, who the customer is, and what problem you solve.",
    )
