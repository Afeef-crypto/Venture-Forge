"""
backend/models/pdf_schemas.py

Pydantic v2 schemas for the PDF export feature.

These models mirror the evaluation data structure produced by the
synthesis agent (EvaluationReport / AgentResult in models/schemas.py)
but are defined here in a focused way so the PDF generator has a
well-typed contract that doesn't change when the evaluation schema
evolves.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Per-agent section (YC Partner, Tech Auditor, Business CFO, …)
# ---------------------------------------------------------------------------

class AgentSection(BaseModel):
    """
    One specialist agent's full output, as written to the results page.

    ``raw_analysis`` is the unstructured text the agent returned.
    ``subsections`` holds any key→value pairs the agent structured its
    output into (e.g. "REVENUE MODEL", "ESTIMATED CAC", "STRENGTHS", …).
    These are rendered as labelled paragraphs in the PDF.
    """

    agent_id: str
    agent_name: str
    score: int = Field(ge=0, le=100)
    executive_summary: str
    raw_analysis: str = ""
    subsections: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Ordered mapping of subsection label → content. "
            "Values may be strings or lists of strings (bullet points)."
        ),
    )
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Roadmap & Implementation Plan
# ---------------------------------------------------------------------------

class RoadmapWeek(BaseModel):
    week: int
    title: str
    tasks: list[str]


class RoadmapSection(BaseModel):
    weeks: list[RoadmapWeek] = Field(default_factory=list)
    summary: str = ""


class ImplementationTask(BaseModel):
    id: str
    title: str
    description: str
    priority: str = "medium"          # low | medium | high | critical
    sprint: int | None = None
    domain: str = ""                  # frontend | backend | ai_ml | design | …
    acceptance_criteria: list[str] = Field(default_factory=list)


class ImplementationPlan(BaseModel):
    tasks: list[ImplementationTask] = Field(default_factory=list)
    summary: str = ""


# ---------------------------------------------------------------------------
# Overview / top-level
# ---------------------------------------------------------------------------

class OverviewSection(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    verdict: str = ""
    investor_hook: str = ""
    biggest_strength: str = ""
    critical_risk: str = ""
    executive_summary: str = ""
    agent_scores: dict[str, int] = Field(
        default_factory=dict,
        description="agent_id → score, used in radar chart",
    )


# ---------------------------------------------------------------------------
# Top-level PDF export request
# ---------------------------------------------------------------------------

class PDFExportRequest(BaseModel):
    """
    The body sent to POST /api/export-pdf/{evaluation_id}.

    In a fully wired application the endpoint would look up evaluation_id
    from the database and populate this automatically; accepting the full
    payload in the request body makes the endpoint self-contained and
    easy to test without a live DB.
    """

    startup_name: str = Field(..., min_length=1, max_length=200)
    evaluation_date: datetime = Field(default_factory=datetime.utcnow)
    industry: str = "Technology"

    overview: OverviewSection
    yc_partner: AgentSection | None = None
    tech_auditor: AgentSection | None = None
    business_cfo: AgentSection | None = None
    marketing_expert: AgentSection | None = None
    demand_intel: AgentSection | None = None
    judge: AgentSection | None = None
    roadmap: RoadmapSection = Field(default_factory=RoadmapSection)
    implementation_plan: ImplementationPlan = Field(
        default_factory=ImplementationPlan
    )

    @property
    def all_agent_sections(self) -> list[AgentSection]:
        """Return only the agents that were actually populated."""
        candidates = [
            self.yc_partner,
            self.tech_auditor,
            self.business_cfo,
            self.marketing_expert,
            self.demand_intel,
            self.judge,
        ]
        return [a for a in candidates if a is not None]