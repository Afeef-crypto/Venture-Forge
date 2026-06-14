const STORAGE_PREFIX = "venture-forge-plan-checks:";

export function planCheckKey(evaluationId: string, itemId: string): string {
  return `${STORAGE_PREFIX}${evaluationId}:${itemId}`;
}

function readChecks(evaluationId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${evaluationId}`);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeChecks(evaluationId: string, checks: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${evaluationId}`, JSON.stringify(checks));
}

export function isPlanItemChecked(evaluationId: string, itemId: string): boolean {
  return readChecks(evaluationId)[itemId] === true;
}

export function togglePlanItemChecked(evaluationId: string, itemId: string): boolean {
  const checks = readChecks(evaluationId);
  const next = !checks[itemId];
  checks[itemId] = next;
  writeChecks(evaluationId, checks);
  return next;
}

export const PLAN_CHECKS_EVENT = "venture-forge:plan-checks-changed";

export function notifyPlanChecksChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PLAN_CHECKS_EVENT));
}
