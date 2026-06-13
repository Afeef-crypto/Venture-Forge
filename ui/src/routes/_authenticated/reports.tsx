import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Download, Eye, FileText, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });

function Reports() {
  const [rows, setRows] = useState<Tables<"evaluations">[]>([]);
  const [query, setQuery] = useState("");
  const [recentFirst, setRecentFirst] = useState(true);
  const [page, setPage] = useState(1);
  useEffect(() => { supabase.from("evaluations").select("*").eq("status", "completed").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? [])); }, []);
  const visible = useMemo(() => rows
    .filter((row) => row.title.toLowerCase().includes(query.toLowerCase()) || row.idea.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b) => recentFirst ? +new Date(b.updated_at)-+new Date(a.updated_at) : +new Date(a.updated_at)-+new Date(b.updated_at)), [rows, query, recentFirst]);
  const pageRows=visible.slice((page-1)*5,page*5);const pages=Math.max(1,Math.ceil(visible.length/5));
  const exportReport = (row: Tables<"evaluations">) => {
    const blob = new Blob([JSON.stringify(row.report, null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };
  return <AppShell><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl">All Evaluations</h1><p className="mt-2 text-xs text-muted-foreground">Your previous startup evaluations and reports.</p></div><div className="flex w-full gap-2 sm:w-auto"><div className="relative flex-1 sm:w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><Input value={query} onChange={(event)=>{setQuery(event.target.value);setPage(1)}} placeholder="Search reports…" className="pl-9"/></div><Button variant="outline" size="sm" onClick={()=>setRecentFirst(value=>!value)}><SlidersHorizontal/>Sort: {recentFirst?"Recent":"Oldest"}</Button></div></div><div className="mt-8 overflow-x-auto border border-border bg-card"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Idea</th><th>Overall Score</th><th>Status</th><th>Completed</th><th className="text-right pr-4">Actions</th></tr></thead><tbody>{pageRows.map((row)=><tr key={row.id} className="group border-b border-border transition-colors last:border-0 hover:bg-muted/40"><td className="p-4"><Link to="/results/$id" params={{id:row.id}} className="block"><b>{row.title}</b><p className="mt-1 max-w-sm truncate text-[10px] text-muted-foreground">{row.idea}</p></Link></td><td><Link to="/results/$id" params={{id:row.id}} className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full border border-primary/30 font-semibold">{row.overall_score ?? "—"}</span><span className="text-[9px] text-muted-foreground">/100</span></Link></td><td><Link to="/results/$id" params={{id:row.id}} className="text-success">● Completed</Link></td><td><Link to="/results/$id" params={{id:row.id}} className="text-muted-foreground">{new Date(row.updated_at).toLocaleString([], {month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})}</Link></td><td><div className="flex justify-end gap-1 pr-3"><Button variant="ghost" size="icon" asChild><Link to="/results/$id" params={{id:row.id}} aria-label={`Open ${row.title} report`}><FileText/></Link></Button><Button variant="ghost" size="icon" onClick={()=>navigator.clipboard.writeText(JSON.stringify(row.report,null,2))} aria-label={`Copy ${row.title}`}><Copy/></Button><Button variant="ghost" size="icon" onClick={()=>exportReport(row)} aria-label={`Download ${row.title}`}><Download/></Button><Button variant="ghost" size="icon" asChild><Link to="/results/$id" params={{id:row.id}} aria-label={`View ${row.title}`}><Eye/></Link></Button></div></td></tr>)}</tbody></table>{visible.length===0&&<div className="p-14 text-center"><p className="text-sm font-medium">No completed reports yet</p><p className="mt-2 text-xs text-muted-foreground">Run an evaluation to generate your first report.</p><Button variant="hero" size="sm" className="mt-5" asChild><Link to="/new-evaluation">New Evaluation</Link></Button></div>}</div>{visible.length>0&&<div className="mt-5 flex justify-center gap-1"><Button variant="ghost" size="icon" disabled={page===1} onClick={()=>setPage(value=>value-1)}><ChevronLeft/></Button>{Array.from({length:pages},(_,index)=><Button key={index} variant={page===index+1?"hero":"ghost"} size="icon" onClick={()=>setPage(index+1)}>{index+1}</Button>)}<Button variant="ghost" size="icon" disabled={page===pages} onClick={()=>setPage(value=>value+1)}><ChevronRight/></Button></div>}</div></AppShell>;
}