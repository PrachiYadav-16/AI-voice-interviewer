import "server-only";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_TEXT_CHARS = 16_000;

export type DocKind = "pdf" | "docx" | "txt";

export class DocumentError extends Error {
  constructor(
    message: string,
    public status = 422,
  ) {
    super(message);
    this.name = "DocumentError";
  }
}

/** Identify the file by its bytes, not just its name or MIME type. */
export function detectKind(name: string, bytes: Uint8Array): DocKind {
  const lower = name.toLowerCase();
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // PK (docx is a zip)
  if (isPdf) return "pdf";
  if (isZip && lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) {
    throw new DocumentError("Older .doc files aren't supported. Save it as PDF or .docx and upload again.", 415);
  }
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "txt";
  throw new DocumentError("Upload a PDF, Word (.docx) or plain text file.", 415);
}

export function cleanText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractDocumentText(name: string, buffer: ArrayBuffer): Promise<{ text: string; truncated: boolean; kind: DocKind }> {
  if (buffer.byteLength === 0) throw new DocumentError("The file is empty.");
  if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new DocumentError("Files must be 5 MB or smaller.", 413);
  const bytes = new Uint8Array(buffer);
  const kind = detectKind(name, bytes);

  let raw = "";
  try {
    if (kind === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      const result = await extractText(pdf, { mergePages: true });
      raw = result.text;
    } else if (kind === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      raw = result.value;
    } else {
      raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    }
  } catch {
    throw new DocumentError("We couldn't read that file. It may be damaged or password-protected.");
  }

  const text = cleanText(raw);
  if (text.replace(/\s/g, "").length < 80) {
    throw new DocumentError(
      kind === "pdf"
        ? "This PDF has almost no selectable text, so it is probably a scanned image. Upload a text-based PDF or .docx, or paste the text instead."
        : "We found almost no text in this file. Check it's the right document, or paste the text instead.",
    );
  }
  return { text: text.slice(0, MAX_TEXT_CHARS), truncated: text.length > MAX_TEXT_CHARS, kind };
}
