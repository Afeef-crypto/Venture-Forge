import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AgentGrid } from "@/components/agent-grid";
import { checkBackendHealth, evaluateIdeaStreaming, RateLimitError } from "@/api/evaluate";
import { getEvaluation, notifyEvaluationsChanged, updateEvaluation } from "@/lib/local-evaluations";
import { buildEvaluationIdea, mapBackendToUiReport } from "@/lib/evaluation-mapper";
import { toScore100 } from "@/lib/score-scale";
import type { AgentLiveState } from "@/types/evaluation";
import { EVALUATION_AGENTS, JUDGE_AGENT } from "@/config/agents";

export const Route = createFileRoute("/_authenticated/evaluation/$id")({
  component: LiveEvaluation,
});

function LiveEvaluation() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(8);
  const [title, setTitle] = useState("Startup Evaluation");
  const [error, setError] = useState("");
  const [backendDown, setBackendDown] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentLiveState[]>(
    Array.from({ length: 6 }, () => "pending"),
  );
  const [agentScores, setAgentScores] = useState<(number | null)[]>(
    Array.from({ length: 6 }, () => null),
  );
  const [synthesizing, setSynthesizing] = useState(false);
  const [liveThoughts, setLiveThoughts] = useState<string[]>([]);

  useEffect(() => {
    const abort = new AbortController();
    let active = true;

    const run = async () => {
      setError("");
      setBackendDown(false);
      setProgress(8);
      setAgentStates(Array.from({ length: 6 }, () => "pending"));
      setAgentScores(Array.from({ length: 6 }, () => null));
      setSynthesizing(false);
      setLiveThoughts([]);

      const health = await checkBackendHealth();
      if (!active) return;
      if (!health.ok) {
        setBackendDown(true);
        setError(
          "Backend API is not reachable. Start it with: cd backend; python -m uvicorn main:app --reload --port 8000",
        );
        return;
      }

      const data = getEvaluation(id);
      if (!active) return;
      if (!data) {
        setError("Evaluation not found");
        return;
      }

      setTitle(data.title);
      if (data.status === "completed" && data.report) {
        navigate({ to: "/results/$id", params: { id }, replace: true });
        return;
      }

      setAgentStates(Array.from({ length: 6 }, () => "running"));

      const idea = buildEvaluationIdea({
        idea: data.idea,
        industry: data.industry,
        stage: data.stage,
        depth: data.evaluation_depth,
        research: data.use_web_research,
      }).slice(0, 8000);

      try {
        const { agentResults, report } = await evaluateIdeaStreaming(
          idea,
          {
            onAgentComplete: (index, result) => {
              if (!active) return;
              const name = EVALUATION_AGENTS[index]?.name ?? `Agent ${index + 1}`;
              setAgentStates((prev) => {
                const next = [...prev];
                next[index] = result.error ? "error" : "done";
                return next;
              });
            setAgentScores((prev) => {
              const next = [...prev];
              next[index] = toScore100(result.score ?? 0);
              return next;
            });
              setProgress(Math.min(88, 12 + (index + 1) * 14));
              if (result.summary) {
                setLiveThoughts((prev) => [...prev, `${name}: ${result.summary.slice(0, 120)}…`]);
              }
            },
            onSynthesisComplete: () => {
              if (!active) return;
              setSynthesizing(true);
              setProgress(92);
              setLiveThoughts((prev) => [...prev, `${JUDGE_AGENT.name}: Synthesizing final verdict…`]);
            },
            onError: (message) => {
              if (!active) return;
              setLiveThoughts((prev) => [...prev, message]);
            },
          },
          abort.signal,
        );

        const uiReport = mapBackendToUiReport(agentResults, report);
        const judgeScore = uiReport.overallScore;

        setSynthesizing(false);
        setAgentStates((prev) => {
          const next = [...prev];
          next[5] = "done";
          return next;
        });
        setAgentScores((prev) => {
          const next = [...prev];
          next[5] = judgeScore;
          return next;
        });
        setProgress(100);

        updateEvaluation(id, {
          status: "completed",
          progress: 100,
          overall_score: judgeScore,
          verdict: uiReport.verdict,
          agent_results: uiReport.agents,
          report: uiReport,
        });
        notifyEvaluationsChanged();

        if (!active) return;
        navigate({ to: "/results/$id", params: { id }, replace: true });
      } catch (e) {
        if (!active || (e instanceof DOMException && e.name === "AbortError")) return;
        setAgentStates((prev) => prev.map((s) => (s === "running" ? "error" : s)));
        if (e instanceof RateLimitError) {
          setError(`${e.message} Try again in ${e.retryAfterSeconds}s.`);
        } else {
          setError(e instanceof Error ? e.message : "Evaluation failed");
        }
      }
    };

    void run();
    return () => {
      active = false;
      abort.abort();
    };
  }, [id, navigate]);

  return (
    <AppShell>
      <Link to="/dashboard" className="mb-7 flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Evaluating: {title}</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Six Osiris agents are working in parallel via the FastAPI backend.
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs text-primary">
          <Activity className="forge-pulse h-4 w-4" />
          Streaming live
        </span>
      </header>

      {backendDown && (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="my-8 h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>

      <AgentGrid
        progress={progress}
        agentStates={agentStates}
        agentScores={agentScores}
        synthesizing={synthesizing}
        liveThoughts={liveThoughts}
      />

      {error && !backendDown && (
        <p className="mt-6 text-xs text-destructive">{error}</p>
      )}
    </AppShell>
  );
}
