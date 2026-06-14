import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { EVALUATION_AGENTS } from "@/config/agents";
import {
  getIdealTrack,
  IDEAL_AGENT_NAMES,
  resolveIdealTrackId,
  type IdealAgentName,
} from "@/content/ideal-startup-templates";
import { cn } from "@/lib/utils";

const agentNames = IDEAL_AGENT_NAMES as [IdealAgentName, ...IdealAgentName[]];

export const Route = createFileRoute("/_authenticated/new-evaluation")({
  validateSearch: (search) =>
    z
      .object({
        track: z.string().optional(),
        template: z.string().optional(),
        agent: z.enum(agentNames).catch("YC Partner" as IdealAgentName),
      })
      .parse(search),
  component: IdealStartupPage,
});

function IdealStartupPage() {
  const search = Route.useSearch();
  const trackId = resolveIdealTrackId(search.track, search.template);
  const track = getIdealTrack(trackId);
  const agent = search.agent;
  const content = track.agents[agent];

  return (
    <AppShell>
      <Button variant="ghost" size="sm" onClick={() => history.back()} className="mb-7">
        <ArrowLeft />
        Back
      </Button>

      <h1 className="text-4xl">Your Ideal Startup</h1>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        Think of it as: &ldquo;If this startup were excellent, what would I expect to see?&rdquo;
      </p>

      <div className="mt-8 flex gap-6 overflow-x-auto border-b border-border">
        {EVALUATION_AGENTS.map(({ name }) => (
          <Link
            key={name}
            to="/new-evaluation"
            search={{ track: trackId, agent: name }}
            className={cn(
              "shrink-0 border-b-2 pb-3 text-xs transition-colors",
              name === agent
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
          </Link>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${trackId}-${agent}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <header className="mt-8">
            <h2 className="text-3xl">{agent}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ideal characteristics for {track.title}
            </p>
          </header>

          <section className="mt-7 border border-border bg-card p-7">
            <h3 className="font-sans text-sm font-semibold">What excellence looks like</h3>
            <div className="mt-5 space-y-4">
              {content.summary.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="text-sm leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 space-y-6">
              {content.sections.map((section) => (
                <div key={section.heading} className="border-t border-border pt-6 first:border-0 first:pt-0">
                  <h4 className="font-sans text-xs font-semibold uppercase tracking-wide text-primary">
                    {section.heading}
                  </h4>
                  {section.body && (
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
                  )}
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {section.bullets.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
