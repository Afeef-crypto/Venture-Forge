import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Bot, FileText, Gauge, Rocket } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/docs")({ component: Docs });

const guides = [
  { icon: Rocket, title: "Run your first evaluation", text: "Submit an idea, choose the depth and let six specialist agents evaluate it in parallel." },
  { icon: Bot, title: "Understand the agents", text: "Learn what the YC Partner, Tech Auditor, CFO, Marketing, Demand and Synthesis agents inspect." },
  { icon: Gauge, title: "Read your score", text: "Interpret the overall score, category breakdown, risks, strengths and investment-readiness verdict." },
  { icon: FileText, title: "Use your deliverables", text: "Turn each completed report into a roadmap and Cursor-ready implementation tasks." },
];

function Docs() {
  return (
    <AppShell>
      <div className="max-w-5xl">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"><BookOpen className="h-3.5 w-3.5" />Venture Forge documentation</p>
        <h1 className="mt-4 text-4xl">Build with investor-grade clarity.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Everything you need to evaluate an idea, understand the six-agent report and move from insight to execution.</p>
        <Button variant="hero" className="mt-7" asChild><Link to="/new-evaluation">Start an evaluation <ArrowRight /></Link></Button>
        <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2">
          {guides.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="bg-background p-7">
              <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-primary" /><span className="text-[10px] text-muted-foreground">0{index + 1}</span></div>
              <h2 className="mt-8 font-sans text-sm font-semibold">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
        <section className="mt-10 border-l-2 border-primary bg-accent p-6">
          <h2 className="font-sans text-sm font-semibold">How scoring works</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Each specialist scores its domain from 0–100. Venture Forge combines market opportunity, problem intensity, solution quality, business model, execution readiness and synthesis into one weighted score and verdict.</p>
        </section>
      </div>
    </AppShell>
  );
}