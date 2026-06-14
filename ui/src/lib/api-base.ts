/** FastAPI base URL. TanStack dev server does not proxy /api — use backend directly in dev. */
export function getApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (import.meta.env.DEV) return "http://127.0.0.1:8000";
  return "";
}
