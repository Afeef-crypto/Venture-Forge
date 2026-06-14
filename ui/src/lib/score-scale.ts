import type { EvaluationReport } from "@/types/evaluation";

/** Specialist agent index → synthesis report.scores key */
export const AGENT_SCORE_KEYS = ["yc", "tech", "biz", "mkt", "demand"] as const;

/**
 * Convert backend agent score to 0–100 display scale.
 * Agents return 1–10; Osiris / radar use 0–100 (see backend/utils/osiris_verdict.py).
 */
export function toScore100(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  const n = Number(value);
  if (n <= 0) return 0;
  if (n > 10) return Math.round(Math.min(100, n));
  return Math.round(Math.min(100, n * 10));
}

export function specialistScore100(
  agentIndex: number,
  rawAgentScore: number | null | undefined,
  breakdown?: EvaluationReport["scores"],
): number {
  const key = AGENT_SCORE_KEYS[agentIndex];
  if (key && breakdown) {
    const fromSynthesis = breakdown[key];
    if (typeof fromSynthesis === "number" && fromSynthesis > 0) {
      return toScore100(fromSynthesis);
    }
  }
  return toScore100(rawAgentScore);
}

export function deriveRadarScoresFromBreakdown(scores: EvaluationReport["scores"]) {
  return {
    market: Math.round(((scores.yc + scores.mkt) / 2) * 10),
    demand: toScore100(scores.demand),
    tech: toScore100(scores.tech),
    finance: toScore100(scores.biz),
    execution: Math.round(((scores.tech + scores.mkt + scores.biz) / 3) * 10),
  };
}

const VERDICT_TIERS: [number, string][] = [
  [90, "Divine Potential"],
  [75, "Venture Ready"],
  [60, "Promising but Risky"],
  [40, "Needs Refinement"],
  [0, "Reconsider"],
];

export function verdictFromScore100(score: number): string {
  for (const [threshold, label] of VERDICT_TIERS) {
    if (score >= threshold) return label;
  }
  return "Reconsider";
}
