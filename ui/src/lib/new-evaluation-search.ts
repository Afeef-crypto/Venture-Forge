import type { IdealAgentName } from "@/content/ideal-startup-templates";

export type NewEvaluationSearch = {
  track?: string;
  template?: string;
  agent: IdealAgentName;
};

export const DEFAULT_NEW_EVALUATION_SEARCH: NewEvaluationSearch = {
  agent: "YC Partner",
};

export function newEvaluationSearchForTemplate(template: string): NewEvaluationSearch {
  return { template, agent: "YC Partner" };
}
