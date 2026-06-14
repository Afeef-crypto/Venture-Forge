from pydantic import BaseModel

class IndustryComparisonResponse(BaseModel):
    technology: int
    fintech: int
    healthcare: int
    marketplace: int
    edtech: int
    startup_score: int

class AgentScoresResponse(BaseModel):
    yc_partner: int
    tech_auditor: int
    business_cfo: int
    marketing_expert: int
    demand_intel: int
    judge: int