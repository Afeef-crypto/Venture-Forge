import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  isPlanItemChecked,
  notifyPlanChecksChanged,
  togglePlanItemChecked,
  PLAN_CHECKS_EVENT,
} from "@/lib/plan-checks";

interface PlanCheckboxProps {
  evaluationId: string;
  itemId: string;
  label: string;
  mono?: boolean;
  /** Use on dark code blocks so label text stays readable. */
  onDark?: boolean;
}

export function PlanCheckbox({ evaluationId, itemId, label, mono, onDark }: PlanCheckboxProps) {
  const [checked, setChecked] = useState(() => isPlanItemChecked(evaluationId, itemId));

  useEffect(() => {
    const sync = () => setChecked(isPlanItemChecked(evaluationId, itemId));
    window.addEventListener(PLAN_CHECKS_EVENT, sync);
    return () => window.removeEventListener(PLAN_CHECKS_EVENT, sync);
  }, [evaluationId, itemId]);

  const toggle = () => {
    const next = togglePlanItemChecked(evaluationId, itemId);
    setChecked(next);
    notifyPlanChecksChanged();
  };

  return (
    <label
      className={`flex cursor-pointer gap-2.5 rounded-sm py-1 transition-colors ${
        onDark ? "hover:bg-zinc-800/60" : "hover:bg-muted/40"
      } ${mono ? "font-mono text-[11px] leading-5" : "text-xs leading-5"}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={toggle}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : onDark
              ? "border-zinc-500 bg-zinc-900"
              : "border-border bg-background"
        }`}
      >
        {checked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </button>
      <span
        className={
          checked
            ? onDark
              ? "text-zinc-500 line-through"
              : "text-muted-foreground line-through"
            : onDark
              ? "text-zinc-100"
              : "text-foreground"
        }
      >
        {label}
      </span>
    </label>
  );
}
