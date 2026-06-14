import { loadWorkspaceFile, uploadPitchFile, type UploadResponse } from "@/api/upload";
import { readTextFromFile } from "@/utils/dropFile";

export interface IngestedDocument {
  result: UploadResponse;
  extractedText: string | null;
  textLoaded: boolean;
}

/** Read document content first, then persist via API when needed. */
export async function ingestFile(file: File): Promise<IngestedDocument> {
  const clientText = await readTextFromFile(file);

  if (clientText) {
    try {
      const result = await uploadPitchFile(file);
      return {
        result: { ...result, extracted_text: clientText },
        extractedText: clientText,
        textLoaded: true,
      };
    } catch {
      return {
        result: {
          success: true,
          original_name: file.name,
          stored_name: file.name,
          size_bytes: file.size,
          content_type: file.type || null,
          extracted_text: clientText,
        },
        extractedText: clientText,
        textLoaded: true,
      };
    }
  }

  const result = await uploadPitchFile(file);
  const extractedText = result.extracted_text?.trim() || null;
  return {
    result,
    extractedText,
    textLoaded: Boolean(extractedText),
  };
}

export async function ingestWorkspacePath(path: string): Promise<IngestedDocument> {
  const result = await loadWorkspaceFile(path);
  const extractedText = result.extracted_text?.trim() || null;
  if (!extractedText) {
    throw new Error("No text could be extracted from that file.");
  }
  return {
    result,
    extractedText,
    textLoaded: true,
  };
}
