export type Verdict = "strong-yes" | "yes" | "maybe" | "no" | "error";

export interface Tag {
  label: string;
  type: "positive" | "negative" | "neutral";
}

export interface AgentResult {
  score: number;
  verdict: Verdict;
  summary: string;
  recommendation: string;
  tags?: Tag[];
  error?: boolean;
  agent_id?: string | null;
  [key: string]: unknown;
}

export interface MvpRoadmapWeek {
  week: number;
  title: string;
  deliverable: string;
  tasks: string[];
}

export interface PivotSuggestion {
  title: string;
  rationale: string;
}

export interface DomainTasks {
  frontend: string[];
  backend: string[];
  ai_ml: string[];
  design: string[];
  marketing: string[];
  business: string[];
}

export interface CursorTask {
  id: string;
  domain: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  priority: "P0" | "P1" | "P2";
  sprint: number;
  tech_stack?: string[];
  implementation_steps?: string[];
}

export interface RadarScores {
  market: number;
  demand: number;
  tech: number;
  finance: number;
  execution: number;
}

export interface DemandValidation {
  pain_point_severity: string;
  willingness_to_pay: string;
}

export interface EvaluationReport {
  overall_score: number;
  overall_verdict: string;
  osiris_score?: number;
  osiris_verdict?: string;
  executive_summary: string;
  investor_hook: string;
  biggest_strength: string;
  critical_risk: string;
  final_verdict?: string | null;
  judge_verdict?: string;
  scores: {
    yc: number;
    tech: number;
    biz: number;
    mkt: number;
    demand: number;
  };
  radar_scores?: RadarScores;
  demand_validation?: DemandValidation;
  mvp_roadmap: MvpRoadmapWeek[];
  pivot_suggestions: PivotSuggestion[];
  domain_tasks: DomainTasks;
  cursor_tasks: CursorTask[];
  is_evaluable_venture?: boolean;
}

/** Stored in local evaluations for the results UI. */
export interface UiAgentReport {
  name: string;
  score: number;
  analysis: string;
  analysisBlocks?: Array<{ heading: string; body?: string; bullets?: string[] }>;
  recommendations: string[];
  risks: string[];
  recommendation?: string;
  verdict?: string;
}

export interface UiEvaluationReport {
  overallScore: number;
  verdict: string;
  executiveSummary: string;
  investorHook: string;
  biggestStrength: string;
  biggestRisk: string;
  marketOpportunity: string;
  agents: UiAgentReport[];
  osirisScore?: number;
  osirisVerdict?: string;
  judgeVerdict?: string;
  radarScores?: RadarScores;
  demandValidation?: DemandValidation;
  mvpRoadmap?: MvpRoadmapWeek[];
  cursorTasks?: CursorTask[];
  domainTasks?: DomainTasks;
  isEvaluableVenture?: boolean;
  backend?: {
    agent_results: AgentResult[];
    report: EvaluationReport;
  };
}

export type AgentLiveState = "pending" | "running" | "done" | "error";
