"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button, Notice, TextArea } from "./ui";

const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload (PDF/DOCX/TXT, parsed on the server) or paste text. Either way, what we keep is plain text.
 */
export function DocumentInput({
  label,
  description,
  value,
  fileName,
  onChange,
  maxChars,
  placeholder,
}: {
  label: string;
  description?: string;
  value: string;
  fileName?: string;
  onChange: (text: string, fileName?: string) => void;
  maxChars: number;
  placeholder?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "paste">(value && !fileName ? "paste" : "upload");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [warning, setWarning] = useState<string>();

  const upload = async (file: File) => {
    setError(undefined);
    setWarning(undefined);
    if (file.size > MAX_BYTES) return setError("Files must be 5 MB or smaller.");
    if (/\.doc$/i.test(file.name)) return setError("Older .doc files aren't supported. Save as PDF or .docx, or paste the text.");
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/parse-document", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { text?: string; truncated?: boolean; error?: string };
      if (!res.ok || !data.text) {
        setError(data.error || "We couldn't read that file. Try pasting the text instead.");
        return;
      }
      onChange(data.text.slice(0, maxChars), file.name);
      if (data.truncated || data.text.length > maxChars) {
        setWarning("This document is long, so only the first part will be used.");
      }
    } catch {
      setError("Upload failed. Check your connection, or paste the text instead.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{label}</p>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        <div className="flex rounded-md border border-line bg-paper p-0.5 text-sm" role="tablist" aria-label={`${label} input method`}>
          {(["upload", "paste"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1 font-bold ${mode === m ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
            >
              {m === "upload" ? "Upload file" : "Paste text"}
            </button>
          ))}
        </div>
      </div>

      {mode === "upload" ? (
        value && fileName ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3">
            <FileText className="h-6 w-6 shrink-0 text-indigo" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{fileName}</p>
              <p className="text-sm text-muted">{value.length.toLocaleString()} characters of text read</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("", undefined)} aria-label={`Remove ${fileName}`}>
              <X className="h-4 w-4" aria-hidden /> Remove
            </Button>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) void upload(f);
            }}
            className="flex flex-col items-center gap-2 rounded-[var(--radius-control)] border-2 border-dashed border-line-strong bg-surface px-4 py-6 text-center"
          >
            <Upload className="h-6 w-6 text-muted" aria-hidden />
            <p className="text-sm text-muted">Drop a PDF, .docx or .txt here (max 5 MB), or</p>
            <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}>
              {busy ? "Reading file…" : "Choose file"}
            </Button>
            <input
              ref={input}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void upload(f);
              }}
            />
          </div>
        )
      ) : (
        <TextArea
          label={`${label} text`}
          className="[&_label]:sr-only"
          value={value}
          maxLength={maxChars}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value, undefined)}
          hint={`${value.length.toLocaleString()} / ${maxChars.toLocaleString()} characters`}
        />
      )}
      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}
      {warning && <Notice tone="warning">{warning}</Notice>}
    </div>
  );
}
