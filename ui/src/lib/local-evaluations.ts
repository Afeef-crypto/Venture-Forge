import type { UiAgentReport, UiEvaluationReport } from "@/types/evaluation";

const STORAGE_KEY = "venture-forge-evaluations-v1";

export interface LocalEvaluation {
  id: string;
  title: string;
  idea: string;
  industry: string;
  stage: string;
  evaluation_depth: string;
  use_web_research: boolean;
  status: "draft" | "running" | "completed";
  progress: number;
  overall_score: number | null;
  verdict: string | null;
  agent_results: UiAgentReport[] | null;
  report: UiEvaluationReport | null;
  created_at: string;
  updated_at: string;
  isDemo?: boolean;
}

function agents(
  entries: Array<[string, number, string, string[], string[]]>,
): UiAgentReport[] {
  return entries.map(([name, score, analysis, recommendations, risks]) => ({
    name,
    score,
    analysis,
    recommendations,
    risks,
    recommendation: recommendations[0],
  }));
}

function demoReport(
  overallScore: number,
  verdict: string,
  summary: string,
  hook: string,
  strength: string,
  risk: string,
  agentEntries: Array<[string, number, string, string[], string[]]>,
  judgeAnalysis: string,
): UiEvaluationReport {
  const specialistAgents = agents(agentEntries);
  return {
    overallScore,
    verdict,
    executiveSummary: summary,
    investorHook: hook,
    biggestStrength: strength,
    biggestRisk: risk,
    marketOpportunity: hook,
    agents: [
      ...specialistAgents,
      {
        name: "The Judge",
        score: overallScore,
        analysis: judgeAnalysis,
        recommendations: [verdict],
        risks: [risk],
        recommendation: verdict,
      },
    ],
    osirisScore: overallScore,
    osirisVerdict: verdict,
    judgeVerdict: judgeAnalysis,
  };
}

const DEMO_EVALUATIONS: LocalEvaluation[] = [
  {
    id: "demo-study-companion",
    title: "AI Study Companion",
    idea: "AI copilot that helps university students find and summarize notes from previous years.",
    industry: "EdTech",
    stage: "MVP",
    evaluation_depth: "Standard",
    use_web_research: true,
    status: "completed",
    progress: 100,
    overall_score: 87,
    verdict: "Strong Potential",
    isDemo: true,
    created_at: "2026-06-10T14:30:00.000Z",
    updated_at: "2026-06-10T14:31:00.000Z",
    report: demoReport(
      87,
      "Strong Potential",
      "A compelling student productivity product with a clear audience and credible freemium path. Focus the MVP on retention and prove learning outcomes before expanding.",
      "Every cohort reinvents the same study materials — this product turns institutional memory into a durable advantage.",
      "Clear ICP, acute pain, and strong word-of-mouth potential on campus.",
      "Retention and content quality at scale depend on early community contributions.",
      [
        ["YC Partner", 88, "Large reachable market with natural campus virality and a credible path to venture scale.", ["Launch at 3 universities with ambassador programs"], ["Seasonality around exam periods"]],
        ["Tech Auditor", 84, "Feasible MVP with RAG over uploaded notes; moderation and deduplication are the hard parts.", ["Start with PDF + markdown ingest only"], ["Copyright on shared materials"]],
        ["Business CFO", 82, "Freemium with team plans for study groups is plausible; unit economics improve with retention.", ["Price at $8/mo student tier"], ["Low willingness to pay without proven grade impact"]],
        ["Marketing Expert", 86, "Campus ambassadors and TikTok demos can drive early adoption cheaply.", ["Partner with student societies"], ["Hard to scale beyond initial campuses"]],
        ["Demand Intel", 89, "Students actively hunt for past papers and summaries every semester.", ["Interview 20 students pre-launch"], ["Faculty may discourage sharing"]],
      ],
      "Proceed with a narrow MVP focused on one faculty and measurable study-time saved.",
    ),
    agent_results: null,
  },
  {
    id: "demo-fintrack",
    title: "FinTrack",
    idea: "Personal finance app for freelancers that automates tax set-asides and cash-flow forecasting.",
    industry: "Fintech",
    stage: "Early Revenue",
    evaluation_depth: "Standard",
    use_web_research: false,
    status: "completed",
    progress: 100,
    overall_score: 74,
    verdict: "Promising with Caveats",
    isDemo: true,
    created_at: "2026-06-08T09:15:00.000Z",
    updated_at: "2026-06-08T09:16:00.000Z",
    report: demoReport(
      74,
      "Promising with Caveats",
      "Solid wedge for solo operators, but differentiation against incumbents requires sharper automation and trust on tax accuracy.",
      "Freelancers lose sleep over quarterly taxes — automate the set-aside and you own the checking account relationship.",
      "Clear monetization via subscription plus affiliate revenue from accounting tools.",
      "Regulatory complexity and bank linking reliability can stall growth.",
      [
        ["YC Partner", 76, "Large freelancer TAM with recurring revenue potential.", ["Target US 1099 contractors first"], ["Crowded personal finance space"]],
        ["Tech Auditor", 78, "Plaid + rules engine is buildable; tax logic needs expert review.", ["Human-in-the-loop for tax estimates"], ["Multi-state tax edge cases"]],
        ["Business CFO", 72, " $12/mo is viable if churn stays low; CAC may be high on paid channels.", ["Bundle with invoice tools"], ["Price sensitivity"]],
        ["Marketing Expert", 70, "Content SEO and creator partnerships fit the audience.", ["YouTube tutorials on quarterly taxes"], ["Long education cycle"]],
        ["Demand Intel", 75, "Freelancers actively seek simple cash-flow visibility.", ["Validate with Upwork/Fiverr communities"], ["Many use spreadsheets today"]],
      ],
      "Validate willingness to pay with a manual concierge before full automation.",
    ),
    agent_results: null,
  },
  {
    id: "demo-localeats",
    title: "LocalEats",
    idea: "Hyperlocal food delivery marketplace connecting home cooks with nearby customers.",
    industry: "Marketplace",
    stage: "Idea",
    evaluation_depth: "Standard",
    use_web_research: true,
    status: "completed",
    progress: 100,
    overall_score: 61,
    verdict: "Needs Refinement",
    isDemo: true,
    created_at: "2026-06-05T18:45:00.000Z",
    updated_at: "2026-06-05T18:46:00.000Z",
    report: demoReport(
      61,
      "Needs Refinement",
      "Interesting community angle, but cold-start, food safety, and logistics make this harder than generic delivery unless tightly geo-fenced.",
      "Neighborhood trust beats anonymous delivery — if you can prove safety and repeat orders on one block, it scales block by block.",
      "Passionate supply side and differentiated local brand story.",
      "Operational complexity and regulatory burden for home-cooked food.",
      [
        ["YC Partner", 58, "Marketplace dynamics are brutal without density.", ["Start with one neighborhood popup"], ["Chicken-and-egg liquidity"]],
        ["Tech Auditor", 65, "Ordering app is straightforward; ops tooling for cooks is not.", ["WhatsApp-first ordering MVP"], ["Real-time delivery tracking cost"]],
        ["Business CFO", 60, "Take rate must cover support and insurance.", ["15% commission pilot"], ["Thin margins per order"]],
        ["Marketing Expert", 64, "Local events and community groups can seed demand.", ["Partner with apartment complexes"], ["Limited paid channel scale"]],
        ["Demand Intel", 59, "Demand exists for authentic local food but frequency is uncertain.", ["Run weekend-only pilot"], ["Food safety concerns"]],
      ],
      "Pivot to curated meal kits or licensed cloud-kitchen partners before full marketplace scale.",
    ),
    agent_results: null,
  },
];

