import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Copy, Download, Share2, TriangleAlert } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { getEvaluation } from "@/lib/local-evaluations";
import { resolveEvaluationReport } from "@/lib/evaluation-display";
import { getEvaluationPlan } from "@/lib/evaluation-plan";
import { isEvaluableVenture } from "@/lib/venture-evaluable";
import { RoadmapSection } from "@/components/roadmap-section";
import { ImplementationPlanSection } from "@/components/implementation-plan-section";
import type { UiAgentReport, UiEvaluationReport } from "@/types/evaluation";

type Report = UiEvaluationReport;
type Agent = UiAgentReport;

const search = z.object({ tab: z.string().catch("Overview") });

export const Route = createFileRoute("/_authenticated/results/$id")({
  validateSearch: search,
  component: Results,
});

function Results() {
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [evaluationRow, setEvaluationRow] = useState<ReturnType<typeof getEvaluation>>(undefined);

  useEffect(() => {
    const row = getEvaluation(id);
    setEvaluationRow(row);
    setIdeaTitle(row?.title ?? "");
    setReport(row ? resolveEvaluationReport(row) : null);
  }, [id]);

  const evaluable =
    report != null &&
    report.isEvaluableVenture !== false &&
    isEvaluableVenture(report, report.backend?.agent_results);

  useEffect(() => {
    if (report && !evaluable && (tab === "Roadmap" || tab === "Implementation Plan")) {
      void navigate({ to: "/results/$id", params: { id }, search: { tab: "Overview" }, replace: true });
    }
  }, [report, evaluable, tab, id, navigate]);

  const plan = evaluationRow ? getEvaluationPlan(evaluationRow) : null;

  if (!report) return <AppShell><div className="animate-pulse text-sm text-muted-foreground">Loading investor report…</div></AppShell>;

  const tabs = [
    "Overview",
    ...(evaluable ? (["Roadmap", "Implementation Plan"] as const) : []),
    ...report.agents.map((a) => a.name),
  ];
  const activeAgent = report.agents.find(a => a.name === tab);

  const markdown = `# Venture Forge Report\n\n## Score: ${report.overallScore}/100 — ${report.verdict}\n\n${report.executiveSummary}\n\n## Investor Hook\n${report.investorHook}`;
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    a.download = "venture-forge-report.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back to Dashboard
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.share?.({ title: "Venture Forge Report", text: report.investorHook })}>
            <Share2 />Share
          </Button>
          <Button variant="hero" size="sm" onClick={download}><Download />Export Report</Button>
        </div>
      </div>

      <div className="mt-7 flex gap-6 overflow-x-auto border-b border-border">
        {tabs.map(name => (
          <Link
            key={name}
            to="/results/$id"
            params={{ id }}
            search={{ tab: name }}
            className={`shrink-0 border-b-2 pb-3 text-xs transition-colors ${
              name === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {name}
          </Link>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "Overview" ? (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {!evaluable && (
              <div className="mt-6 rounded-md border border-warning/40 bg-warning/10 px-5 py-4 text-xs leading-6 text-foreground">
                <b>Not a startup idea.</b> Osiris will not generate a roadmap or implementation plan for this
                submission. Provide a concrete product description: who you serve, what problem you solve, and what
                you are building.
              </div>
            )}
            <section className="mt-8 grid gap-5 border border-border bg-card p-6 md:grid-cols-[220px_1fr]">
              <div className="flex items-center gap-5">
                <ScoreRing score={report.overallScore} />
                <div>
                  <p className="text-xs text-muted-foreground">Overall Score</p>
                  <b className="text-primary">{report.verdict}</b>
                </div>
              </div>
              <div>
                <h2 className="font-sans text-xs font-semibold">Executive Summary</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{report.executiveSummary}</p>
              </div>
            </section>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {([["Investor Hook", report.investorHook], ["Biggest Strength", report.biggestStrength], ["Biggest Risk", report.biggestRisk], ["Market Opportunity", report.marketOpportunity]] as const).map(([t, v]) => (
                <article key={t} className="border border-border bg-card p-5">
                  <p className="text-[10px] uppercase tracking-wider text-primary">{t}</p>
                  <p className="mt-3 text-xs leading-5">{v}</p>
                </article>
              ))}
            </div>

            <section className="mt-8 border border-border bg-card p-6">
              <h2 className="font-sans text-sm font-semibold">Score Breakdown</h2>
              <div className="mt-6 space-y-4">
                {report.agents.map((a) => (
                  <div key={a.name}>
                    <div className="flex justify-between text-xs">
                      <Link
                        to="/results/$id"
                        params={{ id }}
                        search={{ tab: a.name }}
                        className="transition-colors hover:text-primary"
                      >
                        {a.name}
                      </Link>
                      <b>{a.score} /100</b>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden bg-muted">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${a.score}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {evaluable && plan && plan.mvpRoadmap.length > 0 && (
              <div className="mt-8 border border-border bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-sans text-sm font-semibold">MVP Roadmap Preview</h2>
                  <Link to="/results/$id" params={{ id }} search={{ tab: "Roadmap" }} className="text-xs text-primary story-link">
                    View full roadmap
                  </Link>
                </div>
                <RoadmapSection
                  evaluationId={plan.id}
                  title={plan.title}
                  roadmap={plan.mvpRoadmap.slice(0, 1)}
                  weekCount={plan.weekCount}
                  complexityLabel={plan.complexityLabel}
                  compact
                />
              </div>
            )}

            {evaluable && plan && plan.implementationTasks.length > 0 && (
              <div className="mt-5 border border-border bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-sans text-sm font-semibold">Implementation Plan Preview</h2>
                  <Link to="/results/$id" params={{ id }} search={{ tab: "Implementation Plan" }} className="text-xs text-primary story-link">
                    View all tasks
                  </Link>
                </div>
                <ImplementationPlanSection
                  evaluationId={plan.id}
                  title={plan.title}
                  ideaSummary={plan.ideaSummary}
                  tasks={plan.implementationTasks.slice(0, 2)}
                  techStack={plan.techStack}
                  sprintCount={plan.sprintCount}
                  roadmap={plan.mvpRoadmap}
                  complexityLabel={plan.complexityLabel}
                  compact
                />
              </div>
            )}

            <Button variant="outline" className="mt-5" onClick={() => navigator.clipboard.writeText(markdown)}><Copy />Copy Report</Button>
          </motion.div>
        ) : tab === "Roadmap" && evaluable && plan ? (
          <motion.div key="roadmap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {plan ? (
              <>
                <header className="mt-8">
                  <h1 className="text-3xl">Roadmap for {ideaTitle || plan.title}</h1>
                </header>
                <div className="mt-7 border border-border bg-card p-6">
                  <RoadmapSection
                    evaluationId={plan.id}
                    title={plan.title}
                    roadmap={plan.mvpRoadmap}
                    weekCount={plan.weekCount}
                    complexityLabel={plan.complexityLabel}
                  />
                </div>
              </>
            ) : (
              <p className="mt-8 text-sm text-muted-foreground">No roadmap available for this evaluation yet.</p>
            )}
          </motion.div>
        ) : tab === "Implementation Plan" && evaluable && plan ? (
          <motion.div key="plan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {plan ? (
              <>
                <header className="mt-8">
                  <h1 className="text-3xl">Implementation Plan — {ideaTitle || plan.title}</h1>
                </header>
                <div className="mt-7 border border-border bg-card p-6">
                  <ImplementationPlanSection
                    evaluationId={plan.id}
                    title={plan.title}
                    ideaSummary={plan.ideaSummary}
                    tasks={plan.implementationTasks}
                    domainTasks={plan.domainTasks}
                    techStack={plan.techStack}
                    sprintCount={plan.sprintCount}
                    roadmap={plan.mvpRoadmap}
                    complexityLabel={plan.complexityLabel}
                  />
                </div>
              </>
            ) : (
              <p className="mt-8 text-sm text-muted-foreground">No implementation plan available for this evaluation yet.</p>
            )}
          </motion.div>
        ) : activeAgent ? (
          <motion.div key={activeAgent.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <header className="mt-8 flex items-start justify-between">
              <div>
                <h1 className="text-3xl">{activeAgent.name}</h1>
                <p className="mt-1 text-xs text-muted-foreground">Detailed specialist analysis</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Score <b className="block text-3xl text-success">{activeAgent.score}<span className="text-xs"> /100</span></b>
              </div>
            </header>
            <section className="mt-7 border border-border bg-card p-7">
              <h2 className="font-sans text-sm font-semibold">Detailed Analysis</h2>
              <div className="mt-5 space-y-6">
                {(activeAgent.analysisBlocks?.length
                  ? activeAgent.analysisBlocks
                  : [{ heading: "Analysis", body: activeAgent.analysis }]
                ).map((block) => (
                  <div key={block.heading} className="border-b border-border pb-6 last:border-0 last:pb-0">
                    <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-primary">
                      {block.heading}
                    </h3>
                    {block.body && (
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{block.body}</p>
                    )}
                    {block.bullets && block.bullets.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {block.bullets.map((item) => (
                          <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="font-sans text-xs font-semibold">Recommendations</h3>
                  <ul className="mt-4 space-y-3">
                    {activeAgent.recommendations.map((x) => (
                      <li key={x} className="flex gap-2 text-xs leading-5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-sans text-xs font-semibold">Key Risks</h3>
                  <ul className="mt-4 space-y-3">
                    {activeAgent.risks.length > 0 ? (
                      activeAgent.risks.map((x) => (
                        <li key={x} className="flex gap-2 text-xs leading-5">
                          <TriangleAlert className="h-4 w-4 shrink-0 text-warning" />
                          {x}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-muted-foreground">No major risks flagged.</li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
            <div className="mt-5 border-l-2 border-primary bg-accent p-5 text-xs">
              <b>Recommendation</b>
              <p className="mt-2 text-muted-foreground">
                {activeAgent.recommendation ||
                  activeAgent.recommendations[0] ||
                  "Proceed with a focused MVP and validate the critical assumption before expanding scope."}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AppShell>
  );
}
