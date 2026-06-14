/** UI metadata for the five FastAPI specialist agents (order matches stream index). */
export const EVALUATION_AGENTS = [
  { id: "yc", name: "YC Partner", role: "Analyzing market size and founder insight…" },
  { id: "tech", name: "Tech Auditor", role: "Evaluating feasibility and architecture…" },
  { id: "biz", name: "Business CFO", role: "Running unit economics and margins…" },
  { id: "mkt", name: "Marketing Expert", role: "Analyzing GTM and positioning…" },
  { id: "dem", name: "Demand Intel", role: "Evaluating pain severity and timing…" },
] as const;

export const JUDGE_AGENT = {
  id: "judge",
  name: "The Judge",
  role: "Synthesizing cross-agent verdict…",
} as const;
