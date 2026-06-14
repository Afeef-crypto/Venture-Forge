import { Copy, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCheckbox } from "@/components/plan-checkbox";
import { copyTaskAsCursorPlan, domainLabel, type TechStackSummary } from "@/lib/evaluation-plan";
import { sprintPhaseLabel, sprintWeekRange } from "@/lib/plan-complexity";
import type { CursorTask, DomainTasks, MvpRoadmapWeek } from "@/types/evaluation";

interface ImplementationPlanSectionProps {
  evaluationId: string;
  title: string;
  ideaSummary: string;
  tasks: CursorTask[];
  domainTasks?: DomainTasks;
  techStack?: TechStackSummary;
  sprintCount: number;
  roadmap?: MvpRoadmapWeek[];
  complexityLabel?: string;
  compact?: boolean;
}

const PRIORITY_STYLES: Record<string, string> = {
  P0: "bg-destructive/10 text-destructive",
  P1: "bg-warning/10 text-warning",
  P2: "bg-muted text-muted-foreground",
};

export function ImplementationPlanSection({
  evaluationId,
  title,
  ideaSummary,
  tasks,
  domainTasks,
  techStack,
  sprintCount,
  roadmap,
  complexityLabel,
  compact,
}: ImplementationPlanSectionProps) {
  if (tasks.length === 0) return null;

  const displaySprints = Array.from({ length: sprintCount }, (_, i) => i + 1);

  return (
    <section className={compact ? "" : "mt-2"}>
      {!compact && (
        <header className="mb-6">
          <h2 className="font-sans text-sm font-semibold">Implementation Plan</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {sprintCount}-sprint execution plan for{" "}
            <span className="font-medium text-foreground">{title}</span>
            {complexityLabel ? (
              <span className="ml-2 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                {complexityLabel}
              </span>
            ) : null}
          </p>
        </header>
      )}

      {!compact && (
        <div className="mb-6 rounded-lg border border-border bg-zinc-950 p-5 font-mono text-[11px] leading-6 text-zinc-100">
          <p className="text-primary"># {title}</p>
          <p className="mt-2 text-zinc-400">{ideaSummary}</p>
          {techStack && techStack.recommended.length > 0 && (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="text-zinc-300">## Recommended Stack</p>
              {techStack.recommended.map((item) => (
                <p key={item} className="text-zinc-400">
                  - {item}
                </p>
              ))}
              {techStack.timeToMvp && <p className="text-zinc-500"># time_to_mvp: {techStack.timeToMvp}</p>}
              {techStack.mvpComplexity && (
                <p className="text-zinc-500"># complexity: {techStack.mvpComplexity}</p>
              )}
            </div>
          )}
        </div>
      )}

      {!compact && domainTasks && Object.values(domainTasks).some((list) => list.length > 0) && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 font-sans text-xs font-semibold">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Domain overview
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(domainTasks) as [keyof DomainTasks, string[]][]).map(([key, items]) =>
              items.length > 0 ? (
                <div key={key} className="border border-border bg-card p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {domainLabel(key)}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {items.map((item, i) => (
                      <PlanCheckbox
                        key={item}
                        evaluationId={evaluationId}
                        itemId={`domain-${key}-${i}`}
                        label={item}
                      />
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {displaySprints.map((sprint) => {
          const sprintTasks = tasks.filter((t) => t.sprint === sprint);
          const phase = sprintPhaseLabel(sprint, roadmap);
          return (
            <div key={sprint}>
              <div className="rounded-lg border-2 border-primary/25 bg-primary/5 px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Sprint {sprint}
                    <span className="ml-2 font-normal text-muted-foreground">
                      · {sprintWeekRange(sprint, sprintCount)}
                    </span>
                  </h3>
                  <span className="text-xs font-medium text-primary">
                    {sprintTasks.length} task{sprintTasks.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium leading-snug text-foreground">{phase}</p>
              </div>
              <div className="mt-3 space-y-4">
                {sprintTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No tasks assigned yet — see roadmap week {sprint} for deliverables.
                  </p>
                ) : (
                  sprintTasks.map((task) => (
                    <CursorPlanTaskCard
                      key={task.id}
                      evaluationId={evaluationId}
                      product={title}
                      task={task}
                      compact={compact}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CursorPlanTaskCard({
  evaluationId,
  product,
  task,
  compact,
}: {
  evaluationId: string;
  product: string;
  task: CursorTask;
  compact?: boolean;
}) {
  const copyTask = () => {
    void navigator.clipboard.writeText(copyTaskAsCursorPlan(task, product));
  };

  const steps = task.implementation_steps ?? [];
  const stack = task.tech_stack ?? [];

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">{task.id}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${PRIORITY_STYLES[task.priority] ?? ""}`}
            >
              {task.priority}
            </span>
            <span className="text-[10px] text-muted-foreground">{domainLabel(task.domain)}</span>
          </div>
          <h4 className="mt-1.5 text-sm font-semibold leading-snug">{task.title}</h4>
        </div>
        <Button variant="ghost" size="icon" onClick={copyTask} aria-label={`Copy ${task.title}`}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className={`px-4 py-4 ${compact ? "text-[11px]" : "text-xs"} leading-6`}>
        <p className="text-muted-foreground">{task.description}</p>

        {stack.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stack.map((item) => (
              <span
                key={item}
                className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {steps.length > 0 && (
          <div className="mt-4 rounded-md border border-border/80 bg-zinc-950/95 p-3 font-mono text-[11px]">
            <p className="mb-2 text-primary">// implementation</p>
            {steps.map((step, index) => (
              <PlanCheckbox
                key={step}
                evaluationId={evaluationId}
                itemId={`task-${task.id}-step-${index}`}
                label={step}
                mono
                onDark
              />
            ))}
          </div>
        )}

        {task.acceptance_criteria.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Done when
            </p>
            {task.acceptance_criteria.map((ac, index) => (
              <PlanCheckbox
                key={ac}
                evaluationId={evaluationId}
                itemId={`task-${task.id}-ac-${index}`}
                label={ac}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
