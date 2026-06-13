from dataclasses import dataclass
from typing import Callable

JSON_INSTRUCTION = "Respond ONLY in valid JSON. No markdown fences. No extra text."


@dataclass(frozen=True)
class AgentDefinition:
    id: str
    role: str
    name: str
    icon: str
    color: str
    model: str
    system_prompt: str
    build_prompt: Callable[[str], str]
    fallback_models: tuple[str, ...] = ()


def _yc_prompt(idea: str) -> str:
    return f"""Evaluate this startup idea for Y Combinator criteria:

"{idea}"

Return JSON with these exact keys:
- score (number 1-10)
- verdict ("strong-yes" | "yes" | "maybe" | "no")
- summary (2-3 sentences)
- strengths (string array)
- weaknesses (string array)
- yc_fit (string)
- market_size (string)
- moat (string)
- recommendation (1 concrete action)
- tags (array of {{label, type}} where type is "positive" | "negative" | "neutral")

{JSON_INSTRUCTION}"""


def _tech_prompt(idea: str) -> str:
    return f"""Perform a technical feasibility audit for this startup idea:

"{idea}"

Return JSON with these exact keys:
- score (number 1-10)
- verdict ("strong-yes" | "yes" | "maybe" | "no")
- summary (2-3 sentences)
- recommended_stack (string array)
- mvp_complexity ("low" | "medium" | "high")
- time_to_mvp (string, e.g. "2-4 weeks")
- key_challenges (string array)
- tech_risks (string array)
- scalability (string)
- innovation_level (string)
- recommendation (1 concrete action)
- tags (array of {{label, type}} where type is "positive" | "negative" | "neutral")

{JSON_INSTRUCTION}"""


def _biz_prompt(idea: str) -> str:
    return f"""Analyze the financial viability of this startup idea:

"{idea}"

Return JSON with these exact keys:
- score (number 1-10)
- verdict ("strong-yes" | "yes" | "maybe" | "no")
- summary (2-3 sentences)
- revenue_model (string)
- estimated_cac (string)
- ltv_potential (string)
- initial_investment (string)
- monthly_burn (string)
- break_even (string)
- funding_strategy (string)
- strengths (string array)
- risks (string array)
- recommendation (1 concrete action)
- tags (array of {{label, type}} where type is "positive" | "negative" | "neutral")

{JSON_INSTRUCTION}"""


def _mkt_prompt(idea: str) -> str:
    return f"""Analyze the go-to-market and marketing strategy for this startup idea:

"{idea}"

Return JSON with these exact keys:
- score (number 1-10)
- verdict ("strong-yes" | "yes" | "maybe" | "no")
- summary (2-3 sentences)
- primary_icp (string)
- niche (string)
- gtm_strategy (string)
- best_channels (string array)
- viral_potential (string)
- brand_angle (string)
- competitor_landscape (string)
- recommendation (1 concrete action)
- tags (array of {{label, type}} where type is "positive" | "negative" | "neutral")

{JSON_INSTRUCTION}"""


def _dem_prompt(idea: str) -> str:
    return f"""Analyze market demand and timing for this startup idea:

"{idea}"

Return JSON with these exact keys:
- score (number 1-10)
- verdict ("strong-yes" | "yes" | "maybe" | "no")
- summary (2-3 sentences)
- pain_severity (string)
- problem_frequency (string)
- willingness_to_pay (string)
- timing (string)
- trend_direction (string)
- demand_signals (string array)
- substitutes (string array)
- recommendation (1 concrete action)
- tags (array of {{label, type}} where type is "positive" | "negative" | "neutral")

{JSON_INSTRUCTION}"""


AGENTS: list[AgentDefinition] = [
    AgentDefinition(
        id="yc",
        role="YC Partner Evaluator",
        name="YC Evaluator",
        icon="🎯",
        color="var(--yc)",
        model="meta-llama/llama-3.1-8b-instruct",
        system_prompt=(
            "You are a Y Combinator Partner simulation. You think like Paul Graham — "
            "ruthless, concise, and skeptical. You reject 98% of applications. You evaluate "
            "market size (TAM/SAM), problem severity, solution novelty, founder-market fit, "
            "moat, scalability, and traction signals. Be brutally honest."
        ),
        build_prompt=_yc_prompt,
        fallback_models=(
            "mistralai/mistral-small-3.2-24b-instruct",
            "nvidia/nemotron-nano-9b-v2:free",
            "openai/gpt-4o-mini",
        ),
    ),
    AgentDefinition(
        id="tech",
        role="Technical Architect",
        name="Tech Auditor",
        icon="⚙️",
        color="var(--tech)",
        model="nvidia/nemotron-nano-9b-v2:free",
        system_prompt=(
            "You are a senior full-stack architect with 15 years building startups. "
            "You are pragmatic, stack-opinionated, and focus on build risk and MVP velocity. "
            "Evaluate technical feasibility honestly."
        ),
        build_prompt=_tech_prompt,
        fallback_models=(
            "meta-llama/llama-3.1-8b-instruct",
            "qwen/qwen-2.5-7b-instruct",
            "openai/gpt-4o-mini",
        ),
    ),
    AgentDefinition(
        id="biz",
        role="Business CFO",
        name="Business CFO",
        icon="💼",
        color="var(--biz)",
        model="meta-llama/llama-3.1-8b-instruct",
        system_prompt=(
            "You are a startup CFO who has taken 3 companies to Series B. "
            "You are numbers-first, LTV/CAC obsessed, and wary of vanity metrics. "
            "Evaluate financial viability ruthlessly."
        ),
        build_prompt=_biz_prompt,
        fallback_models=(
            "mistralai/mistral-small-3.2-24b-instruct",
            "nvidia/nemotron-nano-9b-v2:free",
            "openai/gpt-4o-mini",
        ),
    ),
    AgentDefinition(
        id="mkt",
        role="Marketing & GTM Director",
        name="Marketing",
        icon="📢",
        color="var(--mkt)",
        model="anthropic/claude-haiku-4-5",
        system_prompt=(
            "You are a CMO and growth hacker with 0→1M users experience. "
            "You are channel-obsessed, ICP-precise, and love viral loops and organic moats."
        ),
        build_prompt=_mkt_prompt,
        fallback_models=(
            "openai/gpt-4o-mini",
            "meta-llama/llama-3.1-8b-instruct",
        ),
    ),
    AgentDefinition(
        id="dem",
        role="Demand Intelligence Analyst",
        name="Demand Intel",
        icon="📊",
        color="var(--dem)",
        model="mistralai/mistral-small-3.2-24b-instruct",
        system_prompt=(
            "You are a market demand analyst and trend specialist. "
            "You are data-driven, skeptical of hype, and validate with real signals."
        ),
        build_prompt=_dem_prompt,
        fallback_models=(
            "meta-llama/llama-3.1-8b-instruct",
            "nvidia/nemotron-nano-9b-v2:free",
            "openai/gpt-4o-mini",
        ),
    ),
]

AGENT_MAP = {agent.id: agent for agent in AGENTS}
