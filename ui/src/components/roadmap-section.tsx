import { Clock } from "lucide-react";
import { PlanCheckbox } from "@/components/plan-checkbox";
import { roadmapHeading } from "@/lib/plan-complexity";
import type { MvpRoadmapWeek } from "@/types/evaluation";

interface RoadmapSectionProps {
  evaluationId: string;
  title: string;
  roadmap: MvpRoadmapWeek[];
  weekCount: number;
  complexityLabel?: string;
  compact?: boolean;
}

export function RoadmapSection({
  evaluationId,
  title,
  roadmap,
  weekCount,
  complexityLabel,
  compact,
}: RoadmapSectionProps) {
  if (roadmap.length === 0) return null;

  return (
    <section className={compact ? "" : "mt-2"}>
      {!compact && (
        <header className="mb-6">
          <h2 className="font-sans text-lg font-semibold">{roadmapHeading(weekCount)}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Week-by-week build plan for{" "}
            <span className="font-medium text-foreground">{title}</span>
            {complexityLabel ? (
              <span className="ml-2 rounded bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                {complexityLabel}
              </span>
            ) : null}
          </p>
        </header>
      )}

      <div className={`relative ${compact ? "" : "ml-3 border-l border-border pl-8"}`}>
        {roadmap.map((week) => (
          <article
            key={week.week}
            className={`relative border border-border bg-card p-6 ${compact ? "mb-4 last:mb-0" : "mb-6 last:mb-0"}`}
          >
            {!compact && (
              <span className="absolute -left-[2.55rem] top-7 h-4 w-4 rounded-full border-4 border-background bg-primary" />
            )}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Week {week.week}</p>
                <h3 className="mt-1.5 text-xl font-semibold leading-snug text-foreground">{week.title}</h3>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                {week.tasks.length} tasks
              </span>
            </div>

            <div className="mt-5 rounded-md border border-border bg-muted/40 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Week deliverable</p>
              <p className="mt-2.5 text-base leading-7 text-foreground">{week.deliverable}</p>
            </div>

            {week.tasks.length > 0 && (
              <div className="mt-5 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Implementation checklist
                </p>
                {week.tasks.map((task, index) => (
                  <PlanCheckbox
                    key={`${week.week}-${index}`}
                    evaluationId={evaluationId}
                    itemId={`roadmap-w${week.week}-t${index}`}
                    label={task}
                    size="md"
                  />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
