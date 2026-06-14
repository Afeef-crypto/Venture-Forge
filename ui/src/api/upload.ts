import { getApiBase } from "@/lib/api-base";

export interface UploadResponse {
  success: boolean;
  original_name: string;
  stored_name: string;
  size_bytes: number;
  content_type: string | null;
  extracted_text: string | null;
  workspace_path?: string | null;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string };
    if (data.detail) return data.detail;
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

export const UPLOAD_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".jpg",
  ".jpeg",
  ".png",
  ".xlsx",
  ".csv",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".mp3",
  ".mp4",
  ".py",
  ".js",
  ".ts",
  ".html",
  ".css",
].join(",");

export async function uploadPitchFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${getApiBase()}/api/upload`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<UploadResponse>;
}

export async function loadWorkspaceFile(path: string): Promise<UploadResponse> {
  const response = await fetch(`${getApiBase()}/api/upload/workspace`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<UploadResponse>;
}
