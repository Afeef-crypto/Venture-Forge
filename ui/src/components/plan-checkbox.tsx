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
  /** Slightly larger labels for roadmap / plan headers. */
  size?: "sm" | "md";
}

export function PlanCheckbox({ evaluationId, itemId, label, mono, onDark, size = "sm" }: PlanCheckboxProps) {
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

  const textClass =
    size === "md"
      ? mono
        ? "font-mono text-sm leading-6"
        : "text-sm leading-6"
      : mono
        ? "font-mono text-[11px] leading-5"
        : "text-xs leading-5";

  return (
    <label
      className={`flex cursor-pointer gap-2.5 rounded-sm py-1 transition-colors ${
        onDark ? "hover:bg-zinc-800/60" : "hover:bg-muted/40"
      } ${textClass}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={toggle}
        className={`mt-0.5 flex shrink-0 items-center justify-center rounded border transition-colors ${
          size === "md" ? "h-5 w-5" : "h-4 w-4"
        } ${
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : onDark
              ? "border-zinc-500 bg-zinc-900"
              : "border-border bg-background"
        }`}
      >
        {checked && <Check className={size === "md" ? "h-3 w-3" : "h-2.5 w-2.5"} strokeWidth={3} />}
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
