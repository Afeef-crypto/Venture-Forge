import { createFileRoute } from "@tanstack/react-router";
import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { resetDemoData } from "@/lib/local-evaluations";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

function Settings() {
  const [msg, setMsg] = useState("");

  const reset = () => {
    resetDemoData();
    setMsg("Demo data restored. Refresh the dashboard to see seeded MVP reports.");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl">Demo Settings</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Local hackathon mode — no sign-in required. Evaluations are stored in this browser only.
        </p>

        <section className="mt-8 space-y-4 border border-border bg-card p-6">
          <h2 className="font-sans text-sm font-semibold">Local storage</h2>
          <p className="text-xs leading-5 text-muted-foreground">
            New evaluations and reports are saved to <code className="text-foreground">localStorage</code>. Three demo MVP projects
            (AI Study Companion, FinTrack, LocalEats) are seeded on first visit.
          </p>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw />
            Reset demo data
          </Button>
          {msg && (
            <p className="flex items-center gap-2 text-xs text-primary">
              <Check className="h-3 w-3" />
              {msg}
            </p>
          )}
        </section>

        <section className="mt-6 space-y-2 border border-border bg-card p-6 text-xs text-muted-foreground">
          <h2 className="font-sans text-sm font-semibold text-foreground">Backend</h2>
          <p>
            Live evaluations call the FastAPI backend at{" "}
            <code className="text-foreground">http://127.0.0.1:8000</code>. Start it with:
          </p>
          <pre className="mt-2 overflow-x-auto rounded border border-border bg-muted/40 p-3 text-[11px]">
            cd backend{"\n"}python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
          </pre>
        </section>
      </div>
    </AppShell>
  );
}
