import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, AlertTriangle, FileUp, Loader2, Save, Trash2, X } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { checkBackendHealth } from "@/api/evaluate";
import { UPLOAD_ACCEPT } from "@/api/upload";
import { createEvaluation, notifyEvaluationsChanged } from "@/lib/local-evaluations";
import {
  assignFileToInput,
  getFileFromDataTransfer,
  getFileFromDataTransferViaEntry,
  getPitchTextFromDataTransfer,
  isFilePath,
} from "@/utils/dropFile";
import { ingestFile, ingestWorkspacePath } from "@/utils/ingest-pitch-file";
import { classifyIdeaInput, inputValidationLabel } from "@/lib/idea-validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/new-evaluation")({
  validateSearch: (search) =>
    z
      .object({
        template: z.string().optional(),
        idea: z.string().optional(),
        industry: z.string().optional(),
        stage: z.string().optional(),
      })
      .parse(search),
  component: NewEvaluation,
});

const demos = [
  { title: "AI Study Companion", text: "AI copilot that helps students find and summarize notes from previous years." },
  { title: "FinTrack", text: "Personal finance app for freelancers that automates tax set-asides and cash-flow forecasting." },
  { title: "LocalEats", text: "Hyperlocal food delivery marketplace connecting home cooks with nearby customers." },
  { title: "CodeReview AI", text: "AI-powered code review assistant for small engineering teams." },
];

