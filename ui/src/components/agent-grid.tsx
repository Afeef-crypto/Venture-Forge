import { motion } from "framer-motion";
import { BarChart3, BriefcaseBusiness, Code2, Megaphone, Radar } from "lucide-react";
import { VentureForgeLogo } from "@/components/venture-forge-logo";
import { EVALUATION_AGENTS, JUDGE_AGENT } from "@/config/agents";
import type { AgentLiveState } from "@/types/evaluation";

const icons = [BriefcaseBusiness, Code2, BarChart3, Megaphone, Radar] as const;

type AgentGridProps = {
  progress?: number;
  agentStates?: AgentLiveState[];
  agentScores?: (number | null)[];
  synthesizing?: boolean;
  liveThoughts?: string[];
};

function stateProgress(state: AgentLiveState | undefined, fallback: number): number {
  if (state === "done") return 100;
  if (state === "running") return 72;
  if (state === "error") return 100;
  return Math.max(8, Math.min(100, fallback));
}

export function AgentGrid({
  progress = 100,
  agentStates,
  agentScores,
  synthesizing = false,
  liveThoughts = [],
}: AgentGridProps) {
  const rows = [
    ...EVALUATION_AGENTS.map((agent, index) => ({ ...agent, index })),
    { ...JUDGE_AGENT, index: EVALUATION_AGENTS.length },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((agent, i) => {
        const Icon = icons[i];
        const isJudge = agent.index === EVALUATION_AGENTS.length;
        const state = agentStates?.[agent.index];
        const p = isJudge
          ? synthesizing
            ? 55
            : state === "done"
              ? 100
              : stateProgress(state, progress - agent.index * 7)
          : stateProgress(state, progress - agent.index * 7);
        const score = agentScores?.[agent.index];
        const status =
          state === "done"
            ? score != null
              ? `Score ${Math.round(score)} / 100`
              : "Analysis complete"
            : state === "running" || (isJudge && synthesizing)
              ? agent.role
              : state === "error"
                ? "Analysis failed"
                : agent.role;

        return (
          <motion.article
            key={agent.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="border border-border bg-card p-5"
          >
            <div className="flex items-start">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full ${
                  i % 2 ? "bg-foreground text-background" : "bg-primary text-primary-foreground"
                }`}
              >
                {isJudge ? <VentureForgeLogo variant="mark" size={18} title="" /> : Icon && <Icon className="h-4 w-4" />}
              </span>
            </div>
            <h3 className="mt-5 font-sans text-sm font-semibold">{agent.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{status}</p>
            <div className="mt-5 h-1 bg-muted">
              <motion.div
                className={`h-full ${state === "error" ? "bg-destructive" : "bg-primary"}`}
                initial={{ width: 0 }}
                animate={{ width: `${p}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </motion.article>
        );
      })}
      {liveThoughts.length > 0 && (
        <div className="sm:col-span-2 lg:col-span-3 border border-border bg-card/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live thoughts</p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {liveThoughts.slice(-5).map((thought) => (
              <li key={thought}>• {thought}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
