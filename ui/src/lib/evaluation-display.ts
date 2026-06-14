import { mapBackendToUiReport } from "@/lib/evaluation-mapper";
import { classifyIdeaInput, type IdeaCategory } from "@/lib/idea-validation";
import { isEvaluableVenture } from "@/lib/venture-evaluable";
import type { LocalEvaluation } from "@/lib/local-evaluations";
import type { UiEvaluationReport } from "@/types/evaluation";

/** Matches backend non-idea agent scores (1.0 → 10 on 0–100 scale). */
export const NON_EVALUABLE_SCORE = 10;
export const NON_EVALUABLE_VERDICT = "Reconsider";

/** Only hard-reject categories — not "insufficient" (long YC apps / pitch docs may still evaluate). */
const HARD_REJECT_CATEGORIES = new Set<IdeaCategory>([
  "founder_docs",
  "irrelevant",
  "question",
  "chat",
  "gibberish",
  "code_only",
  "homework",
  "instruction",
  "empty_meaning",
]);

export interface EvaluationDisplay {
  overallScore: number | null;
  verdict: string | null;
  isEvaluable: boolean;
}

function remappedReport(row: LocalEvaluation): UiEvaluationReport | null {
  const stored = row.report;
  if (!stored) return null;
  if (stored.backend?.agent_results && stored.backend?.report) {
    return mapBackendToUiReport(stored.backend.agent_results, stored.backend.report);
  }
  return stored;
}

function isLegacyFounderDoc(row: LocalEvaluation): boolean {
  const check = classifyIdeaInput(row.idea.trim());
  return !check.isEvaluable && HARD_REJECT_CATEGORIES.has(check.category);
}

function isNonEvaluableReport(row: LocalEvaluation, report: UiEvaluationReport): boolean {
  const backendFlag = report.backend?.report?.is_evaluable_venture;
  if (backendFlag === false) return true;
  if (backendFlag === true) return false;
  if (isLegacyFounderDoc(row)) return true;
  return !isEvaluableVenture(report, report.backend?.agent_results);
}

export function resolveEvaluationDisplay(row: LocalEvaluation): EvaluationDisplay {
  if (row.status !== "completed") {
    return { overallScore: row.overall_score, verdict: row.verdict, isEvaluable: true };
  }

  const report = remappedReport(row);
  if (report) {
    if (isNonEvaluableReport(row, report)) {
      const score =
        report.overallScore <= 25 && report.overallScore > 0
          ? report.overallScore
          : NON_EVALUABLE_SCORE;
      return {
        overallScore: score,
        verdict: report.verdict === "Reconsider" ? report.verdict : NON_EVALUABLE_VERDICT,
        isEvaluable: false,
      };
    }
    return {
      overallScore: report.overallScore,
      verdict: report.verdict,
      isEvaluable: true,
    };
  }

  if (isLegacyFounderDoc(row)) {
    return {
      overallScore: NON_EVALUABLE_SCORE,
      verdict: NON_EVALUABLE_VERDICT,
      isEvaluable: false,
    };
  }

  return {
    overallScore: row.overall_score,
    verdict: row.verdict,
    isEvaluable: true,
  };
}

export function resolveEvaluationReport(row: LocalEvaluation): UiEvaluationReport | null {
  const report = remappedReport(row);
  if (!report) return null;
  if (!isNonEvaluableReport(row, report)) return report;

  const display = resolveEvaluationDisplay(row);
  return {
    ...report,
    overallScore: display.overallScore ?? NON_EVALUABLE_SCORE,
    verdict: display.verdict ?? NON_EVALUABLE_VERDICT,
    isEvaluableVenture: false,
    mvpRoadmap: [],
    cursorTasks: [],
    domainTasks: undefined,
  };
}
