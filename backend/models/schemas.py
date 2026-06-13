from typing import Any, Literal

from pydantic import BaseModel, Field


Verdict = Literal["strong-yes", "yes", "maybe", "no", "error"]


class Tag(BaseModel):
    label: str
    type: Literal["positive", "negative", "neutral"] = "neutral"


class AgentResult(BaseModel):
    score: float = 0
    verdict: Verdict = "maybe"
    summary: str = ""
    recommendation: str = ""
    tags: list[Tag] = Field(default_factory=list)
    error: bool = False
    agent_id: str | None = None
    model_config = {"extra": "allow"}


class MvpRoadmapWeek(BaseModel):
    week: int
    title: str
    deliverable: str
    tasks: list[str] = Field(default_factory=list)


class PivotSuggestion(BaseModel):
    title: str
    rationale: str


class DomainTasks(BaseModel):
    frontend: list[str] = Field(default_factory=list)
    backend: list[str] = Field(default_factory=list)
    ai_ml: list[str] = Field(default_factory=list)
    design: list[str] = Field(default_factory=list)
    marketing: list[str] = Field(default_factory=list)
    business: list[str] = Field(default_factory=list)


class CursorTask(BaseModel):
    id: str
    domain: str
    title: str
    description: str
    acceptance_criteria: list[str] = Field(default_factory=list)
    priority: Literal["P0", "P1", "P2"] = "P1"
    sprint: int = 1


class ScoreBreakdown(BaseModel):
    yc: float = 0
    tech: float = 0
    biz: float = 0
    mkt: float = 0
    demand: float = 0


class EvaluationReport(BaseModel):
    overall_score: float = 0
    overall_verdict: str = "maybe"
    executive_summary: str = ""
    investor_hook: str = ""
    biggest_strength: str = ""
    critical_risk: str = ""
    final_verdict: str | None = None
    scores: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    hackathon_tips: list[str] = Field(default_factory=list)
    mvp_roadmap: list[MvpRoadmapWeek] = Field(default_factory=list)
    pivot_suggestions: list[PivotSuggestion] = Field(default_factory=list)
    domain_tasks: DomainTasks = Field(default_factory=DomainTasks)
    cursor_tasks: list[CursorTask] = Field(default_factory=list)


class EvaluateRequest(BaseModel):
    idea: str = Field(..., min_length=10, max_length=8000)


class EvaluateResponse(BaseModel):
    agent_results: list[AgentResult]
    report: EvaluationReport


class RateLimitError(BaseModel):
    detail: str
    retry_after_seconds: int
class UploadResponse(BaseModel):
    success: bool = True
    original_name: str
    stored_name: str
    size_bytes: int
    content_type: str | None = None