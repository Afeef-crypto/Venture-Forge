import { EVALUATION_AGENTS, JUDGE_AGENT } from "@/config/agents";
import {
  blocksToAnalysisText,
  buildJudgeAnalysisBlocks,
  buildJudgeRecommendations,
  buildJudgeRisks,
  buildSpecialistAnalysisBlocks,
  buildSpecialistRecommendations,
  buildSpecialistRisks,
} from "@/lib/agent-analysis";
import { specialistScore100, verdictFromScore100 } from "@/lib/score-scale";
import { averageSpecialistScore100, agentsIndicateNonIdea } from "@/lib/venture-evaluable";
import type {
  AgentResult,
  EvaluationReport,
  UiAgentReport,
  UiEvaluationReport,
} from "@/types/evaluation";

function mapAgentResult(
  result: AgentResult,
  displayName: string,
  score100: number,
  agentId: string,
): UiAgentReport {
  const analysisBlocks = buildSpecialistAnalysisBlocks(agentId, result);
  const recommendations = buildSpecialistRecommendations(agentId, result);
  const risks = buildSpecialistRisks(agentId, result);

  return {
    name: displayName,
    score: score100,
    analysis: blocksToAnalysisText(analysisBlocks),
    analysisBlocks,
    recommendations: recommendations.length ? recommendations : [result.recommendation].filter(Boolean) as string[],
    risks,
    recommendation: result.recommendation,
    verdict: result.verdict,
  };
}

export function mapBackendToUiReport(
  agentResults: AgentResult[],
  report: EvaluationReport,
): UiEvaluationReport {
  const specialists = EVALUATION_AGENTS.map((agent, index) =>
    mapAgentResult(
      agentResults[index] ?? { score: 0, verdict: "error", summary: "", recommendation: "" },
      agent.name,
      specialistScore100(index, agentResults[index]?.score, report.scores),
      agent.id,
    ),
  );

  const judgeScore = averageSpecialistScore100(agentResults, specialists);
  const evaluable =
    report.is_evaluable_venture !== false && !agentsIndicateNonIdea(agentResults);

  const judgeVerdict = verdictFromScore100(judgeScore);

  const judgeBlocks = buildJudgeAnalysisBlocks(report);
  const judge: UiAgentReport = {
    name: JUDGE_AGENT.name,
    score: judgeScore,
    analysis: blocksToAnalysisText(judgeBlocks),
    analysisBlocks: judgeBlocks,
    recommendations: buildJudgeRecommendations(report),
    risks: buildJudgeRisks(report),
    recommendation: report.final_verdict || report.overall_verdict,
    verdict: judgeVerdict,
  };

  return {
    overallScore: judgeScore,
    verdict: judgeVerdict,
    executiveSummary: report.executive_summary,
    investorHook: report.investor_hook,
    biggestStrength: report.biggest_strength,
    biggestRisk: report.critical_risk,
    marketOpportunity: report.investor_hook,
    agents: [...specialists, judge],
    osirisScore: report.osiris_score,
    osirisVerdict: report.osiris_verdict,
    judgeVerdict: report.judge_verdict,
    radarScores: report.radar_scores,
    demandValidation: report.demand_validation,
    mvpRoadmap: evaluable ? report.mvp_roadmap : [],
    cursorTasks: evaluable ? report.cursor_tasks : [],
    domainTasks: evaluable ? report.domain_tasks : undefined,
    isEvaluableVenture: evaluable,
    backend: { agent_results: agentResults, report },
  };
}

export function buildEvaluationIdea(input: {
  idea: string;
  industry?: string | null;
  stage?: string | null;
  depth?: string | null;
  research?: boolean | null;
}): string {
  const parts = [input.idea.trim()];
  const meta: string[] = [];
  if (input.industry) meta.push(`Industry: ${input.industry}`);
  if (input.stage) meta.push(`Stage: ${input.stage}`);
  if (input.depth) meta.push(`Evaluation depth: ${input.depth}`);
  if (input.research != null) meta.push(`Use live web research: ${input.research ? "yes" : "no"}`);
  if (meta.length) parts.unshift(meta.join("\n"));
  return parts.join("\n\n");
}
