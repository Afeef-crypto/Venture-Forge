"""Calibrate Business CFO financial fields to realistic market ranges by segment."""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class _Segment:
    id: str
    label: str
    cac_max: float
    ltv_max: float
    burn_max: float
    investment_max: float
    cac: str
    ltv: str
    burn: str
    investment: str
    break_even: str
    revenue_model: str


def _product_label(idea: str) -> str:
    line = (idea or "").strip().split("\n")[0].strip()
    line = re.sub(r"^(y combinator application|company name|startup idea)[:\s-]*", "", line, flags=re.I)
    token = re.split(r"[\s\-—|]", line)[0].strip()
    if len(token) >= 2 and len(token) <= 40:
        return token
    return "this product"


def _parse_dollars(text: str) -> list[float]:
    if not text:
        return []
    values: list[float] = []
    for m in re.finditer(r"\$\s*([\d,]+(?:\.\d+)?)\s*([kKmM])?", text):
        num = float(m.group(1).replace(",", ""))
        suffix = (m.group(2) or "").lower()
        if suffix == "k":
            num *= 1_000
        elif suffix == "m":
            num *= 1_000_000
        values.append(num)
    return values


def _range_high(text: str) -> float:
    nums = _parse_dollars(text)
    return max(nums) if nums else 0.0


def _detect_segment(idea: str) -> _Segment:
    t = (idea or "").lower()

    if any(
        w in t
        for w in (
            "student",
            "edtech",
            "university",
            "campus",
            "semester",
            "study",
            "learning",
            "course",
            "exam",
            "school",
            "education",
            "professor",
        )
    ):
        return _EDTECH

    if any(w in t for w in ("marketplace", "two-sided", "buyers and sellers", "gig economy", "on-demand")):
        return _MARKETPLACE

    if any(
        w in t
        for w in (
            "enterprise",
            "mid-market",
            "mid market",
            "$1,000/mo",
            "1000/mo",
            "sales-led",
            "account executive",
        )
    ):
        return _B2B_MID

    if any(
        w in t
        for w in (
            "b2b",
            "saas",
            "teams",
            "businesses",
            "workflow",
            "api",
            "developers",
            "devtool",
            "infrastructure",
            "platform for",
        )
    ):
        if any(w in t for w in ("llm", "ai ", "openai", "inference", "model router", "agent")):
            return _AI_B2B
        return _B2B_SMB

    if any(w in t for w in ("consumer", "mobile app", "freemium", "b2c", "users download")):
        return _B2C

    return _B2C


_EDTECH = _Segment(
    id="edtech",
    label="B2C EdTech / student tool",
    cac_max=150.0,
    ltv_max=350.0,
    burn_max=55_000.0,
    investment_max=250_000.0,
    revenue_model=(
        "Freemium → paid subscription ($6–15/mo or $25–45/semester) for {product}, sold to individual "
        "students (not district-wide contracts at MVP). Tier by AI usage caps, exam-prep packs, or "
        "premium content. Expansion: campus licenses ($2–8k/yr per department) after proving retention on one campus."
    ),
    cac=(
        "$20–$75 per paying student (blended): $12–35 via campus ambassadors, Discord/TikTok, and "
        "professor referrals; $50–120 for paid social during exam windows only. Assumptions: 3–8% "
        "free-to-paid, strong seasonality. Payback: 8–14 months at $8–12/mo ARPU. LTV:CAC ≈ 2.5–4:1."
    ),
    ltv=(
        "$45–$140 lifetime gross profit over ~6–9 active months (2–3 semesters): $8–12/mo ARPU, 65–70% "
        "gross margin after inference/support, 6–10% monthly churn in-term (higher between semesters). "
        "Not $500+ CAC or $1k+ LTV unless selling institutional site licenses."
    ),
    burn=(
        "$12,000–$28,000/mo pre-seed: 2–4 people ($8–18k), $1–3k cloud/ML inference, $1–4k campus "
        "marketing, $0.5–1.5k tools. A 10+ person team requires $70k+/mo — do not model 15 FTE on $40k burn."
    ),
    investment=(
        "$70,000–$180,000: MVP build ($25–55k) plus 6–9 months runway at $12–22k/mo. Campus pilot before scale."
    ),
    break_even=(
        "Roughly 700–2,000 paying students at $8–12/mo with 65% GM, or 30–80 annual campus/department "
        "licenses at $2–5k — typically 18–30 months from first paid pilot."
    ),
)

