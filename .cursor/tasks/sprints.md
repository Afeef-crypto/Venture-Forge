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

## Sprint 4 — Osiris Verdict Experience

Replace generic agent listing with a memorable **Judge + Verdict** experience — radar chart, demand validation, tiered Osiris scores, and editor export.

| ID | Title | Status |
|---|---|---|
| OV-001 | `RadarScores` + `DemandValidation` + `osiris_verdict` schema | Done |
| OV-002 | Osiris Verdict tiers (Divine Potential → Reconsider) | Done |
| OV-003 | The Judge synthesis persona + `judge_verdict` field | Done |
| FE-008 | Venture score radar chart (Market, Demand, Tech, Finance, Execution) | Done |
| FE-009 | Demand validation panel (pain severity, willingness to pay) | Done |
| FE-010 | Osiris Verdict display (score /100 + tier badge) | Done |
| FE-011 | Open markdown in editor of choice (Cursor, VS Code, Windsurf) | Done |
| FE-012 | Reframe synthesis UI as ⚖️ The Judge | Done |
| QA-003 | pytest — osiris verdict + radar score derivation | Done |
