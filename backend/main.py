from __future__ import annotations

import asyncio
import json
import time
from collections import defaultdict

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agents.agent_config import AGENTS
from agents.orchestrator import run_all_agents
from agents.synthesis import run_synthesis
from config import settings
from models.schemas import (
    EvaluateRequest,
    EvaluateResponse,
    ExportMarkdownRequest,
    ExportMarkdownResponse,
    UploadResponse,
    WorkspaceFileRequest,
)
from utils.export_paths import build_editor_urls
from utils.file_handler import save_upload
from utils.idea_validation import classify_idea
from utils.non_idea_response import build_non_idea_agent_results, build_non_idea_report
from utils.workspace_file import read_workspace_pitch_file
from models.pdf_schemas import PDFExportRequest
from utils.pdf_generator import generate_evaluation_pdf
from fastapi.responses import Response
from models.chart_schemas import (
    IndustryComparisonResponse,
    AgentScoresResponse,
)


app = FastAPI(
    title="Osiris API",
    description="Multi-agent startup idea evaluator powered by OpenRouter",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_last_evaluation_by_ip: dict[str, float] = defaultdict(float)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _check_rate_limit(request: Request) -> None:
    if settings.rate_limit_seconds <= 0:
        return

    ip = _client_ip(request)
    now = time.time()
    elapsed = now - _last_evaluation_by_ip[ip]
    if elapsed < settings.rate_limit_seconds:
        retry_after = int(settings.rate_limit_seconds - elapsed) + 1
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit: wait {retry_after}s before next evaluation",
            headers={"Retry-After": str(retry_after)},
        )


def _record_evaluation(request: Request) -> None:
    _last_evaluation_by_ip[_client_ip(request)] = time.time()


@app.get("/api/health")
async def health() -> dict[str, str | bool | int | dict[str, bool]]:
    keys = settings.agent_keys_status()
    return {
        "status": "ok",
        "agents": len(AGENTS),
        "keys_configured": keys,
        "all_keys_ready": settings.all_keys_ready(),
        "openrouter_configured": bool(settings.openrouter_api_key),
    }


@app.post("/api/evaluate", response_model=EvaluateResponse)
async def evaluate(request: Request, body: EvaluateRequest) -> EvaluateResponse:
    _check_rate_limit(request)
    _record_evaluation(request)

    idea = body.idea.strip()
    classification = classify_idea(idea)
    if not classification.is_evaluable:
        return EvaluateResponse(
            agent_results=build_non_idea_agent_results(classification),
            report=build_non_idea_report(idea, classification),
        )

    agent_results = await run_all_agents(idea)
    report = await run_synthesis(idea, agent_results)

    return EvaluateResponse(agent_results=agent_results, report=report)


@app.post("/api/export/markdown", response_model=ExportMarkdownResponse)
async def export_markdown(body: ExportMarkdownRequest) -> ExportMarkdownResponse:
    export_dir = settings.export_path
    export_dir.mkdir(parents=True, exist_ok=True)
    target = (export_dir / body.filename).resolve()
    export_root = export_dir.resolve()

    try:
        target.relative_to(export_root)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid export filename") from exc

    target.write_text(body.content, encoding="utf-8")

    return ExportMarkdownResponse(
        path=str(target),
        filename=body.filename,
        editor_urls=build_editor_urls(target),
    )


@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)) -> UploadResponse:
    metadata = await save_upload(file)
    return UploadResponse(
        success=True,
        original_name=str(metadata["original_name"]),
        stored_name=str(metadata["stored_name"]),
        size_bytes=int(metadata["size_bytes"]),
        content_type=str(metadata["content_type"]) if metadata["content_type"] else None,
        extracted_text=str(metadata["extracted_text"]) if metadata.get("extracted_text") else None,
    )


@app.post("/api/upload/workspace", response_model=UploadResponse)
async def upload_workspace_file(body: WorkspaceFileRequest) -> UploadResponse:
    """Load a text pitch file by local path (for editor/Explorer drag that only provides paths)."""
    metadata = read_workspace_pitch_file(body.path)
    return UploadResponse(
        success=True,
        original_name=str(metadata["original_name"]),
        stored_name=str(metadata["stored_name"]),
        size_bytes=int(metadata["size_bytes"]),
        content_type=str(metadata["content_type"]) if metadata.get("content_type") else None,
        extracted_text=str(metadata["extracted_text"]) if metadata.get("extracted_text") else None,
        workspace_path=str(metadata["workspace_path"]) if metadata.get("workspace_path") else None,
    )


@app.post("/api/evaluate/stream")
async def evaluate_stream(request: Request, body: EvaluateRequest):
    _check_rate_limit(request)
    _record_evaluation(request)

    idea = body.idea.strip()
    classification = classify_idea(idea)
    queue: asyncio.Queue[dict | None] = asyncio.Queue()

    async def on_agent_complete(index: int, result) -> None:
        agent = AGENTS[index]
        await queue.put(
            {
                "event": "agent_complete",
                "index": index,
                "agent_id": agent.id,
                "result": result.model_dump(),
            }
        )

    async def run_pipeline() -> None:
        try:
            if not classification.is_evaluable:
                agent_results = build_non_idea_agent_results(classification)
                for index, result in enumerate(agent_results):
                    await on_agent_complete(index, result)
                report = build_non_idea_report(idea, classification)
                await queue.put({"event": "synthesis_complete", "report": report.model_dump()})
                return

            agent_results = await run_all_agents(idea, on_agent_complete)
            report = await run_synthesis(idea, agent_results)
            await queue.put({"event": "synthesis_complete", "report": report.model_dump()})
        except Exception as exc:  # noqa: BLE001
            await queue.put({"event": "error", "message": str(exc)})
        finally:
            await queue.put(None)

    asyncio.create_task(run_pipeline())

    async def event_generator():
        while True:
            item = await queue.get()
            if item is None:
                yield "event: done\ndata: {}\n\n"
                break
            yield f"event: {item['event']}\ndata: {json.dumps(item)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
@app.post(
    "/api/export-pdf/{evaluation_id}",
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Returns the evaluation report as a downloadable PDF.",
        },
        422: {"description": "Invalid request body."},
        500: {"description": "PDF generation failed."},
    },
    summary="Export evaluation report as PDF",
    tags=["Export"],
)
async def export_evaluation_pdf(
    evaluation_id: str,
    body: PDFExportRequest,
) -> Response:
    try:
        pdf_bytes = generate_evaluation_pdf(body)

        safe_name = "".join(
            c if c.isalnum() or c in "-_ " else "_"
            for c in body.startup_name
        ).strip().replace(" ", "_")[:60]

        date_str = body.evaluation_date.strftime("%Y-%m-%d")
        filename = f"VentureForge_{safe_name}_{date_str}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "X-Evaluation-Id": evaluation_id,
            },
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {exc!s}",
        )
@app.get(
    "/api/charts/industry-comparison",
    response_model=IndustryComparisonResponse,
    tags=["Charts"]
)
async def industry_comparison_chart():
    return IndustryComparisonResponse(
        technology=62,
        fintech=58,
        healthcare=55,
        marketplace=60,
        edtech=53,
        startup_score=80
    )    

@app.get(
    "/api/charts/agent-scores",
    response_model=AgentScoresResponse,
    tags=["Charts"]
)
async def agent_scores_chart():
    return AgentScoresResponse(
        yc_partner=75,
        tech_auditor=82,
        business_cfo=65,
        marketing_expert=80,
        demand_intel=72,
        judge=78
    )