_B2C = _Segment(
    id="b2c",
    label="B2C consumer / freemium app",
    cac_max=180.0,
    ltv_max=250.0,
    burn_max=45_000.0,
    investment_max=200_000.0,
    revenue_model=(
        "Freemium or subscription for {product}: $5–20/mo consumer tier with optional annual plan. "
        "Monetize repeat use cases; avoid enterprise pricing at MVP."
    ),
    cac=(
        "$10–$45 organic (referral, community, ASO); $35–120 paid social/search per paying user. "
        "Payback target 6–12 months. LTV:CAC ≥ 3:1 at scale."
    ),
    ltv=(
        "$30–$160 lifetime gross profit over 12–18 months: $6–15/mo ARPU, 60–75% GM, 5–8% monthly churn."
    ),
    burn=(
        "$8,000–$32,000/mo: 1–3 FTE ($6–20k), $1–4k infra, $1–6k growth tests, $0.5–1k tools."
    ),
    investment=(
        "$40,000–$120,000 for MVP plus 6–9 months runway at stated burn."
    ),
    break_even=(
        "500–3,000 paying users at $8–15/mo depending on churn and COGS — often 12–24 months."
    ),
)

_B2B_SMB = _Segment(
    id="b2b_smb",
    label="B2B SMB SaaS",
    cac_max=4_000.0,
    ltv_max=18_000.0,
    burn_max=90_000.0,
    investment_max=600_000.0,
    revenue_model=(
        "B2B SaaS for {product}: $49–499/mo per team/workspace, optional usage add-ons. "
        "Land with single team, expand seats after retention proof."
    ),
    cac=(
        "$400–$2,200 per paying logo (blended PLG + outbound): founder-led sales early, "
        "payback 12–18 months. LTV:CAC target 3:1+."
    ),
    ltv=(
        "$2,500–$12,000 lifetime gross profit over 24–36 months: $150–400/mo ACV, 70–80% GM, "
        "1–2% monthly logo churn."
    ),
    burn=(
        "$25,000–$65,000/mo: 3–6 FTE ($18–45k), $2–6k infra, $3–10k sales/marketing, $1–2k tools."
    ),
    investment=(
        "$150,000–$400,000: MVP + 9–12 months runway; seed-ready after 10–30 paying logos."
    ),
    break_even=(
        "40–120 paying teams at $150–350/mo with 75% GM — typically 18–36 months."
    ),
)

_B2B_MID = _Segment(
    id="b2b_mid",
    label="B2B mid-market",
    cac_max=25_000.0,
    ltv_max=60_000.0,
    burn_max=180_000.0,
    investment_max=1_500_000.0,
    revenue_model=(
        "Annual contracts for {product}: $12k–60k ACV, implementation optional. Sales-led with POC pilot."
    ),
    cac=(
        "$4,000–$18,000 per closed account (fully loaded sales + marketing). Payback 18–24 months."
    ),
    ltv=(
        "$15,000–$45,000 lifetime gross profit over 36 months at 75% GM with expansion upsell."
    ),
    burn=(
        "$70,000–$150,000/mo: 8–15 FTE including 2–4 AEs, $5–15k infra, $10–25k GTM."
    ),
    investment=(
        "$400,000–$1.2M seed: product + 12–15 months runway."
    ),
    break_even=(
        "15–40 accounts at $20k+ ACV depending on sales cycle length."
    ),
)

_MARKETPLACE = _Segment(
    id="marketplace",
    label="Marketplace",
    cac_max=250.0,
    ltv_max=400.0,
    burn_max=120_000.0,
    investment_max=700_000.0,
    revenue_model=(
        "Take-rate marketplace for {product}: 10–25% commission or service fee; subsidize supply side early."
    ),
    cac=(
        "$25–$120 per activated supply/demand side (often asymmetric). Model both sides separately."
    ),
    ltv=(
        "$60–$280 lifetime gross profit per active transacting user over 12–24 months at stated take rate."
    ),
    burn=(
        "$35,000–$95,000/mo: ops + eng + localized launch marketing in one city/campus first."
    ),
    investment=(
        "$200,000–$550,000 for single-market MVP and 9–12 months runway."
    ),
    break_even=(
        "GMV and take-rate dependent — often 24+ months; unit economics must work per side."
    ),
)

