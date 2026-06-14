import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoadmapSection } from "@/components/roadmap-section";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listEvaluationPlans, type EvaluationPlan } from "@/lib/evaluation-plan";
import { LOCAL_EVALUATIONS_EVENT } from "@/lib/local-evaluations";

export const Route = createFileRoute("/_authenticated/roadmap")({ component: RoadmapPage });

function RoadmapPage() {
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

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">Roadmap</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Idea-specific MVP build plan from your latest evaluations.
          </p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/new-evaluation">
            <Plus />
            New Evaluation
          </Link>
        </Button>
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
                <p className="text-[10px] uppercase tracking-wider text-primary">Building</p>
                <h2 className="mt-1 text-2xl">{plan.title}</h2>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">{plan.ideaSummary}</p>
                <Link
                  to="/results/$id"
                  params={{ id: plan.id }}
                  search={{ tab: "Roadmap" }}
                  className="mt-4 inline-block text-xs text-primary story-link"
                >
                  Open full report
                </Link>
              </header>
              <RoadmapSection
                evaluationId={plan.id}
                title={plan.title}
                roadmap={plan.mvpRoadmap}
                weekCount={plan.weekCount}
                complexityLabel={plan.complexityLabel}
              />
            </div>
          )}
        </>
      ) : (
        <div className="mt-10 border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Complete an evaluation to generate an idea-specific roadmap.</p>
          <Button variant="hero" className="mt-5" asChild>
            <Link to="/new-evaluation">Start evaluation</Link>
          </Button>
        </div>
      )}
    </AppShell>
  );
}
