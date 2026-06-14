const FILE_PATH_RE = /^([a-zA-Z]:\\|\\\\|\/)[^\n\r]*$/;

export function isFilePath(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes("\n")) return false;
  if (FILE_PATH_RE.test(trimmed)) return true;
  if (trimmed.startsWith("file://")) return true;
  return false;
}

export function getFileFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const { files, items } = dataTransfer;

  if (files?.length) return files[0] ?? null;

  if (items?.length) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.kind !== "file") continue;
      const asFile = item.getAsFile();
      if (asFile) return asFile;
    }
  }

  return null;
}

export function getFileFromDataTransferViaEntry(
  dataTransfer: DataTransfer,
  onFile: (file: File) => void,
  onFail: () => void,
): boolean {
  const items = dataTransfer.items;
  if (!items?.length) return false;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item.kind !== "file") continue;

    const entry = item.webkitGetAsEntry?.() as FileSystemFileEntry | null | undefined;
    if (entry?.isFile) {
      entry.file(
        (file) => onFile(file),
        () => onFail(),
      );
      return true;
    }
  }

  return false;
}

export function getPitchTextFromDataTransfer(dataTransfer: DataTransfer): string {
  const plain = dataTransfer.getData("text/plain")?.trim() ?? "";
  if (plain && !isFilePath(plain)) return plain;
  return "";
}

export function assignFileToInput(input: HTMLInputElement, file: File): void {
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
}

const CLIENT_TEXT_EXT = /\.(txt|md|csv|html|css|py|js|ts|json|xml|ya?ml)$/i;

export async function readTextFromFile(file: File, maxChars = 8000): Promise<string | null> {
  if (!CLIENT_TEXT_EXT.test(file.name)) return null;
  try {
    const text = (await file.text()).trim();
    if (!text) return null;
    return text.length > maxChars ? text.slice(0, maxChars) : text;
  } catch {
    return null;
  }
}