function NewEvaluation() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const [idea, setIdea] = useState(search.idea ?? "");
  const [industry, setIndustry] = useState(search.industry ?? "Technology");
  const [stage, setStage] = useState(search.stage ?? "Idea");
  const [depth, setDepth] = useState("Standard");
  const [research, setResearch] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    checkBackendHealth().then((h) => setBackendOk(h.ok));
  }, []);

  const trimmedIdea = idea.trim();
  const inputCheck = useMemo(
    () => (trimmedIdea.length >= 10 ? classifyIdeaInput(trimmedIdea) : null),
    [trimmedIdea],
  );
  const canRunEvaluation = trimmedIdea.length >= 10 && inputCheck?.isEvaluable !== false;

  const applyDocument = (ingested: Awaited<ReturnType<typeof ingestFile>>) => {
    const { result, extractedText, textLoaded } = ingested;
    setUploadedFileName(result.original_name);
    if (textLoaded && extractedText) {
      setIdea(extractedText);
    }
  };

  const handleFile = async (file: File | undefined, replace = false) => {
    if (!file || uploading) return;
    if (replace) {
      setIdea("");
      setUploadedFileName(null);
    }
    setUploading(true);
    setUploadError("");
    try {
      const ingested = await ingestFile(file);
      if (!ingested.textLoaded) {
        throw new Error(
          `Could not read text from ${file.name}. Try .pdf, .md, .txt, or .docx, or paste your pitch manually.`,
        );
      }
      applyDocument(ingested);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not read file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDropFailure = (dataTransfer: DataTransfer) => {
    const plain = dataTransfer.getData("text/plain")?.trim() ?? "";
    if (isFilePath(plain)) {
      setUploading(true);
      setUploadError("");
      void ingestWorkspacePath(plain)
        .then(applyDocument)
        .catch((err) =>
          setUploadError(err instanceof Error ? err.message : "Could not read file from path"),
        )
        .finally(() => setUploading(false));
      return;
    }

    const pitchText = getPitchTextFromDataTransfer(dataTransfer);
    if (pitchText.length >= 10) {
      setIdea(pitchText);
      setUploadedFileName("Dropped text");
      setUploadError("");
      return;
    }

    setUploadError("No file detected. Drop onto the upload box, or use browse.");
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setDragOver(false);
    if (uploading) return;

    const { dataTransfer } = event;
    const syncFile = getFileFromDataTransfer(dataTransfer);
    if (syncFile) {
      void handleFile(syncFile, uploadedFileName !== null);
      return;
    }

    const started = getFileFromDataTransferViaEntry(
      dataTransfer,
      (file) => void handleFile(file, uploadedFileName !== null),
      () => handleDropFailure(dataTransfer),
    );
    if (!started) handleDropFailure(dataTransfer);
  };

  const clearForm = () => {
    setIdea("");
    setUploadedFileName(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const save = (run: boolean) => {
    const trimmed = idea.trim().slice(0, 8000);
    if (trimmed.length < 10) return;
    if (run) {
      const check = classifyIdeaInput(trimmed);
      if (!check.isEvaluable) return;
    }
    setBusy(true);
    const title = trimmed.split(/[.!?]/)[0].slice(0, 60) || "Untitled startup";
    const row = createEvaluation({
      title,
      idea: trimmed,
      industry,
      stage,
      evaluation_depth: depth,
      use_web_research: research,
      status: run ? "running" : "draft",
      progress: run ? 8 : 0,
    });
    notifyEvaluationsChanged();
    setBusy(false);
    nav({ to: run ? "/evaluation/$id" : "/dashboard", params: run ? { id: row.id } : undefined as never });
  };

  return (
    <AppShell>
      <Button variant="ghost" size="sm" onClick={() => history.back()} className="mb-7">
        <ArrowLeft />
        Back
      </Button>
      <h1 className="text-4xl">Describe your startup</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Type your pitch, or upload a document — PDF, Word, Markdown, or plain text.
      </p>

      {backendOk === false && (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          Backend unreachable — start the API with{" "}
          <code className="text-foreground">cd backend; python -m uvicorn main:app --reload --port 8000</code>
        </p>
      )}

      <div
        className={cn(
          "mt-8 overflow-hidden border bg-card transition-colors",
          dragOver ? "border-primary ring-2 ring-primary/20" : "border-input",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepthRef.current += 1;
          setDragOver(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) setDragOver(false);
        }}
        onDrop={onDrop}
      >
        <textarea
          value={idea}
          onChange={(e) => {
            setIdea(e.target.value);
            if (uploadedFileName) setUploadedFileName(null);
          }}
          placeholder="Describe your startup idea…"
          className="h-48 w-full resize-none bg-transparent p-5 text-sm outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3">
          <div className="min-w-0 text-xs text-muted-foreground">
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Reading document…
              </span>
            ) : uploadedFileName ? (
              <span className="inline-flex max-w-full items-center gap-2">
                <span className="truncate">Loaded from {uploadedFileName}</span>
                <button
                  type="button"
                  onClick={() => setUploadedFileName(null)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Clear uploaded file name"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <span>Drag & drop a pitch file here, or browse</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={UPLOAD_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  assignFileToInput(e.target, file);
                  void handleFile(file, uploadedFileName !== null);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || busy}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Upload file
            </Button>
          </div>
        </div>
      </div>
      {uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}
      {inputCheck && !inputCheck.isEvaluable && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-xs text-amber-900 dark:text-amber-100"
        >
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Not an evaluable startup idea
            <span className="font-normal text-muted-foreground">
              ({inputValidationLabel(inputCheck.category)})
            </span>
          </p>
          <p className="mt-2 leading-5 text-muted-foreground">{inputCheck.reason}</p>
          <p className="mt-2 leading-5 text-muted-foreground">
            Osiris evaluates startup pitches — describe what you are building, who the customer is, and
            what problem you solve. You can still save a draft, but evaluation will be blocked.
          </p>
        </div>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <label className="text-[10px] text-muted-foreground">
          Industry
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-2 h-10 w-full border border-input bg-card px-3 text-xs text-foreground"
          >
            <option>Technology</option>
            <option>Fintech</option>
            <option>Healthcare</option>
            <option>Marketplace</option>
            <option>EdTech</option>
          </select>
        </label>
        <label className="text-[10px] text-muted-foreground">
          Stage
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="mt-2 h-10 w-full border border-input bg-card px-3 text-xs text-foreground"
          >
            <option>Idea</option>
            <option>MVP</option>
            <option>Early Revenue</option>
          </select>
        </label>
        <label className="text-[10px] text-muted-foreground">
          Evaluation Depth
          <select
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            className="mt-2 h-10 w-full border border-input bg-card px-3 text-xs text-foreground"
          >
            <option>Standard</option>
            <option>Deep Dive</option>
          </select>
        </label>
        <div className="flex items-end gap-3 pb-2 text-xs">
          <Switch checked={research} onCheckedChange={setResearch} />
          Use Live Web Research
        </div>
      </div>
      <p className="mb-4 mt-10 text-xs font-semibold">Or try a demo preset</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {demos.map((d) => (
          <Button
            key={d.title}
            variant="outline"
            onClick={() => setIdea(d.text)}
            className="h-auto items-start justify-start whitespace-normal p-5 text-left"
          >
            <span>
              <b className="text-xs">{d.title}</b>
              <span className="mt-2 block text-[10px] leading-4 text-muted-foreground">{d.text}</span>
            </span>
          </Button>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={clearForm}>
          <Trash2 />
          Clear Form
        </Button>
        <Button variant="outline" onClick={() => save(false)} disabled={busy || idea.length < 10}>
          <Save />
          Save Draft
        </Button>
        <Button variant="hero" onClick={() => save(true)} disabled={busy || !canRunEvaluation}>
          Run Evaluation <ArrowRight />
        </Button>
      </div>
    </AppShell>
  );
}
