# Osiris

**Multi-agent startup idea evaluator** — five specialist AI agents score your MVP in parallel, then a sixth agent synthesizes an investor-ready report with roadmap, hackathon tips, and Cursor-ready tasks.

**Repository:** [github.com/Afeef-crypto/Start-it](https://github.com/Afeef-crypto/Start-it)

---

## What it does

1. You paste a startup / MVP idea (or pick a demo preset).
2. **Five agents evaluate simultaneously** via OpenRouter (each with its own model and optional API key).
3. Results stream live into the UI as each agent finishes.
4. A **synthesis agent** merges all five outputs into one structured report.
5. Export the report as **Markdown**, **print to PDF**, or copy the investor hook.

> *"We didn't build a chatbot. We built a venture analysis firm that runs in 30 seconds."*

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React frontend (Vite)          http://localhost:5173     │
│  · Idea input + demo presets                            │
│  · Live agent status pills (SSE)                        │
│  · Score summary + agent cards + synthesis report       │
│  · Markdown / PDF export                                │
└──────────────────────────┬──────────────────────────────┘
                           │ POST /api/evaluate/stream (SSE)
                           │ dev proxy → localhost:8000
┌──────────────────────────▼──────────────────────────────┐
│  FastAPI backend (Python)     http://localhost:8000     │
│  · asyncio.gather — 5 parallel OpenRouter calls         │
│  · Per-agent keys + model fallbacks                     │
│  · Synthesis agent → EvaluationReport JSON              │
│  · Rate limit (30s / IP)                                │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
                    OpenRouter API
```

**Stack**

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite 5 |
| Backend | FastAPI, httpx, Pydantic v2, uvicorn |
| AI | OpenRouter (direct API — no LangChain) |
| Deploy | Vercel (frontend) + Railway / Render / Fly (backend) |

---

## The six agents

| # | Agent | Role | Primary model |
|---|-------|------|---------------|
| 1 | **YC Evaluator** | Paul Graham–style partner — market size, moat, founder fit | `meta-llama/llama-3.1-8b-instruct` |
| 2 | **Tech Auditor** | Full-stack architect — feasibility, stack, MVP timeline | `nvidia/nemotron-nano-9b-v2:free` |
| 3 | **Business CFO** | LTV/CAC, burn rate, funding path | `meta-llama/llama-3.1-8b-instruct` |
| 4 | **Marketing** | GTM, ICP, channels, viral potential | `anthropic/claude-haiku-4-5` |
| 5 | **Demand Intel** | Pain severity, timing, willingness to pay | `mistralai/mistral-small-3.2-24b-instruct` |
| 6 | **Synthesis** | Merges all five into final report | `anthropic/claude-sonnet-4-6` |

Each evaluator has **fallback models** (e.g. `gpt-4o-mini`, `nemotron-free`). If a per-agent API key fails (401 / 402 / 404), the backend retries with the global key and the next model in the chain.

---

## Project structure

```
.
├── backend/
│   ├── main.py              # FastAPI routes + SSE streaming
│   ├── config.py            # Settings + per-agent API keys
│   ├── agents/
│   │   ├── agent_config.py  # Prompts, models, fallbacks
│   │   ├── openrouter.py    # Async OpenRouter client
│   │   ├── orchestrator.py  # Parallel dispatch
│   │   └── synthesis.py     # Report orchestrator
│   ├── models/schemas.py    # Pydantic types
│   ├── tests/               # pytest suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/evaluate.ts  # SSE client → backend
│   │   ├── App.tsx          # Main UI flow
│   │   └── components/      # AgentCard, ReportPanel, ExportBar…
│   └── vite.config.ts       # Proxies /api → :8000 in dev
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- **Python 3.12+**
- **Node.js 20+**
- **[OpenRouter](https://openrouter.ai/) API key(s)** — at minimum one global key; optional per-agent keys

---

## Local setup

### 1. Clone

```bash
git clone https://github.com/Afeef-crypto/Start-it.git
cd Start-it
```

### 2. Backend

```bash
cd backend
python -m venv .venv
```

**Windows**
```bash
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env — add your OpenRouter key(s)
uvicorn main:app --reload --port 8000
```

**macOS / Linux**
```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your OpenRouter key(s)
uvicorn main:app --reload --port 8000
```

Verify: [http://localhost:8000/api/health](http://localhost:8000/api/health)  
API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to the backend — no `VITE_API_URL` needed locally.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes* | Global fallback key for all agents |
| `OPENROUTER_KEY_YC` | No | Dedicated key for YC evaluator |
| `OPENROUTER_KEY_TECH` | No | Dedicated key for Tech auditor |
| `OPENROUTER_KEY_BIZ` | No | Dedicated key for Business CFO |
| `OPENROUTER_KEY_MKT` | No | Dedicated key for Marketing |
| `OPENROUTER_KEY_DEM` | No | Dedicated key for Demand intel |
| `OPENROUTER_KEY_SYNTHESIS` | No | Dedicated key for synthesis agent |
| `CORS_ORIGINS` | No | Allowed frontend origins (comma-separated) |
| `RATE_LIMIT_SECONDS` | No | Cooldown between runs per IP (default `30`) |

\*At least one valid key must resolve for each agent — either its dedicated key or the global fallback.

**Key resolution order:** `OPENROUTER_KEY_{AGENT}` → `OPENROUTER_API_KEY` → on API failure, retry with global key + fallback models.

### Frontend (`frontend/.env.local`) — production only

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Deployed backend URL (e.g. `https://your-api.railway.app`). Leave empty in local dev. |

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Status, agent count, per-key configuration |
| `POST` | `/api/evaluate` | Full evaluation — returns JSON `{ agent_results, report }` |
| `POST` | `/api/evaluate/stream` | **SSE stream** used by the UI |

**SSE events (in order):**
```
event: agent_complete   → { index, agent_id, result }  × 5
event: synthesis_complete → { report }
event: done
```

**Request body:**
```json
{ "idea": "Your startup idea (10–8000 characters)" }
```

---

## Report output

The synthesis agent produces an `EvaluationReport` containing:

- Overall score + verdict + executive summary
- Investor hook (one-liner)
- Biggest strength / critical risk
- Per-agent scores
- Hackathon tips
- 3-week MVP roadmap
- Pivot suggestions
- Domain tasks (frontend, backend, AI/ML, design, marketing, business)
- **Cursor tasks** — structured tasks with IDs, acceptance criteria, priority, sprint

Export via **Download Markdown**, **Print PDF**, or **Copy investor hook** in the UI.

---

## Docker

```bash
# Add keys to backend/.env first
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |

---

## Deploy

| Service | Directory | Platform | Notes |
|---------|-----------|----------|-------|
| Frontend | `frontend/` | [Vercel](https://vercel.com) | Set root directory to `frontend` |
| Backend | `backend/` | Railway / Render / Fly.io | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Production checklist**
1. Set all OpenRouter keys on the backend host (never in the frontend).
2. Set `VITE_API_URL` on Vercel to your backend URL.
3. Add your Vercel domain to `CORS_ORIGINS` on the backend.
4. Confirm `GET /api/health` shows `all_keys_ready: true`.

---

## Tests

```bash
cd backend
pytest
```

Smoke-test all agents against live OpenRouter (requires `.env` keys):

```bash
python scripts/test_call_agent.py
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| **Backend unreachable** banner | Start backend: `uvicorn main:app --reload --port 8000` |
| Agent shows **error**, score 0 | Expand the agent card — error detail shows the OpenRouter message |
| **401 User not found** | Invalid key for that agent — fix `OPENROUTER_KEY_*` or rely on global fallback |
| **402 Insufficient credits** | Add credits at [openrouter.ai/settings/credits](https://openrouter.ai/settings/credits) or use `:free` models |
| **404 No endpoints found** | Model slug deprecated — backend auto-retries fallbacks; update `agent_config.py` if all fail |
| **Rate limit: wait Ns** | 30s cooldown per IP — wait or set `RATE_LIMIT_SECONDS=0` in dev |
| Only Marketing works | Other keys may be invalid — set one working `OPENROUTER_API_KEY` as global fallback |

Check key status anytime:
```bash
curl http://localhost:8000/api/health
```

---

## Hackathon demo (3 minutes)

1. Open the app → pick a **demo preset** (AI Code Review, Local Food Delivery, or Student Budget App).
2. Click **Run Full Evaluation** — watch five agent pills activate in parallel.
3. Cards fill in live as SSE events arrive.
4. Synthesis report appears with score ring, investor hook, and 3-week roadmap.
5. Click **Download Markdown** → open in Cursor → show `cursor_tasks` ready to execute.

---

## License

MIT — use freely for hackathons, demos, and production.
