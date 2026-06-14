import type { AgentResult, EvaluationReport, UiEvaluationReport } from "@/types/evaluation";
import { EVALUATION_AGENTS, JUDGE_AGENT } from "@/config/agents";
import { toScore100 } from "@/lib/score-scale";

const NON_IDEA_PHRASES = [
  "not an evaluable",
  "not a startup",
  "non-evaluable",
  "no product",
  "no clear product",
  "cannot evaluate this submission",
  "declines to rule",
  "not evaluable",
];

/** Judge score = average of the five specialist agents (0–100). */
export function averageSpecialistScore100(
  agentResults: AgentResult[] | undefined,
  uiAgents: UiEvaluationReport["agents"],
): number {
  const fromUi = uiAgents.filter((a) => a.name !== JUDGE_AGENT.name);
  if (fromUi.length >= 5) {
    return Math.round(fromUi.reduce((sum, a) => sum + a.score, 0) / fromUi.length);
  }
  if (agentResults && agentResults.length >= 5) {
    const slice = agentResults.slice(0, 5);
    return Math.round(slice.reduce((sum, r) => sum + toScore100(r.score), 0) / slice.length);
  }
  return 0;
}

export function agentsIndicateNonIdea(agentResults: AgentResult[] | undefined): boolean {
  if (!agentResults?.length) return false;
  const valid = agentResults.slice(0, 5);
  const scores = valid.map((r) => Number(r.score) || 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const textHits = valid.filter((r) => {
    const blob = `${r.summary} ${r.recommendation}`.toLowerCase();
    return NON_IDEA_PHRASES.some((p) => blob.includes(p));
  }).length;
  const noCount = valid.filter((r) => r.verdict === "no").length;

  if (textHits >= 3) return true;
  if (avg <= 2) return true;
  if (noCount >= 4 && avg <= 4) return true;
  if (textHits >= 2 && avg <= 3.5) return true;
  return false;
}

export function isEvaluableVenture(
  report: UiEvaluationReport,
  agentResults?: AgentResult[],
): boolean {
  const backend = report.backend?.report as (EvaluationReport & { is_evaluable_venture?: boolean }) | undefined;
  if (backend?.is_evaluable_venture === false) return false;
  if (backend?.is_evaluable_venture === true) return true;

  if (
    backend &&
    !backend.mvp_roadmap?.length &&
    !backend.cursor_tasks?.length &&
    backend.overall_verdict === "no"
  ) {
    return false;
  }

  if (agentsIndicateNonIdea(agentResults ?? report.backend?.agent_results)) return false;

  const specialists = report.agents.filter((a) => a.name !== JUDGE_AGENT.name);
  const avg = specialists.length
    ? specialists.reduce((s, a) => s + a.score, 0) / specialists.length
    : 0;
  if (avg <= 25 && (report.verdict === "Reconsider" || report.verdict === "no")) return false;

  return true;
}
