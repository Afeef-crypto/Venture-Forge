import type { MvpRoadmapWeek } from "@/types/evaluation";
import type { TechStackSummary } from "@/lib/evaluation-plan";

export interface PlanDuration {
  weeks: number;
  sprints: number;
  complexityLabel: string;
}

const SPRINT_PHASES = [
  "Discovery, validation & project scaffold",
  "Core architecture & auth foundation",
  "Primary user workflow & APIs",
  "Intelligence layer & integrations",
  "Dashboard, analytics & observability",
  "Hardening, performance & security",
  "Beta cohort & feedback loop",
  "Polish, onboarding & retention UX",
  "GTM assets & launch prep",
  "Public launch & post-MVP backlog",
];

/** Infer MVP length (3–10 weeks) and matching sprint count from Tech Auditor signals. */
export function inferPlanDuration(
  techStack?: TechStackSummary,
  existingWeeks?: number,
): PlanDuration {
  const complexity = (techStack?.mvpComplexity ?? "").toLowerCase().trim();

  let weeks = 5;
  if (complexity === "low") weeks = 3;
  else if (complexity === "medium") weeks = 5;
  else if (complexity === "high") weeks = 8;

  const timeStr = techStack?.timeToMvp ?? "";
  const rangeMatch = timeStr.match(/(\d+)\s*[-–]\s*(\d+)/);
  const singleMatch = timeStr.match(/(\d+)/);
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1], 10);
    const hi = parseInt(rangeMatch[2], 10);
    weeks = Math.round((lo + hi) / 2);
  } else if (singleMatch) {
    weeks = parseInt(singleMatch[1], 10);
  }

  if (existingWeeks && existingWeeks >= 3) {
    weeks = existingWeeks;
  }

  weeks = Math.min(10, Math.max(3, weeks));

  const complexityLabel =
    complexity === "low"
      ? "Low complexity"
      : complexity === "medium"
        ? "Medium complexity"
        : complexity === "high"
          ? "High complexity"
          : weeks <= 4
            ? "Low–medium complexity"
            : weeks <= 6
              ? "Medium complexity"
              : "High complexity";

  return { weeks, sprints: weeks, complexityLabel };
}

export function sprintPhaseLabel(sprint: number, roadmap?: MvpRoadmapWeek[]): string {
  const week = roadmap?.find((w) => w.week === sprint);
  if (week?.title) return week.title;
  return SPRINT_PHASES[sprint - 1] ?? `Sprint ${sprint} deliverables`;
}

export function sprintWeekRange(sprint: number, total: number): string {
  if (total <= 1) return "Week 1";
  return `Week ${sprint} of ${total}`;
}

export function roadmapHeading(weekCount: number): string {
  return `${weekCount}-Week MVP Roadmap`;
}
