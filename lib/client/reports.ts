"use client";

import type { InterviewReport, InterviewSession } from "@/lib/interview/types";
import { getSession, saveSession } from "@/lib/storage";

export type GenerateResult = { ok: true; report: InterviewReport } | { ok: false; error: string; code?: string };

const inFlight = new Map<string, Promise<GenerateResult>>();

/** Requests a report for a finished session and saves the result. De-duplicates concurrent calls. */
export function generateReport(session: InterviewSession): Promise<GenerateResult> {
  const existing = inFlight.get(session.id);
  if (existing) return existing;

  const run = (async (): Promise<GenerateResult> => {
    let result: GenerateResult;
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { ...session.config, resumeText: "" }, transcript: session.transcript }),
      });
      const data = (await res.json().catch(() => ({}))) as { report?: InterviewReport; error?: string; code?: string };
      result = res.ok && data.report ? { ok: true, report: data.report } : { ok: false, error: data.error || "The report couldn't be generated.", code: data.code };
    } catch {
      result = { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
    }
    const latest = getSession(session.userId, session.id) ?? session;
    saveSession(result.ok ? { ...latest, report: result.report, reportError: undefined } : { ...latest, reportError: result.error });
    return result;
  })();

  inFlight.set(session.id, run);
  void run.finally(() => inFlight.delete(session.id));
  return run;
}
