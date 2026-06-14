import type { AgentResult, CursorTask, DomainTasks, MvpRoadmapWeek } from "@/types/evaluation";
import { inferPlanDuration, type PlanDuration, sprintPhaseLabel } from "@/lib/plan-complexity";
import { isEvaluableVenture } from "@/lib/venture-evaluable";
import { listEvaluations, type LocalEvaluation } from "@/lib/local-evaluations";

export interface TechStackSummary {
  recommended: string[];
  mvpComplexity?: string;
  timeToMvp?: string;
  summary?: string;
}

export interface EvaluationPlan {
  id: string;
  title: string;
  /** Short product summary — never the full uploaded document. */
  ideaSummary: string;
  mvpRoadmap: MvpRoadmapWeek[];
  implementationTasks: CursorTask[];
  domainTasks?: DomainTasks;
  techStack?: TechStackSummary;
  weekCount: number;
  sprintCount: number;
  complexityLabel: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  ai_ml: "AI / ML",
  design: "Design",
  marketing: "Marketing",
  business: "Business",
};

export function domainLabel(domain: string): string {
  return DOMAIN_LABELS[domain.toLowerCase()] ?? domain;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "string" ? item.trim() : String(item))).filter(Boolean);
}

/** Derive a concise product summary instead of dumping the full document. */
export function summarizeIdea(row: LocalEvaluation): string {
  const report = row.report;
  const idea = row.idea.trim();

  if (report?.executiveSummary && idea.length > 280) {
    return report.executiveSummary;
  }
  if (report?.investorHook && idea.length > 280) {
    return report.investorHook;
  }

  const patterns = [
    /(?:describe what your company|what is your company going to make|company going to make)[^\n]*\n+([^\n]{30,500})/i,
    /(?:one sentence explanation|one-liner|in one sentence)[^\n]*\n+([^\n]{20,400})/i,
    /(?:product|solution|platform)[:\s]+([^\n]{30,400})/i,
  ];
  for (const pattern of patterns) {
    const match = idea.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/\s+/g, " ");
  }

  if (idea.length <= 280) return idea;

  const firstParagraph = idea.split(/\n\n+/).find((p) => p.trim().length > 40)?.trim();
  if (firstParagraph && firstParagraph.length <= 400) return firstParagraph;

  const sentence = idea.match(/[^.!?\n]{40,320}[.!?]/)?.[0]?.trim();
  if (sentence) return sentence;

  return `${idea.slice(0, 260).trim()}…`;
}

function extractTechStack(row: LocalEvaluation): TechStackSummary | undefined {
  const tech = row.report?.backend?.agent_results?.[1] as AgentResult | undefined;
  if (!tech) return undefined;

  const recommended = asStringList(tech.recommended_stack);
  if (!recommended.length && !tech.summary) return undefined;

  return {
    recommended,
    mvpComplexity: typeof tech.mvp_complexity === "string" ? tech.mvp_complexity : undefined,
    timeToMvp: typeof tech.time_to_mvp === "string" ? tech.time_to_mvp : undefined,
    summary: tech.summary?.trim() || undefined,
  };
}

export function getEvaluationPlan(row: LocalEvaluation | undefined): EvaluationPlan | null {
  if (!row) return null;

  const report = row.report;
  if (report && !isEvaluableVenture(report, report.backend?.agent_results)) {
    return null;
  }

  const backend = report?.backend?.report;
  const ideaSummary = summarizeIdea(row);
  const techStack = extractTechStack(row);
  const product = row.title || "the product";

  const rawRoadmap = report?.mvpRoadmap?.length
    ? report.mvpRoadmap
    : backend?.mvp_roadmap?.length
      ? backend.mvp_roadmap
      : [];

  const { roadmap: mvpRoadmap, duration } =
    rawRoadmap.length > 0
      ? normalizeRoadmapWeeks(rawRoadmap, product, ideaSummary, techStack)
      : {
          roadmap: buildFallbackRoadmap(product, ideaSummary, techStack, inferPlanDuration(techStack).weeks),
          duration: inferPlanDuration(techStack),
        };

  const rawTasks = report?.cursorTasks?.length
    ? report.cursorTasks
    : backend?.cursor_tasks?.length
      ? backend.cursor_tasks
      : buildFallbackTasks(product, ideaSummary, techStack, duration.sprints);

  const implementationTasks = alignTasksToSprints(enrichTasks(rawTasks, techStack), duration.sprints);

  const domainTasks = report?.domainTasks ?? backend?.domain_tasks;

  return {
    id: row.id,
    title: row.title,
    ideaSummary,
    mvpRoadmap,
    implementationTasks,
    domainTasks,
    techStack,
    weekCount: duration.weeks,
    sprintCount: duration.sprints,
    complexityLabel: duration.complexityLabel,
  };
}

