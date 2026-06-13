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


class RadarScores(BaseModel):
    market: float = 0
    demand: float = 0
    tech: float = 0
    finance: float = 0
    execution: float = 0


class DemandValidation(BaseModel):
    pain_point_severity: str = ""
    willingness_to_pay: str = ""


class EvaluationReport(BaseModel):
    overall_score: float = 0
    overall_verdict: str = "maybe"
    osiris_score: float = 0
    osiris_verdict: str = ""
    executive_summary: str = ""
    investor_hook: str = ""
    biggest_strength: str = ""
    critical_risk: str = ""
    final_verdict: str | None = None
    judge_verdict: str = ""
    scores: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    radar_scores: RadarScores = Field(default_factory=RadarScores)
    demand_validation: DemandValidation = Field(default_factory=DemandValidation)
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


class ExportMarkdownRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=500_000)
    filename: str = Field(default="osiris-report.md", pattern=r"^[\w\-. ]+\.md$")


class ExportMarkdownResponse(BaseModel):
    path: str
    filename: str
    editor_urls: dict[str, str]


class UploadResponse(BaseModel):
    success: bool = True
    original_name: str
    stored_name: str
    size_bytes: int
    content_type: str | None = None
