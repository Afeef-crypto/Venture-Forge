import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { AgentGrid } from "@/components/agent-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreRing } from "@/components/score-ring";
import {
  deleteEvaluation,
  listEvaluations,
  LOCAL_EVALUATIONS_EVENT,
  notifyEvaluationsChanged,
  type LocalEvaluation,
} from "@/lib/local-evaluations";
import { resolveEvaluationDisplay } from "@/lib/evaluation-display";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const [rows, setRows] = useState<LocalEvaluation[]>([]);
  const [q, setQ] = useState("");
  const [activeBin, setActiveBin] = useState<number | null>(null);

  useEffect(() => {
    const load = () => setRows(listEvaluations());
    load();
    window.addEventListener(LOCAL_EVALUATIONS_EVENT, load);
    return () => window.removeEventListener(LOCAL_EVALUATIONS_EVENT, load);
  }, []);

  const completed = rows.filter((row) => row.status === "completed" && resolveEvaluationDisplay(row).overallScore !== null);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = rows.filter((row) => new Date(row.created_at) >= monthStart);
  const monthCompleted = thisMonth.filter((row) => row.status === "completed" && resolveEvaluationDisplay(row).overallScore !== null);
  const average = monthCompleted.length
    ? Math.round(
        monthCompleted.reduce((sum, row) => sum + (resolveEvaluationDisplay(row).overallScore ?? 0), 0) /
          monthCompleted.length,
      )
    : 0;
  const bins = useMemo(
    () =>
      [0, 20, 40, 60, 80].map((min) =>
        completed.filter((row) => {
          const s = resolveEvaluationDisplay(row).overallScore ?? 0;
          return s >= min && s < (min === 80 ? 101 : min + 20);
        }).length,
      ),
    [completed],
  );
  const maxBin = Math.max(1, ...bins);
  const del = (id: string) => {
    deleteEvaluation(id);
    notifyEvaluationsChanged();
    setRows(listEvaluations());
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (needle && !row.title.toLowerCase().includes(needle)) return false;
      if (activeBin === null) return true;
      const s = resolveEvaluationDisplay(row).overallScore ?? -1;
      return s >= activeBin * 20 && s < (activeBin === 4 ? 101 : activeBin * 20 + 20);
    });
  }, [rows, q, activeBin]);

  return (
    <AppShell>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4"
      >
        <div className="min-w-0">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-muted-foreground"
          >
            Good afternoon, Founder
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 max-w-lg text-4xl leading-tight"
          >
            What startup are we evaluating <span className="shimmer-title">today?</span>
          </motion.h1>
        </div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
          <Button variant="hero" className="btn-shine btn-pulse" asChild>
            <Link to="/new-evaluation">
              <Plus />
              New Evaluation
            </Link>
          </Button>
        </motion.div>
      </motion.header>

      <div className="mt-10 grid gap-7 xl:grid-cols-[1fr_270px]">
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-sans text-sm font-semibold">Recent Evaluations</h2>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Your startup ideas, drafts, and reports — stored locally in this browser.
                </p>
              </div>
              <div className="relative w-full max-w-xs sm:w-auto">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports…" className="pl-9" />
              </div>
            </div>
            <div className="mt-4 overflow-x-auto border border-border">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Idea</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const display = resolveEvaluationDisplay(row);
                    return (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium">
                        {row.title}
                        {row.isDemo && <span className="ml-2 text-[9px] text-muted-foreground">(demo)</span>}
                      </td>
                      <td className="capitalize text-success">{row.status}</td>
                      <td>{display.overallScore ?? "—"}</td>
                      <td className="text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              to={row.status === "completed" ? "/results/$id" : "/evaluation/$id"}
                              params={{ id: row.id }}
                            >
                              View
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => del(row.id)} aria-label={`Delete ${row.title}`}>
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="p-10 text-center text-xs text-muted-foreground">
                  {rows.length === 0
                    ? "No evaluations yet."
                    : activeBin !== null
                      ? "No evaluations in this score range."
                      : "No evaluations match your search."}
                </p>
              )}
            </div>
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-5 mt-10 font-sans text-sm font-semibold">
            6 AI Agents, Working in Parallel.
          </motion.h2>
          <AgentGrid progress={86} />
        </section>

        <aside className="space-y-5">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} whileHover={{ y: -3 }} className="border border-border bg-card p-5">
            <h3 className="font-sans text-xs font-semibold">This Month Overview</h3>
            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Evaluations</p>
                <motion.b initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", delay: 0.4 }} className="inline-block text-2xl">
                  {thisMonth.length}
                </motion.b>
                <p className="mt-1 text-[9px] text-muted-foreground">{monthCompleted.length} completed this month</p>
              </div>
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-center">
                <ScoreRing score={average} size="sm" />
                <p className="mt-1 text-[9px] text-muted-foreground">Avg. Overall Score</p>
              </motion.div>
            </div>
            <div className="mt-5 grid grid-cols-2 border-t border-border pt-4 text-xs">
              <div>
                <motion.b initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.5 }} className="inline-block text-lg">
                  {completed.length}
                </motion.b>
                <p className="text-muted-foreground">Reports Generated</p>
              </div>
              <div>
                <motion.b initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.55 }} className="inline-block text-lg">
                  {rows.length}
                </motion.b>
                <p className="text-muted-foreground">Ideas Evaluated</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} whileHover={{ y: -3 }} className="border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Score Distribution</p>
              {activeBin !== null && (
                <button onClick={() => setActiveBin(null)} className="text-[9px] text-primary hover:underline">
                  Clear
                </button>
              )}
            </div>
            <div className="mt-7 flex h-24 items-end gap-2">
              {bins.map((count, i) => (
                <motion.button
                  key={i}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 120 }}
                  style={{ transformOrigin: "bottom" }}
                  onClick={() => setActiveBin(activeBin === i ? null : i)}
                  whileHover={{ y: -2 }}
                  className={`flex h-full flex-1 flex-col justify-end text-center transition-opacity ${activeBin !== null && activeBin !== i ? "opacity-40" : "opacity-100"} hover:opacity-100`}
                >
                  <span className="mb-1 text-[8px] text-muted-foreground">{count}</span>
                  <div
                    className={`${activeBin === i ? "bg-primary" : i === 4 ? "bg-primary/70" : "bg-primary/25"} min-h-1 w-full transition-all hover:bg-primary`}
                    style={{ height: `${Math.max(8, (count / maxBin) * 100)}%` }}
                  />
                  <span className="mt-2 whitespace-nowrap text-[8px] text-muted-foreground">
                    {i * 20}-{i === 4 ? 100 : i * 20 + 19}
                  </span>
                </motion.button>
              ))}
            </div>
            {activeBin !== null && (
              <p className="mt-3 text-[10px] text-muted-foreground">
                Showing {filtered.length} idea{filtered.length === 1 ? "" : "s"} scoring {activeBin * 20}-{activeBin === 4 ? 100 : activeBin * 20 + 19}.
              </p>
            )}
          </motion.div>
        </aside>
      </div>

    </AppShell>
  );
}
