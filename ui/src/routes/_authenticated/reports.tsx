import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Download, Eye, FileText, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listEvaluations, LOCAL_EVALUATIONS_EVENT, type LocalEvaluation } from "@/lib/local-evaluations";
import { resolveEvaluationDisplay } from "@/lib/evaluation-display";

export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });

function Reports() {
  const [rows, setRows] = useState<LocalEvaluation[]>([]);
  const [query, setQuery] = useState("");
  const [recentFirst, setRecentFirst] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = () => setRows(listEvaluations().filter((row) => row.status === "completed"));
    load();
    window.addEventListener(LOCAL_EVALUATIONS_EVENT, load);
    return () => window.removeEventListener(LOCAL_EVALUATIONS_EVENT, load);
  }, []);

  const visible = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            row.title.toLowerCase().includes(query.toLowerCase()) ||
            row.idea.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          recentFirst ? +new Date(b.updated_at) - +new Date(a.updated_at) : +new Date(a.updated_at) - +new Date(b.updated_at),
        ),
    [rows, query, recentFirst],
  );
  const pageRows = visible.slice((page - 1) * 5, page * 5);
  const pages = Math.max(1, Math.ceil(visible.length / 5));

  const exportReport = (row: LocalEvaluation) => {
    const blob = new Blob([JSON.stringify(row.report, null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl">All Evaluations</h1>
            <p className="mt-2 text-xs text-muted-foreground">Your previous startup evaluations and reports.</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search reports…"
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setRecentFirst((value) => !value)}>
              <SlidersHorizontal />
              Sort: {recentFirst ? "Recent" : "Oldest"}
            </Button>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-5 text-left">Idea</th>
                <th className="px-4 py-5 text-left">Overall Score</th>
                <th className="px-4 py-5 text-left">Status</th>
                <th className="px-4 py-5 text-left">Completed</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const display = resolveEvaluationDisplay(row);
                return (
                <tr key={row.id} className="group border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-5">
                    <Link to="/results/$id" params={{ id: row.id }} className="block">
                      <b className="text-base font-semibold">
                        {row.title}
                        {row.isDemo && <span className="ml-2 text-xs font-normal text-muted-foreground">(demo)</span>}
                      </b>
                      <p className="mt-2 max-w-md truncate text-sm leading-5 text-muted-foreground">{row.idea}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-5">
                    <Link to="/results/$id" params={{ id: row.id }} className="inline-flex">
                      {display.overallScore != null ? (
                        <ScoreRing score={display.overallScore} size="md" />
                      ) : (
                        <span className="grid h-12 w-12 place-items-center text-sm text-muted-foreground">—</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-5">
                    <Link to="/results/$id" params={{ id: row.id }} className="text-sm font-medium text-success">
                      ● Completed
                    </Link>
                  </td>
                  <td className="px-4 py-5">
                    <Link to="/results/$id" params={{ id: row.id }} className="text-sm text-muted-foreground">
                      {new Date(row.updated_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Link>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
                        <Link to="/results/$id" params={{ id: row.id }} aria-label={`Open ${row.title} report`}>
                          <FileText />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(row.report, null, 2))}
                        aria-label={`Copy ${row.title}`}
                      >
                        <Copy />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => exportReport(row)} aria-label={`Download ${row.title}`}>
                        <Download />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
                        <Link to="/results/$id" params={{ id: row.id }} aria-label={`View ${row.title}`}>
                          <Eye />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="p-14 text-center">
              <p className="text-sm font-medium">No completed reports yet</p>
              <p className="mt-2 text-xs text-muted-foreground">Run an evaluation to generate your first report.</p>
              <Button variant="hero" size="sm" className="mt-5" asChild>
                <Link to="/new-evaluation">New Evaluation</Link>
              </Button>
            </div>
          )}
        </div>

        {visible.length > 0 && (
          <div className="mt-5 flex justify-center gap-1">
            <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
              <ChevronLeft />
            </Button>
            {Array.from({ length: pages }, (_, index) => (
              <Button key={index} variant={page === index + 1 ? "hero" : "ghost"} size="icon" onClick={() => setPage(index + 1)}>
                {index + 1}
              </Button>
            ))}
            <Button variant="ghost" size="icon" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
