import type { CursorTask } from "@/types/evaluation";
import type { TechStackSummary } from "@/lib/evaluation-plan";

export interface LayeredTechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  aiMl: string[];
  infrastructure: string[];
  /** Set when no database layer is needed for the MVP. */
  databaseNote?: string;
}

type Layer = keyof Omit<LayeredTechStack, "databaseNote">;

const LAYER_ORDER: Layer[] = ["frontend", "backend", "database", "aiMl", "infrastructure"];

const LAYER_LABELS: Record<Layer, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  aiMl: "AI / ML",
  infrastructure: "Infrastructure & DevOps",
};

const DEFAULT_STACK: LayeredTechStack = {
  frontend: ["React 19", "Vite", "TanStack Router", "Tailwind CSS"],
  backend: ["FastAPI", "Python 3.12", "Pydantic v2"],
  database: ["PostgreSQL"],
  aiMl: ["OpenRouter LLM API"],
  infrastructure: ["Vercel (UI)", "Railway / Render (API)"],
};

function classifyItem(item: string): Layer {
  const s = item.toLowerCase();

  if (/\b(postgres|postgresql|mysql|mongodb|mongo|sqlite|supabase|prisma|sqlalchemy|firestore|dynamo|planetscale|neon)\b/.test(s)) {
    return "database";
  }
  if (/\b(redis)\b/.test(s) && /\b(cache|queue|session)\b/.test(s)) {
    return "backend";
  }
  if (/\b(redis)\b/.test(s)) {
    return "database";
  }

  if (/\b(openai|openrouter|anthropic|llm|langchain|rag|embedding|inference|gpt|claude|nemotron|mistral|ai\/ml|machine learning|vector|chromadb|pinecone)\b/.test(s)) {
    return "aiMl";
  }

  if (/\b(fastapi|django|flask|express|nestjs|node\.?js|python|uvicorn|celery|bullmq|pydantic|graphql|backend|api server|httpx)\b/.test(s)) {
    return "backend";
  }

  if (/\b(react|vite|tanstack|tailwind|next\.?js|vue|svelte|shadcn|frontend|typescript|framer|radix|html|css|router)\b/.test(s)) {
    return "frontend";
  }

  if (/\b(vercel|netlify|railway|render|fly\.io|docker|nginx|aws|gcp|azure|cloudflare|github actions|ci\/cd|kubernetes|heroku)\b/.test(s)) {
    return "infrastructure";
  }

  if (/\b(stripe|auth0|clerk|figma|notion)\b/.test(s)) {
    return "infrastructure";
  }

  return "backend";
}

function collectStackItems(techStack?: TechStackSummary, tasks?: CursorTask[]): string[] {
  const items = new Set<string>();
  for (const item of techStack?.recommended ?? []) {
    if (item.trim()) items.add(item.trim());
  }
  for (const task of tasks ?? []) {
    for (const item of task.tech_stack ?? []) {
      if (item.trim()) items.add(item.trim());
    }
  }
  return [...items];
}

function ensureMinimum(layered: LayeredTechStack): LayeredTechStack {
  const out = { ...layered };
  if (!out.frontend.length) out.frontend = [...DEFAULT_STACK.frontend];
  if (!out.backend.length) out.backend = [...DEFAULT_STACK.backend];
  if (!out.aiMl.length && out.backend.some((b) => /fastapi|python|api/i.test(b))) {
    out.aiMl = [...DEFAULT_STACK.aiMl];
  }
  if (!out.infrastructure.length) out.infrastructure = [...DEFAULT_STACK.infrastructure];
  return out;
}

/** Group recommended + task stacks into frontend / backend / database / AI / infra layers. */
export function buildLayeredTechStack(
  techStack?: TechStackSummary,
  tasks?: CursorTask[],
): LayeredTechStack {
  const raw = collectStackItems(techStack, tasks);

  const layered: LayeredTechStack = {
    frontend: [],
    backend: [],
    database: [],
    aiMl: [],
    infrastructure: [],
  };

  if (raw.length === 0) {
    return { ...DEFAULT_STACK };
  }

  for (const item of raw) {
    const layer = classifyItem(item);
    if (!layered[layer].includes(item)) {
      layered[layer].push(item);
    }
  }

  const filled = ensureMinimum(layered);

  if (filled.database.length === 0) {
    const needsDb =
      filled.backend.some((b) => /fastapi|django|express|nestjs|postgres|sql/i.test(b)) ||
      (tasks ?? []).some((t) => t.domain === "backend" && /crud|auth|persist|database|postgres/i.test(t.description));

    if (needsDb) {
      filled.database = ["PostgreSQL"];
    } else {
      filled.databaseNote =
        "Not required for initial MVP — client-side localStorage is enough for solo demos; add PostgreSQL when you need accounts, sharing, or audit history.";
    }
  }

  return filled;
}

export function layeredStackSections(layered: LayeredTechStack): Array<{ label: string; items: string[]; note?: string }> {
  return LAYER_ORDER.map((layer) => ({
    label: LAYER_LABELS[layer],
    items: layered[layer],
    note: layer === "database" ? layered.databaseNote : undefined,
  })).filter((section) => section.items.length > 0 || section.note);
}
