# Osiris — Sprint Tracker

Full-stack build at repo root (`backend/` + `frontend/`).

## Sprint 0 — Folder Scaffold

| ID | Title | Status |
|---|---|---|
| FS-001 | Create Osiris monorepo structure | Done |
| FS-002 | Copy React UI to frontend/ | Done |
| FS-003 | Scaffold backend/ with requirements.txt | Done |
| FS-004 | Sprint tracker (this file) | Done |

## Sprint 1 — Python Foundation

| ID | Title | Status |
|---|---|---|
| PY-001 | FastAPI app in main.py | Done |
| PY-002 | agent_config.py (5 agents) | Done |
| PY-003 | openrouter.py async client | Done |
| PY-004 | orchestrator.py asyncio.gather | Done |
| PY-005 | Pydantic schemas | Done |
| PY-006 | POST /api/evaluate | Done |
| QA-001 | pytest orchestrator tests | Done |

## Sprint 2 — Synthesis + Frontend

| ID | Title | Status |
|---|---|---|
| PY-007 | synthesis.py + normalize_report | Done |
| PY-008 | Synthesis prompt with cursor_tasks | Done |
| FE-001 | api/evaluate.ts + Vite proxy | Done |
| FE-002 | App.tsx wired to backend | Done |
| FE-003 | CORS + VITE_API_URL | Done |

## Sprint 3 — Polish

| ID | Title | Status |
|---|---|---|
| PY-009 | POST /api/evaluate/stream SSE | Done |
| FE-004 | SSE consumer in evaluate.ts | Done |
| PY-010 | Server-side rate limit | Done |
| OPS-001 | Dockerfiles + docker-compose | Done |
| OPS-002 | README + .env.example | Done |

## Sprint 4 — Founder & GitHub Context

Evaluate ideas in light of **who is building them** — founder profiles (skills, experience, past wins) and GitHub profiles (repos, languages, shipped projects) feed every agent so scores reflect **founder–market fit** and **team–idea alignment**, not just the idea in isolation.

| ID | Title | Status |
|---|---|---|
| FP-001 | `FounderProfile` schema — name, bio, skills[], years_experience, accomplishments[] | Todo |
| FP-002 | `EvaluateRequest` — optional `founders: FounderProfile[]` + `github_urls: string[]` | Todo |
| FP-003 | GitHub profile fetcher — public API, repos, languages, stars, pinned/notable projects | Todo |
| FP-004 | Normalize GitHub signals → skills, stack depth, shipping track record | Todo |
| FP-005 | Agent prompts — inject founder + GitHub context; YC agent weights founder–market fit | Todo |
| FP-006 | Tech agent — map founder skills/repos to MVP feasibility and timeline | Todo |
| FP-007 | Synthesis — `founder_fit` section: strengths, gaps, co-founder needs, credibility score | Todo |
| FE-005 | IdeaInput — founder profile fields (skills, experience, accomplished projects) | Todo |
| FE-006 | IdeaInput — GitHub URL(s) + optional parsed preview before submit | Todo |
| FE-007 | ReportPanel — display founder fit summary and team–idea alignment | Todo |
| QA-002 | pytest — GitHub parser mocks + evaluate with founder payload | Todo |
| OPS-003 | Optional `GITHUB_TOKEN` in `.env.example` (rate limits); README founder flow | Todo |