function normalizeRoadmapWeeks(
  roadmap: MvpRoadmapWeek[],
  product: string,
  summary: string,
  techStack?: TechStackSummary,
): { roadmap: MvpRoadmapWeek[]; duration: PlanDuration } {
  const duration = inferPlanDuration(techStack, roadmap.length);
  const target = duration.weeks;

  if (roadmap.length >= target) {
    const trimmed = roadmap.slice(0, 10).map((w, i) => ({ ...w, week: i + 1 }));
    return { roadmap: trimmed, duration: inferPlanDuration(techStack, trimmed.length) };
  }

  if (roadmap.length >= 3) {
    const extra = buildExtensionWeeks(roadmap.length + 1, target, product, summary, techStack);
    const combined = [...roadmap, ...extra].slice(0, 10).map((w, i) => ({ ...w, week: i + 1 }));
    return { roadmap: combined, duration: inferPlanDuration(techStack, combined.length) };
  }

  const built = buildFallbackRoadmap(product, summary, techStack, Math.max(3, target));
  return { roadmap: built, duration: inferPlanDuration(techStack, built.length) };
}

function buildExtensionWeeks(
  fromWeek: number,
  toWeek: number,
  product: string,
  summary: string,
  techStack?: TechStackSummary,
): MvpRoadmapWeek[] {
  const templates: Array<{ title: string; deliverable: string; tasks: string[] }> = [
    {
      title: `Integrations & data pipeline for ${product}`,
      deliverable: `External services connected with reliable sync and error recovery for ${product}.`,
      tasks: [
        `Integrate third-party APIs required by ${product} with retry and circuit-breaker patterns.`,
        `Build ETL or event pipeline for core data entities.`,
        `Add admin tools to inspect sync status and replay failed jobs.`,
      ],
    },
    {
      title: `Observability & performance for ${product}`,
      deliverable: `Production metrics, logging, and performance baselines established.`,
      tasks: [
        `Add structured logging and distributed tracing on critical paths.`,
        `Profile slow endpoints and reduce P95 latency for the main user action.`,
        `Set up alerting for error rate spikes and queue backlogs.`,
      ],
    },
    {
      title: `Security hardening for ${product}`,
      deliverable: `Security review complete with P0 issues resolved before beta.`,
      tasks: [
        `Run dependency audit and patch critical CVEs.`,
        `Enforce rate limits, CSRF/CORS policy, and secrets rotation.`,
        `Document threat model for ${product}'s data flows.`,
      ],
    },
    {
      title: `Beta program for ${product}`,
      deliverable: `Closed beta with active users and triaged feedback backlog.`,
      tasks: [
        `Recruit 15–25 beta users from ICP; ship invite-only onboarding.`,
        `Run weekly feedback sessions; prioritize top 5 UX blockers.`,
        `Track activation, retention, and core action completion rates.`,
      ],
    },
    {
      title: `UX polish & retention for ${product}`,
      deliverable: `Onboarding and empty states optimized based on beta data.`,
      tasks: [
        `Rewrite onboarding copy to reflect ${summary.slice(0, 80)}… value prop.`,
        `Add in-app guidance, tooltips, and progress indicators on key screens.`,
        `Implement email/in-app nudges for users who stall in the funnel.`,
      ],
    },
    {
      title: `GTM & launch prep for ${product}`,
      deliverable: `Launch assets ready: landing page, demo, pricing page, and support docs.`,
      tasks: [
        `Publish marketing site with analytics and waitlist/signup capture.`,
        `Record product demo highlighting ${product}'s differentiator.`,
        `Prepare launch checklist, rollback plan, and support macros.`,
      ],
    },
    {
      title: `Public launch for ${product}`,
      deliverable: `Public launch executed with monitoring and incident response in place.`,
      tasks: [
        `Ship to production with feature flags for risky modules.`,
        `Monitor infra, costs, and support queue during launch week.`,
        `Publish changelog and collect public feedback channels.`,
      ],
    },
  ];

  const weeks: MvpRoadmapWeek[] = [];
  let t = 0;
  for (let w = fromWeek; w <= toWeek; w++) {
    const tpl = templates[t % templates.length];
    weeks.push({
      week: w,
      title: tpl.title,
      deliverable: tpl.deliverable,
      tasks: tpl.tasks.map((task) => task.replace(/\${product}/g, product)),
    });
    t++;
  }
  return weeks;
}

