import type { AgentResult, EvaluationReport } from "@/types/evaluation";
import { getApiBase } from "@/lib/api-base";

export class RateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface EvaluateCallbacks {
  onAgentComplete?: (index: number, result: AgentResult) => void;
  onSynthesisComplete?: (report: EvaluationReport) => void;
  onError?: (message: string) => void;
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    return JSON.stringify(data);
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function evaluateIdeaStreaming(
  idea: string,
  callbacks: EvaluateCallbacks,
  signal?: AbortSignal,
): Promise<{ agentResults: AgentResult[]; report: EvaluationReport }> {
  const response = await fetch(`${getApiBase()}/api/evaluate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea }),
    signal,
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "30", 10);
    throw new RateLimitError(await parseErrorResponse(response), retryAfter);
  }

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  if (!response.body) {
    throw new Error("No response body from evaluation stream");
  }

  const agentResults: AgentResult[] = [];
  let report: EvaluationReport | null = null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) {
      throw new DOMException("Evaluation aborted", "AbortError");
    }

    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let eventType = "";
      let dataLine = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
        if (line.startsWith("data: ")) dataLine = line.slice(6);
      }

      if (!dataLine || eventType === "done") continue;

      const payload = JSON.parse(dataLine) as Record<string, unknown>;

      if (eventType === "agent_complete") {
        const index = payload.index as number;
        const result = payload.result as AgentResult;
        agentResults[index] = result;
        callbacks.onAgentComplete?.(index, result);
      } else if (eventType === "synthesis_complete") {
        report = payload.report as EvaluationReport;
        callbacks.onSynthesisComplete?.(report);
      } else if (eventType === "error") {
        callbacks.onError?.(String(payload.message || "Evaluation failed"));
      }
    }
  }

  if (!report) {
    throw new Error("Synthesis did not complete");
  }

  return {
    agentResults: Array.from({ length: 5 }, (_, i) => agentResults[i]!),
    report,
  };
}

export async function checkBackendHealth(): Promise<{
  ok: boolean;
  allKeysReady?: boolean;
}> {
  try {
    const response = await fetch(`${getApiBase()}/api/health`);
    if (!response.ok) return { ok: false };
    const data = (await response.json()) as { all_keys_ready?: boolean };
    return { ok: true, allKeysReady: data.all_keys_ready };
  } catch {
    return { ok: false };
  }
}
