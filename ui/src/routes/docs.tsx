import { createFileRoute, Link } from "@tanstack/react-router";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ArrowRight, BookOpen, ChevronLeft, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { DOCS_SECTIONS } from "@/content/docs-sections";
import { DEFAULT_NEW_EVALUATION_SEARCH } from "@/lib/new-evaluation-search";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

function DocsPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div
          className="orb orb-a -top-32 -left-20 h-[420px] w-[420px]"
          style={{ background: "color-mix(in oklab, var(--primary) 35%, transparent)" }}
        />
        <div
          className="orb orb-b top-40 right-0 h-[520px] w-[520px]"
          style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
        />
        <div
          className="orb orb-a bottom-0 left-1/3 h-[380px] w-[380px]"
          style={{ background: "color-mix(in oklab, var(--primary) 18%, transparent)" }}
        />
      </div>

      <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Back to home"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <Brand />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="hero" size="sm" className="btn-shine" asChild>
              <Link to="/new-evaluation" search={DEFAULT_NEW_EVALUATION_SEARCH}>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 py-16 lg:px-12 lg:py-20">
        <div className="max-w-4xl">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            Venture Forge documentation
          </p>
          <h1 className="mt-4 text-4xl">Build with investor-grade clarity.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Everything you need to evaluate an idea, understand the six-agent report and move from insight to execution.
          </p>
          <Button variant="hero" className="mt-7" asChild>
            <Link to="/new-evaluation" search={DEFAULT_NEW_EVALUATION_SEARCH}>
              Start an evaluation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <AccordionPrimitive.Root type="single" collapsible className="mt-12 flex w-full flex-col gap-4">
          {DOCS_SECTIONS.map((section) => (
            <AccordionPrimitive.Item
              key={section.id}
              value={section.id}
              className="overflow-hidden border border-border/80 bg-card/90 shadow-sm backdrop-blur-sm"
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger
                  className={cn(
                    "group flex min-h-[5.5rem] flex-1 items-center justify-between gap-6 px-8 py-7 text-left transition-colors",
                    "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "data-[state=open]:[&_svg]:rotate-45",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-5">
                    <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                      {section.id}
                    </span>
                    <span className="font-sans text-lg font-semibold sm:text-xl">{section.title}</span>
                  </div>
                  <motion.span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary"
                    whileTap={{ scale: 0.92 }}
                  >
                    <Plus className="h-5 w-5 shrink-0 transition-transform duration-200" />
                  </motion.span>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="border-t border-border px-8 pb-8 pt-5">
                  <p className="text-base leading-8 text-muted-foreground">{section.body}</p>
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>

        <section className="mt-10 max-w-4xl border-l-2 border-primary bg-accent/90 p-6 backdrop-blur-sm">
          <h2 className="font-sans text-sm font-semibold">How scoring works</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Each specialist scores its domain from 0–100. Venture Forge combines market opportunity, problem intensity,
            solution quality, business model, execution readiness and synthesis into one weighted score and verdict.
          </p>
        </section>
      </div>
    </main>
  );
}