function alignTasksToSprints(tasks: CursorTask[], sprintCount: number): CursorTask[] {
  if (tasks.length === 0) return tasks;
  const oldMax = Math.max(1, ...tasks.map((t) => t.sprint));

  if (oldMax > sprintCount) {
    return tasks.map((task) => ({ ...task, sprint: Math.min(sprintCount, task.sprint) }));
  }

  if (oldMax >= sprintCount) return tasks;

  return tasks.map((task) => ({
    ...task,
    sprint: Math.min(
      sprintCount,
      Math.max(1, Math.round((task.sprint / oldMax) * sprintCount)),
    ),
  }));
}

function enrichTasks(tasks: CursorTask[], techStack?: TechStackSummary): CursorTask[] {
  const defaultStack = techStack?.recommended ?? [];
  return tasks.map((task) => ({
    ...task,
    tech_stack: task.tech_stack?.length ? task.tech_stack : defaultStack.slice(0, 4),
    implementation_steps:
      task.implementation_steps?.length ? task.implementation_steps : inferStepsFromDescription(task),
  }));
}

function inferStepsFromDescription(task: CursorTask): string[] {
  const parts = task.description
    .split(/[.;]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
  if (parts.length >= 2) return parts.slice(0, 5);
  return [
    `Scaffold ${task.title.toLowerCase()} in the ${domainLabel(task.domain)} layer`,
    `Wire data flow and error handling for ${task.id}`,
    `Add tests and verify acceptance criteria for ${task.id}`,
  ];
}

export function listEvaluationPlans(): EvaluationPlan[] {
  return listEvaluations()
    .filter((row) => row.status === "completed")
    .filter((row) => row.report && isEvaluableVenture(row.report, row.report.backend?.agent_results))
    .map((row) => getEvaluationPlan(row))
    .filter((plan): plan is EvaluationPlan => plan !== null);
}

function buildFallbackRoadmap(
  product: string,
  summary: string,
  techStack?: TechStackSummary,
  weekCount = 5,
): MvpRoadmapWeek[] {
  const weeks = Math.min(10, Math.max(3, weekCount));
  const stackNote = techStack?.recommended.length
    ? ` Stack: ${techStack.recommended.slice(0, 3).join(", ")}.`
    : "";

  const core: MvpRoadmapWeek[] = [
    {
      week: 1,
      title: `Discovery & scaffold for ${product}`,
      deliverable: `Validated problem-solution fit and runnable project skeleton for ${product}.${stackNote}`,
      tasks: [
        `Run 8–12 user interviews on the core problem behind ${product}.`,
        `Initialize repo with ${techStack?.recommended[0] ?? "frontend"} + ${techStack?.recommended[1] ?? "backend"} and CI.`,
        `Implement auth and empty dashboard shell.`,
        `Define data models for core entities.`,
        `Set up staging and error monitoring.`,
      ],
    },
    {
      week: 2,
      title: `Core loop for ${product}`,
      deliverable: `End-to-end happy path: user completes the main job-to-be-done for ${product}.`,
      tasks: [
        `Build primary UI flow (create → process → view result).`,
        `Implement backend APIs with validation and pagination.`,
        `Connect intelligence layer with timeouts and fallbacks.`,
        `Add integration tests for the critical path.`,
        `Instrument signup, activation, and core action events.`,
      ],
    },
    {
      week: 3,
      title: `MVP hardening for ${product}`,
      deliverable: `Stable MVP ready for closed beta with known issues triaged.`,
      tasks: [
        `Fix P0 bugs from internal dogfooding.`,
        `Improve error states, loading UX, and empty states.`,
        `Add role-based access if multi-user.`,
        `Document API and deployment runbook.`,
        `Prepare beta invite list and onboarding checklist.`,
      ],
    },
  ];

  if (weeks <= 3) return core;

  const extra = buildExtensionWeeks(4, weeks, product, summary, techStack);
  return [...core, ...extra].map((w, i) => ({ ...w, week: i + 1 }));
}

function buildFallbackTasks(
  product: string,
  summary: string,
  techStack?: TechStackSummary,
  sprintCount = 5,
): CursorTask[] {
  const fe = techStack?.recommended.find((s) => /react|vue|next|vite|tanstack/i.test(s)) ?? "React + Vite";
  const be = techStack?.recommended.find((s) => /fastapi|node|django|express|postgres/i.test(s)) ?? "FastAPI";
  const ai = techStack?.recommended.find((s) => /openai|llm|langchain|anthropic|ml/i.test(s)) ?? "OpenRouter LLM API";

  const base: CursorTask[] = [
    {
      id: "FE-001",
      domain: "frontend",
      title: `${product} onboarding & auth screens`,
      description: summary,
      tech_stack: [fe, "TanStack Router", "Tailwind CSS"],
      implementation_steps: [
        `Create \`src/routes/onboarding.tsx\` with 3-step wizard for ${product}`,
        "Add form validation and persist draft to localStorage",
        `Wire signup/login to backend \`/api/auth/*\` endpoints`,
        "Redirect to dashboard after first successful login",
      ],
      acceptance_criteria: ["New user completes onboarding in <90s", "Auth errors shown inline", "Mobile layout tested"],
      priority: "P0",
      sprint: 1,
    },
    {
      id: "BE-001",
      domain: "backend",
      title: `${product} core API & data layer`,
      description: `REST API backing ${product}'s primary workflow.`,
      tech_stack: [be, "PostgreSQL", "Pydantic/SQLAlchemy or Prisma"],
      implementation_steps: [
        "Define schema for users + primary domain entities",
        "Implement CRUD routes with auth middleware",
        "Add request validation and OpenAPI docs",
        "Write pytest/integration tests for happy path",
      ],
      acceptance_criteria: ["All routes require auth except /health", "OpenAPI spec generated", "Tests pass in CI"],
      priority: "P0",
      sprint: 1,
    },
    {
      id: "AI-001",
      domain: "ai_ml",
      title: `${product} intelligence pipeline`,
      description: `Model/router layer for ${product}'s core automation.`,
      tech_stack: [ai, be],
      implementation_steps: [
        "Create service module with retry + timeout wrapper",
        "Version prompts/config in repo",
        "Log latency and token usage per request",
        "Add fallback when upstream model fails",
      ],
      acceptance_criteria: ["P95 latency under 8s", "Graceful degradation documented", "Costs logged per session"],
      priority: "P1",
      sprint: 2,
    },
    {
      id: "FE-002",
      domain: "frontend",
      title: `${product} main dashboard`,
      description: `Primary workspace where users interact with ${product} daily.`,
      tech_stack: [fe, "React Query or TanStack Query"],
      implementation_steps: [
        "Build dashboard layout with sidebar + main panel",
        "Fetch and display core metrics from /api/dashboard",
        "Add skeleton loaders and empty states",
        "Implement real-time or polling updates for live data",
      ],
      acceptance_criteria: ["Dashboard loads in <2s on 4G", "Empty state guides first action", "Errors retry automatically"],
      priority: "P0",
      sprint: 2,
    },
    {
      id: "BE-002",
      domain: "backend",
      title: `${product} background jobs & webhooks`,
      description: "Async processing for long-running operations.",
      tech_stack: [be, "Redis/Celery or BullMQ"],
      implementation_steps: [
        "Set up job queue worker process",
        "Implement webhook handlers with signature verification",
        "Add dead-letter queue for failed jobs",
        "Expose job status endpoint for frontend polling",
      ],
      acceptance_criteria: ["Jobs retry 3x with backoff", "Webhook idempotency keys enforced", "Status API documented"],
      priority: "P1",
      sprint: 2,
    },
    {
      id: "DS-001",
      domain: "design",
      title: `${product} design system & key flows`,
      description: "Component library and high-fidelity screens for dev handoff.",
      tech_stack: ["Figma", "shadcn/ui tokens"],
      implementation_steps: [
        "Define color, type, and spacing tokens",
        "Design onboarding, dashboard, and settings screens",
        "Spec responsive breakpoints and interaction states",
        "Export assets and link frames in implementation tasks",
      ],
      acceptance_criteria: ["WCAG AA contrast on primary actions", "Mobile + desktop frames complete", "Dev handoff doc published"],
      priority: "P1",
      sprint: 1,
    },
    {
      id: "MK-001",
      domain: "marketing",
      title: `${product} launch landing page`,
      description: `Conversion page explaining ${product}'s value proposition.`,
      tech_stack: [fe, "Vercel/Netlify"],
      implementation_steps: [
        "Write hero, problem, solution, and CTA sections",
        "Add waitlist or signup form connected to CRM",
        "Optimize meta tags and OG images",
        "Set up analytics and conversion tracking",
      ],
      acceptance_criteria: ["Lighthouse performance >85", "Form submissions stored", "CTA tracked in analytics"],
      priority: "P1",
      sprint: 3,
    },
    {
      id: "BZ-001",
      domain: "business",
      title: `${product} pricing & beta GTM`,
      description: "Validate willingness to pay and first acquisition channel.",
      tech_stack: ["Stripe (optional)", "Notion/Airtable CRM"],
      implementation_steps: [
        "Document 2-tier pricing hypothesis with unit economics",
        "Run 10 customer discovery calls with pricing questions",
        "Launch beta invite campaign to one ICP channel",
        "Track CAC and activation rate for first 25 users",
      ],
      acceptance_criteria: ["Pricing doc approved", "≥10 discovery notes logged", "Beta cohort recruited"],
      priority: "P2",
      sprint: Math.min(sprintCount, 3),
    },
  ];

  // Spread additional sprint-specific tasks when plan is longer than 3 weeks
  for (let s = 4; s <= sprintCount; s++) {
    base.push({
      id: `SP-${String(s).padStart(2, "0")}`,
      domain: s % 2 === 0 ? "backend" : "frontend",
      title: sprintPhaseLabel(s) + ` (${product})`,
      description: `Sprint ${s} focus for ${product}: ${sprintPhaseLabel(s).toLowerCase()}.`,
      tech_stack: techStack?.recommended.slice(0, 3) ?? [fe, be],
      implementation_steps: [
        `Review week-${s} roadmap deliverable and break into daily tasks`,
        `Ship sprint ${s} scope behind feature flag if needed`,
        `Demo sprint ${s} outcome to team and update backlog`,
      ],
      acceptance_criteria: [`Sprint ${s} deliverable met`, "No open P0 bugs for sprint scope"],
      priority: s <= 5 ? "P1" : "P2",
      sprint: s,
    });
  }

  return base;
}

export function exportImplementationPlanMarkdown(plan: EvaluationPlan): string {
  const lines = [
    `# Implementation Plan — ${plan.title}`,
    "",
    plan.ideaSummary,
    "",
  ];

  if (plan.techStack?.recommended.length) {
    lines.push("## Recommended Stack", "");
    for (const item of plan.techStack.recommended) lines.push(`- ${item}`);
    if (plan.techStack.timeToMvp) lines.push(`- **Time to MVP:** ${plan.techStack.timeToMvp}`);
    if (plan.techStack.mvpComplexity) lines.push(`- **Complexity:** ${plan.techStack.mvpComplexity}`);
    lines.push("");
  }

  lines.push(`## ${plan.weekCount}-Week MVP Roadmap`, "");
  for (const week of plan.mvpRoadmap) {
    lines.push(`### Week ${week.week}: ${week.title}`, "", `**Deliverable:** ${week.deliverable}`, "");
    for (const task of week.tasks) lines.push(`- [ ] ${task}`);
    lines.push("");
  }

  const sprints = Array.from({ length: plan.sprintCount }, (_, i) => i + 1);
  for (const sprint of sprints) {
    const sprintTasks = plan.implementationTasks.filter((t) => t.sprint === sprint);
    if (!sprintTasks.length) continue;
    lines.push(`## Sprint ${sprint}`, "");
    for (const task of sprintTasks) {
      lines.push(`### ${task.id} · ${task.priority} · ${task.title}`, "", task.description, "");
      if (task.tech_stack?.length) {
        lines.push(`**Stack:** ${task.tech_stack.join(", ")}`, "");
      }
      if (task.implementation_steps?.length) {
        lines.push("**Implementation:**");
        for (const step of task.implementation_steps) lines.push(`- [ ] ${step}`);
        lines.push("");
      }
      if (task.acceptance_criteria.length) {
        lines.push("**Done when:**");
        for (const ac of task.acceptance_criteria) lines.push(`- [ ] ${ac}`);
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

export function copyTaskAsCursorPlan(task: CursorTask, product: string): string {
  const lines = [
    `## ${task.id} · ${task.priority} · ${task.title}`,
    `Product: ${product}`,
    "",
    task.description,
    "",
  ];
  if (task.tech_stack?.length) lines.push(`**Stack:** ${task.tech_stack.join(", ")}`, "");
  if (task.implementation_steps?.length) {
    lines.push("### Implementation");
    for (const step of task.implementation_steps) lines.push(`- [ ] ${step}`);
    lines.push("");
  }
  if (task.acceptance_criteria.length) {
    lines.push("### Done when");
    for (const ac of task.acceptance_criteria) lines.push(`- [ ] ${ac}`);
  }
  return lines.join("\n");
}