function hydrate(row: LocalEvaluation): LocalEvaluation {
  if (row.report && !row.agent_results) {
    row.agent_results = row.report.agents;
  }
  return row;
}

function mergeDemoRow(row: LocalEvaluation): LocalEvaluation {
  if (!row.isDemo) return row;
  const template = DEMO_EVALUATIONS.find((d) => d.id === row.id);
  if (!template) return row;
  return hydrate({
    ...template,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

function readAll(): LocalEvaluation[] {
  if (typeof window === "undefined") return DEMO_EVALUATIONS.map((d) => hydrate({ ...d }));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = DEMO_EVALUATIONS.map((d) => hydrate({ ...d }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as LocalEvaluation[];
    return parsed.map((row) => mergeDemoRow(hydrate(row)));
  } catch {
    return DEMO_EVALUATIONS.map((d) => hydrate({ ...d }));
  }
}

function writeAll(rows: LocalEvaluation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function listEvaluations(): LocalEvaluation[] {
  return readAll().sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
}

export function getEvaluation(id: string): LocalEvaluation | undefined {
  return readAll().find((row) => row.id === id);
}

export function createEvaluation(input: {
  title: string;
  idea: string;
  industry: string;
  stage: string;
  evaluation_depth: string;
  use_web_research: boolean;
  status: LocalEvaluation["status"];
  progress?: number;
}): LocalEvaluation {
  const now = new Date().toISOString();
  const row: LocalEvaluation = {
    id: crypto.randomUUID(),
    title: input.title,
    idea: input.idea,
    industry: input.industry,
    stage: input.stage,
    evaluation_depth: input.evaluation_depth,
    use_web_research: input.use_web_research,
    status: input.status,
    progress: input.progress ?? (input.status === "running" ? 8 : 0),
    overall_score: null,
    verdict: null,
    agent_results: null,
    report: null,
    created_at: now,
    updated_at: now,
  };
  const rows = readAll();
  rows.unshift(row);
  writeAll(rows);
  return row;
}

export function updateEvaluation(id: string, patch: Partial<LocalEvaluation>): LocalEvaluation | undefined {
  const rows = readAll();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return undefined;
  const updated: LocalEvaluation = {
    ...rows[index],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  if (updated.report) updated.agent_results = updated.report.agents;
  rows[index] = updated;
  writeAll(rows);
  return updated;
}

export function deleteEvaluation(id: string) {
  writeAll(readAll().filter((row) => row.id !== id));
}

export function resetDemoData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  readAll();
}

export const LOCAL_EVALUATIONS_EVENT = "venture-forge:evaluations-changed";

export function notifyEvaluationsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOCAL_EVALUATIONS_EVENT));
}