_AI_B2B = _Segment(
    id="ai_b2b",
    label="AI / API B2B product",
    cac_max=5_000.0,
    ltv_max=25_000.0,
    burn_max=130_000.0,
    investment_max=900_000.0,
    revenue_model=(
        "Usage-based or seat + inference tiers for {product}. Price compute margin explicitly "
        "(target 60–70% GM after model/API costs)."
    ),
    cac=(
        "$300–$2,500 per production customer via devrel, outbound, and PLG — higher if enterprise POC."
    ),
    ltv=(
        "$3,000–$18,000 lifetime gross profit: monitor inference COGS; usage growth can compress margins."
    ),
    burn=(
        "$40,000–$110,000/mo: eng-heavy, $5–25k model/API spend at early scale, $5–15k GTM."
    ),
    investment=(
        "$250,000–$750,000: MVP + GPU/API budget + 9–12 months runway."
    ),
    break_even=(
        "Depends on inference margin — target $30k+ MRR with >60% GM before scaling sales headcount."
    ),
)


def _burn_inconsistent(burn_text: str) -> bool:
    """Flag burn that claims many FTE on a tiny budget."""
    burn_high = _range_high(burn_text)
    if burn_high <= 0:
        return False
    headcount = 0
    for m in re.finditer(r"(\d+)\s*[-–]?\s*(\d+)?\s*(people|fte|employees|person team)", burn_text, re.I):
        lo = int(m.group(1))
        hi = int(m.group(2)) if m.group(2) else lo
        headcount = max(headcount, hi)
    if headcount >= 8 and burn_high < headcount * 5_000:
        return True
    if headcount >= 10 and burn_high < 70_000:
        return True
    return False


def _needs_calibration(idea: str, data: dict, seg: _Segment) -> bool:
    cac_h = _range_high(str(data.get("estimated_cac") or ""))
    ltv_h = _range_high(str(data.get("ltv_potential") or ""))
    burn_h = _range_high(str(data.get("monthly_burn") or ""))
    inv_h = _range_high(str(data.get("initial_investment") or ""))

    if cac_h > seg.cac_max:
        return True
    if ltv_h > seg.ltv_max * 1.5:
        return True
    if burn_h > seg.burn_max:
        return True
    if inv_h > seg.investment_max:
        return True
    if _burn_inconsistent(str(data.get("monthly_burn") or "")):
        return True

    # Consumer/student: CAC must not exceed ~12 months ARPU (~$150 max for student apps)
    if seg.id in ("edtech", "b2c") and cac_h > 0 and ltv_h > 0 and cac_h > ltv_h * 0.85:
        return True

    rev = str(data.get("revenue_model") or "").strip().lower()
    if rev in ("subscription", "freemium", "saas", "b2b", "b2c"):
        return True

    return False


def calibrate_biz_financials(idea: str, parsed: dict) -> dict:
    """
    Replace unrealistic CFO numeric fields with segment-calibrated ranges.
    Mutates and returns parsed dict.
    """
    seg = _detect_segment(idea)
    if not _needs_calibration(idea, parsed, seg):
        return parsed

    product = _product_label(idea)
    note = f"[Calibrated to typical {seg.label} benchmarks — prior estimates were outside market norms.]"

    parsed["estimated_cac"] = seg.cac
    parsed["ltv_potential"] = seg.ltv
    parsed["monthly_burn"] = seg.burn
    parsed["initial_investment"] = seg.investment
    parsed["break_even"] = seg.break_even
    parsed["revenue_model"] = seg.revenue_model.format(product=product)

    summary = str(parsed.get("summary") or "").strip()
    if note not in summary:
        parsed["summary"] = f"{summary} {note}".strip() if summary else note

    return parsed
