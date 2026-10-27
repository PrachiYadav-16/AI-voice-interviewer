import { NextResponse, type NextRequest } from "next/server";
import { guard, jsonError } from "@/lib/server/guard";
import { DocumentError, MAX_UPLOAD_BYTES, extractDocumentText } from "@/lib/server/documents";

export const runtime = "nodejs";

/** Extracts plain text from an uploaded resume or job posting. Files are processed in memory and not stored. */
export async function POST(req: NextRequest) {
  const blocked = await guard(req, "parse", 30);
  if (blocked) return blocked;

  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) return jsonError(413, "Files must be 5 MB or smaller.");

  let file: File | null = null;
  try {
    const form = await req.formData();
    const entry = form.get("file");
    file = entry instanceof File ? entry : null;
  } catch {
    return jsonError(400, "Send the file as form data in a field named \"file\".");
  }
  if (!file) return jsonError(400, "No file was attached.");

  try {
    const result = await extractDocumentText(file.name, await file.arrayBuffer());
    return NextResponse.json({ text: result.text, truncated: result.truncated, kind: result.kind, fileName: file.name.slice(0, 120) });
  } catch (err) {
    if (err instanceof DocumentError) return jsonError(err.status, err.message);
    return jsonError(500, "We couldn't process that file. Try again or paste the text instead.");
  }
}
