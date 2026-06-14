import type { AgentResult, EvaluationReport } from "@/types/evaluation";

export interface AnalysisBlock {
  heading: string;
  body?: string;
  bullets?: string[];
}

function label(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function asString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return String(value);
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item)))
    .filter(Boolean);
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

const AGENT_SCALAR_FIELDS: Record<string, string[]> = {
  yc: ["yc_fit", "market_size", "moat"],
  tech: ["mvp_complexity", "time_to_mvp", "scalability", "innovation_level"],
  biz: [
    "revenue_model",
    "estimated_cac",
    "ltv_potential",
    "initial_investment",
    "monthly_burn",
    "break_even",
    "funding_strategy",
  ],
  mkt: ["primary_icp", "niche", "gtm_strategy", "viral_potential", "brand_angle", "competitor_landscape"],
  dem: ["pain_severity", "problem_frequency", "willingness_to_pay", "timing", "trend_direction"],
};

const AGENT_LIST_FIELDS: Record<string, string[]> = {
  yc: ["strengths", "weaknesses"],
  tech: ["recommended_stack", "key_challenges", "tech_risks"],
  biz: ["strengths", "risks"],
  mkt: ["best_channels"],
  dem: ["demand_signals", "substitutes"],
};

export function buildSpecialistAnalysisBlocks(agentId: string, result: AgentResult): AnalysisBlock[] {
  const blocks: AnalysisBlock[] = [];

  if (result.summary?.trim()) {
    blocks.push({ heading: "Executive Summary", body: result.summary.trim() });
  }

  for (const key of AGENT_SCALAR_FIELDS[agentId] ?? []) {
    const text = asString(result[key]);
    if (text) blocks.push({ heading: label(key), body: text });
  }

  for (const key of AGENT_LIST_FIELDS[agentId] ?? []) {
    const items = asStringList(result[key]);
    if (items.length) blocks.push({ heading: label(key), bullets: items });
  }

  const positiveTags = (result.tags ?? []).filter((t) => t.type === "positive").map((t) => t.label);
  const neutralTags = (result.tags ?? []).filter((t) => t.type === "neutral").map((t) => t.label);
  if (positiveTags.length) blocks.push({ heading: "Positive Signals", bullets: positiveTags });
  if (neutralTags.length) blocks.push({ heading: "Watchpoints", bullets: neutralTags });

  if (blocks.length === 0) {
    blocks.push({ heading: "Analysis", body: "No detailed analysis was returned for this agent." });
  }

  return blocks;
}

export function buildJudgeAnalysisBlocks(report: EvaluationReport): AnalysisBlock[] {
  const blocks: AnalysisBlock[] = [];

  if (report.judge_verdict?.trim()) {
    blocks.push({ heading: "The Judge's Verdict", body: report.judge_verdict.trim() });
  }
  if (report.executive_summary?.trim()) {
    blocks.push({ heading: "Executive Summary", body: report.executive_summary.trim() });
  }
  if (report.investor_hook?.trim()) {
    blocks.push({ heading: "Investor Hook", body: report.investor_hook.trim() });
  }
  if (report.biggest_strength?.trim()) {
    blocks.push({ heading: "Biggest Strength", body: report.biggest_strength.trim() });
  }
  if (report.critical_risk?.trim()) {
    blocks.push({ heading: "Critical Risk", body: report.critical_risk.trim() });
  }

  const dv = report.demand_validation;
  if (dv?.pain_point_severity?.trim()) {
    blocks.push({ heading: "Pain Point Severity", body: dv.pain_point_severity.trim() });
  }
  if (dv?.willingness_to_pay?.trim()) {
    blocks.push({ heading: "Willingness to Pay", body: dv.willingness_to_pay.trim() });
  }

  const radar = report.radar_scores;
  if (radar) {
    blocks.push({
      heading: "Venture Radar",
      bullets: [
        `Market: ${Math.round(radar.market)}/100`,
        `Demand: ${Math.round(radar.demand)}/100`,
        `Tech: ${Math.round(radar.tech)}/100`,
        `Finance: ${Math.round(radar.finance)}/100`,
        `Execution: ${Math.round(radar.execution)}/100`,
      ],
    });
  }

  if (report.pivot_suggestions?.length) {
    blocks.push({
      heading: "Pivot Suggestions",
      bullets: report.pivot_suggestions.map((p) => `${p.title}: ${p.rationale}`),
    });
  }

  return blocks;
}

export function blocksToAnalysisText(blocks: AnalysisBlock[]): string {
  return blocks
    .map((block) => {
      const parts = [block.heading];
      if (block.body) parts.push(block.body);
      if (block.bullets?.length) parts.push(block.bullets.map((b) => `• ${b}`).join("\n"));
      return parts.join("\n\n");
    })
    .join("\n\n");
}

export function buildSpecialistRecommendations(agentId: string, result: AgentResult): string[] {
  const items = [
    result.recommendation?.trim(),
    ...asStringList(result.strengths),
    ...(agentId === "mkt" ? asStringList(result.best_channels) : []),
  ];
  return unique(items.filter((x): x is string => Boolean(x)));
}

export function buildSpecialistRisks(agentId: string, result: AgentResult): string[] {
  const items = [
    ...asStringList(result.weaknesses),
    ...asStringList(result.risks),
    ...asStringList(result.tech_risks),
    ...asStringList(result.key_challenges),
    ...asStringList(result.substitutes),
    ...(result.tags ?? []).filter((t) => t.type === "negative").map((t) => t.label),
  ];
  return unique(items.filter(Boolean));
}

export function buildJudgeRecommendations(report: EvaluationReport): string[] {
  return unique(
    [report.final_verdict, report.investor_hook, report.biggest_strength].filter((x): x is string =>
      Boolean(x?.trim()),
    ),
  );
}

export function buildJudgeRisks(report: EvaluationReport): string[] {
  return unique([report.critical_risk].filter((x): x is string => Boolean(x?.trim())));
}
