import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ImplementationPlanSection } from "@/components/implementation-plan-section";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  exportImplementationPlanMarkdown,
  listEvaluationPlans,
  type EvaluationPlan,
} from "@/lib/evaluation-plan";
import { LOCAL_EVALUATIONS_EVENT } from "@/lib/local-evaluations";
import { DEFAULT_NEW_EVALUATION_SEARCH } from "@/lib/new-evaluation-search";

export const Route = createFileRoute("/_authenticated/tasks")({ component: ImplementationPlanPage });

function ImplementationPlanPage() {
  const [plans, setPlans] = useState<EvaluationPlan[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const load = () => {
      const next = listEvaluationPlans();
      setPlans(next);
      setSelectedId((prev) => (prev && next.some((p) => p.id === prev) ? prev : next[0]?.id ?? ""));
    };
    load();
    window.addEventListener(LOCAL_EVALUATIONS_EVENT, load);
    return () => window.removeEventListener(LOCAL_EVALUATIONS_EVENT, load);
  }, []);

  const plan = plans.find((p) => p.id === selectedId) ?? plans[0];

  const exportPlan = () => {
    if (!plan) return;
    const text = exportImplementationPlanMarkdown(plan);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
    a.download = `${plan.title.replace(/\s+/g, "-").toLowerCase()}-implementation-plan.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">Implementation Plan</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Elaborated development tasks generated from your evaluation — ready to execute.
          </p>
        </div>
        <div className="flex gap-2">
          {plan && (
            <Button variant="outline" onClick={exportPlan}>
              <Download />
              Export Plan
            </Button>
          )}
          <Button variant="hero" asChild>
            <Link to="/new-evaluation" search={DEFAULT_NEW_EVALUATION_SEARCH}>
              <Plus />
              New Evaluation
            </Link>
          </Button>
        </div>
      </div>

      {plans.length > 0 ? (
        <>
          <div className="mt-8 max-w-md">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Select evaluation
            </label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose an idea" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {plan && (
            <div className="mt-8">
              <header className="mb-6 border border-border bg-card p-6">
                <p className="text-[10px] uppercase tracking-wider text-primary">Implementation for</p>
                <h2 className="mt-1 text-2xl">{plan.title}</h2>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">{plan.ideaSummary}</p>
                <Link
                  to="/results/$id"
                  params={{ id: plan.id }}
                  search={{ tab: "Implementation Plan" }}
                  className="mt-4 inline-block text-xs text-primary story-link"
                >
                  Open in report
                </Link>
              </header>
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
          )}
        </>
      ) : (
        <div className="mt-10 border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Complete an evaluation to generate a development plan.</p>
          <Button variant="hero" className="mt-5" asChild>
            <Link to="/new-evaluation" search={DEFAULT_NEW_EVALUATION_SEARCH}>Start evaluation</Link>
          </Button>
        </div>
      )}
    </AppShell>
  );
}
