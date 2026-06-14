# Venture Forge

**Multi-agent startup idea evaluator** — five specialist AI agents score your pitch in parallel, then **The Judge** synthesizes an investor-ready report with MVP roadmap and Cursor-style implementation tasks.

**Repository:** [github.com/Afeef-crypto/Venture-Forge](https://github.com/Afeef-crypto/Venture-Forge)

---

## What it does

1. **Submit a pitch** — type your idea, upload PDF/Word/Markdown, or use a template preset.
2. **Input validation** — rejects non-pitches (questions, resumes, cap-table-only docs, code snippets, gibberish) before agents run.
3. **Five specialists evaluate in parallel** via OpenRouter (each with its own model and optional API key).
4. **Live streaming UI** — agent cards update over SSE as each specialist finishes.
5. **The Judge synthesizes** — overall score is the **average of the five specialists** (0–100); roadmap and implementation plan are stripped for non-evaluable inputs.
6. **Explore results** — overview, per-agent analysis, idea-specific roadmap (3–10 weeks), and implementation plan with checkboxes persisted in `localStorage`.

> *"We didn't build a chatbot. We built a venture analysis firm that runs in under a minute."*

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Venture Forge UI (ui/)              http://localhost:8086   │
│  · TanStack Router — landing, dashboard, reports, results    │
│  · New evaluation + file upload + client-side idea checks    │
│  · localStorage evaluations (hackathon mode — no auth req.)  │
│  · Roadmap + implementation plan tabs per evaluation         │
└───────────────────────────┬──────────────────────────────────┘
                            │ POST /api/evaluate/stream (SSE)
                            │ Vite dev proxy /api → :8000
┌───────────────────────────▼──────────────────────────────────┐
│  Osiris API (backend/)               http://localhost:8000     │
│  · classify_idea() — pre-flight pitch validation               │
│  · asyncio.gather — 5 parallel OpenRouter agent calls          │
│  · financial_calibration — market-realistic CFO estimates      │
│  · synthesis agent → EvaluationReport JSON                     │
│  · File upload + workspace path ingest (PDF/DOCX/MD/TXT)       │
│  · Rate limit (30s / IP, configurable)                         │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
                     OpenRouter API
```

---

## Tech stack

### Frontend (`ui/` — canonical app)

| Technology | Role | Why we use it | Alternatives considered |
|------------|------|---------------|-------------------------|
| **React 19** | UI library | Mature ecosystem, component model fits multi-page report UI | Vue, Svelte — less alignment with TanStack Start tooling |
| **TypeScript** | Type safety | Shared shapes with API responses; fewer runtime surprises in report mapping | JavaScript — rejected for large report/state surfaces |
| **Vite 8** | Dev server & bundler | Fast HMR, simple `/api` proxy to FastAPI on `:8000` | Webpack — slower dev loop; Next.js — heavier for a mostly client-side hackathon app |
| **TanStack Router** | File-based routing | Typed routes (`/results/$id`, search params for tabs), code-splitting | React Router — less integrated with Start; Remix — similar but we standardised on TanStack |
| **TanStack Start + Nitro** | SSR shell | Lovable/TanStack scaffold; SSR entry for production builds | Pure SPA — fine for demo, Start gives a path to deploy without rewriting |
| **Tailwind CSS 4** | Styling | Utility-first, matches design tokens (`primary`, `card`, dark/light) | CSS Modules, styled-components — more boilerplate for rapid UI iteration |
| **Radix UI + shadcn-style primitives** | Accessible components | Dialog, accordion, switch — keyboard/focus handled | Headless UI — similar; raw HTML — too much a11y work |
| **Framer Motion** | Landing & dashboard motion | Lightweight hero/scroll animations without a animation framework | GSAP — overkill; CSS-only — harder for staggered agent grid |
| **Zod** | Route search validation | Validates `?tab=` on results page | Yup — equivalent; manual parsing — error-prone |
| **localStorage** | Evaluation persistence | Zero backend DB for hackathon demos; works offline after first load | Supabase (wired but optional) — adds auth/ops complexity for MVP |
| **Lucide React** | Icons | Tree-shakeable, consistent stroke icons | Heroicons — equivalent choice |

**Note:** The legacy `frontend/` Vite app is **gitignored**. All active development is in **`ui/`**.

### Backend (`backend/`)

| Technology | Role | Why we use it | Alternatives considered |
|------------|------|---------------|-------------------------|
| **Python 3.12+** | Runtime | Best fit for PDF/DOCX parsing, asyncio, and ML-team familiarity | Node — weaker document extraction story; Go — faster but slower iteration on prompts |
| **FastAPI** | HTTP + SSE API | Native async, OpenAPI docs at `/docs`, StreamingResponse for live agent updates | Flask — no first-class async; Django — too heavy for a single-purpose API |
| **httpx** | OpenRouter HTTP client | Async requests, connection pooling for 5 parallel agents | `requests` — blocking; `aiohttp` — equivalent, httpx API is cleaner |
| **Pydantic v2** | Schemas & settings | `EvaluationReport`, `AgentResult`, env validation in `config.py` | dataclasses — no validation; Marshmallow — less idiomatic with FastAPI |
| **uvicorn** | ASGI server | Standard FastAPI deployment target | Hypercorn — equivalent; gunicorn+uvicorn workers — production option |
| **pypdf + python-docx** | Pitch file extraction | Upload YC apps and pitch decks without a separate OCR service | Unstructured.io, LlamaParse — heavier deps/cost for hackathon scope |
| **pytest + pytest-asyncio** | Tests | Idea validation, synthesis normalisation, financial calibration | unittest — less ergonomic for async |

### AI layer

| Technology | Role | Why we use it | Alternatives considered |
|------------|------|---------------|-------------------------|
| **OpenRouter** | Model gateway | One API key, swap models per agent, fallback chains, free-tier models | Direct OpenAI/Anthropic — 5× integration work; LangChain — unnecessary abstraction for fixed JSON agents |
| **Direct JSON prompts** | Agent contract | Each agent returns strict JSON; guardrails in `prompt_guardrails.py` | Tool-calling agents — harder to test; free-form markdown — breaks report mapper |
| **Per-agent models** | Cost/latency tuning | Fast cheap models for specialists; Sonnet for synthesis quality | Single model for all — worse cost/quality tradeoff |
| **Heuristic calibration** | CFO realism | `financial_calibration.py` clamps EdTech/B2B CAC/LTV to market ranges when LLM drifts | Fine-tuned model — overkill; trust LLM only — produced $500+ student CAC |

---

## The six agents

| # | Agent | Role | Primary model |
|---|-------|------|---------------|
| 1 | **YC Evaluator** | Partner-style — problem, timing, wedge, founder fit | `meta-llama/llama-3.1-8b-instruct` |
| 2 | **Tech Auditor** | MVP feasibility, stack, timeline, technical risk | `openai/gpt-4o-mini` |
| 3 | **Business CFO** | Unit economics, CAC/LTV, burn, runway (calibrated ranges) | `openai/gpt-4o-mini` |
| 4 | **Marketing** | ICP, GTM, channels, positioning | `anthropic/claude-haiku-4-5` |
| 5 | **Demand Intel** | Pain severity, WTP, timing, substitutes | `mistralai/mistral-small-3.2-24b-instruct` |
| 6 | **The Judge** (synthesis) | Final report, radar scores, roadmap, cursor tasks | `anthropic/claude-sonnet-4-6` |

Each evaluator has **fallback models** (e.g. `gpt-4o-mini`, `nemotron-free`). Failed keys or 401/402/404 responses trigger the next model in the chain.

**Scoring:** Judge display score = **simple average of the five specialists** (mapped to 0–100). Non-startup inputs get score ~10 with no roadmap/plan.

---

## Project structure

```
.
├── ui/                              # ← Canonical frontend (port 8086)
│   ├── src/
│   │   ├── routes/                  # TanStack file routes
│   │   │   ├── index.tsx            # Landing page
│   │   │   ├── docs.tsx
│   │   │   └── _authenticated/      # dashboard, new-evaluation, results, …
│   │   ├── api/                     # evaluate.ts (SSE), upload.ts
│   │   ├── components/              # app-shell, roadmap, implementation-plan, …
│   │   ├── lib/
│   │   │   ├── idea-validation.ts   # Client-side pitch checks (mirrors backend)
│   │   │   ├── evaluation-mapper.ts # Backend JSON → UI report
│   │   │   ├── evaluation-plan.ts   # Roadmap + implementation plan builder
│   │   │   ├── financial-display.ts # Score resolution for stored evals
│   │   │   └── local-evaluations.ts # localStorage CRUD
│   │   ├── config/agents.ts
│   │   └── types/evaluation.ts
│   ├── vite.config.ts               # Proxy /api → localhost:8000
│   └── .env.example
│
├── backend/
│   ├── main.py                      # FastAPI routes + SSE
│   ├── config.py                    # Settings + per-agent API keys
│   ├── agents/
│   │   ├── agent_config.py          # Prompts, models, fallbacks
│   │   ├── openrouter.py            # Async client + retry chain
│   │   ├── orchestrator.py          # Parallel evaluator gather
│   │   ├── synthesis.py             # The Judge
│   │   └── prompt_guardrails.py     # Shared + per-agent guardrails
│   ├── models/schemas.py
│   ├── utils/
│   │   ├── idea_validation.py       # Pre-eval pitch classification
│   │   ├── venture_evaluable.py     # Post-agent non-idea detection
│   │   ├── financial_calibration.py # Market-realistic CFO numbers
│   │   ├── non_idea_response.py
│   │   └── file_handler.py
│   ├── tests/
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                        # Legacy app (gitignored — do not use)
├── docker-compose.yml               # Backend :8000 (+ legacy frontend image)
└── README.md
```

---

## Prerequisites

- **Python 3.12+**
- **Node.js 20+**
- **[OpenRouter](https://openrouter.ai/) API key** — global key minimum; optional per-agent keys

---

## Local setup

### 1. Clone

```bash
git clone https://github.com/Afeef-crypto/Venture-Forge.git
cd Venture-Forge
```

### 2. Backend

```bash
cd backend
python -m venv .venv
```

**Windows**
```powershell
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env — add OPENROUTER_API_KEY
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**macOS / Linux**
```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Verify: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)  
API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend

In a **second terminal**:

```bash
cd ui
npm install
npm run dev
```

Open [http://localhost:8086](http://localhost:8086). Vite proxies `/api` to the backend — leave `VITE_API_URL` empty locally.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes* | Global fallback key for all agents |
| `OPENROUTER_KEY_YC` … `OPENROUTER_KEY_DEM` | No | Per-agent key overrides |
| `OPENROUTER_KEY_SYNTHESIS` | No | The Judge synthesis key |
| `CORS_ORIGINS` | No | Comma-separated frontend origins (default includes `:8086`) |
| `RATE_LIMIT_SECONDS` | No | Cooldown between runs per IP (default `30`, set `0` in dev) |
| `UPLOAD_DIR` / `MAX_UPLOAD_SIZE_MB` | No | Pitch file upload limits |

\*At least one valid key must resolve for each agent — dedicated key or global fallback.

### Frontend (`ui/.env.local`) — production only

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Deployed backend URL. Empty in local dev (uses Vite proxy). |
| `VITE_SUPABASE_*` | Optional — not required; evaluations persist in `localStorage` |

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Status, agent count, key configuration |
| `POST` | `/api/evaluate` | Full evaluation JSON `{ agent_results, report }` |
| `POST` | `/api/evaluate/stream` | **SSE stream** used by the UI |
| `POST` | `/api/upload` | Pitch file upload + text extraction |
| `POST` | `/api/upload/workspace` | Read pitch from local editor path |
| `POST` | `/api/export/markdown` | Write report markdown + editor deep links |

**SSE events:**
```
event: agent_complete      → { index, agent_id, result }  × 5
event: synthesis_complete  → { report }
event: done
```

**Request body:**
```json
{ "idea": "Your startup pitch (10–8000 characters)" }
```

---

## Report output

The Judge produces an `EvaluationReport` including:

- Overall score (0–100) and Osiris verdict tier
- Executive summary, investor hook, strength / critical risk
- Per-specialist scores and expandable analysis blocks
- Venture radar (market, demand, tech, finance, execution)
- Demand validation (pain severity, willingness to pay)
- **MVP roadmap** — 3–10 weeks based on tech complexity
- **Implementation plan** — Cursor-style tasks with `tech_stack`, `implementation_steps`, checkboxes
- Non-evaluable inputs: low score, no roadmap/plan, clear rejection reason

---

## Key product flows

| Flow | Route | Notes |
|------|-------|-------|
| Landing | `/` | Hero, agents section; logo → scroll to `#product` |
| Dashboard | `/dashboard` | Recent evaluations table + agent grid |
| New evaluation | `/new-evaluation` | Pitch input, upload, client validation banner |
| Live run | `/evaluation/$id` | SSE progress, then redirect to results |
| Report | `/results/$id` | Overview, Roadmap, Implementation Plan, per-agent tabs |
| Reports list | `/reports` | All completed evaluations with resolved scores |
| Templates | `/templates` | Preset pitches → new evaluation |
| Docs | `/docs` | Product documentation |

---

## Docker

Backend only (recommended for local full-stack use the `ui/` dev server):

```bash
cd backend
docker build -t venture-forge-api .
docker run --env-file .env -p 8000:8000 venture-forge-api
```

`docker-compose.yml` still references the legacy `frontend/` image; for day-to-day development run **`ui/` with npm** as above.

---

## Deploy

| Service | Directory | Platform | Notes |
|---------|-----------|----------|-------|
| Frontend | `ui/` | Vercel / Nitro host | Set root to `ui`, build `npm run build` |
| Backend | `backend/` | Railway / Render / Fly.io | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Production checklist**
1. Set OpenRouter keys on the backend host only.
2. Set `VITE_API_URL` on the frontend to your API URL.
3. Add your frontend domain to `CORS_ORIGINS`.
4. Confirm `GET /api/health` → `all_keys_ready: true`.

---

## Tests

```bash
cd backend
python -m pytest
```

Focused suites:

```bash
python -m pytest tests/test_idea_validation.py tests/test_financial_calibration.py tests/test_synthesis.py -q
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| **Backend unreachable** banner | Start API: `cd backend; python -m uvicorn main:app --reload --port 8000` |
| Agent score **0 / error** | Expand agent tab — OpenRouter message in summary |
| **401 / 402 / 404** from OpenRouter | Fix key or credits; fallbacks retry automatically |
| **Rate limit: wait Ns** | Wait or set `RATE_LIMIT_SECONDS=0` in dev |
| **Not an evaluable startup idea** | Paste a product pitch (problem + customer + solution), not equity/resume/chat |
| Stale score on old report | Re-run evaluation after backend restart; reports remap on load via `evaluation-mapper` |
| CFO numbers look wrong | Re-run — `financial_calibration.py` applies EdTech/B2B market ranges |

```bash
curl http://127.0.0.1:8000/api/health
```

---

## Hackathon demo (~3 min)

1. Open [http://localhost:8086](http://localhost:8086) → **Evaluate My Startup** or pick a template.
2. Paste a pitch or upload a YC application PDF — watch validation pass.
3. **Run Evaluation** — five agent cards fill via SSE; Judge synthesizes.
4. Open **Results** → Overview score, then **Roadmap** and **Implementation Plan** tabs.
5. Show per-agent **Business CFO** with calibrated CAC/LTV and elaborated executive summaries.

---

## License

MIT — use freely for hackathons, demos, and production.
