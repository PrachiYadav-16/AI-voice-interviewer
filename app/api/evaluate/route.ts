import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { guard, jsonError, readJson } from "@/lib/server/guard";
import { LlmNotConfiguredError, chatJson } from "@/lib/server/llm";
import { EvaluationOutputSchema, InterviewConfigSchema, TranscriptTurnSchema } from "@/lib/interview/types";
import { buildEvaluationPrompt } from "@/lib/interview/evaluatePrompt";
import { rubricFor } from "@/lib/interview/catalog";
import { buildReport } from "@/lib/interview/scoring";
import { hasCandidateSpeech } from "@/lib/interview/session";

export const runtime = "nodejs";
export const maxDuration = 90;

const BodySchema = z.object({
  config: InterviewConfigSchema,
  transcript: z.array(TranscriptTurnSchema).min(1).max(400),
});

/** Generates a rubric-based report from the actual transcript. Nothing is stored server-side. */
export async function POST(req: NextRequest) {
  const blocked = guard(req, "evaluate", 20);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await readJson(req, 300_000);
  } catch {
    return jsonError(400, "The request was too large or not valid JSON.");
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "The interview data is incomplete or invalid.");
  const { config, transcript } = parsed.data;

  if (!hasCandidateSpeech(transcript)) {
    return jsonError(422, "There's not enough of your speech in this transcript to evaluate.", { code: "no-answers" });
  }

  const rubricId = rubricFor(config.trackId, config.format);
  try {
    const { system, user } = buildEvaluationPrompt(config, transcript, rubricId);
    const raw = await chatJson({ system, user, maxTokens: 6000, temperature: 0.2, timeoutMs: 80_000 });
    const output = EvaluationOutputSchema.safeParse(raw);
    if (!output.success) return jsonError(502, "The AI returned an incomplete report. Try generating it again.");
    return NextResponse.json({ report: buildReport(output.data, rubricId) });
  } catch (err) {
    if (err instanceof LlmNotConfiguredError) {
      return jsonError(503, "Feedback reports aren't configured on this site yet. Your transcript has been saved.", { code: "llm-not-configured" });
    }
    return jsonError(502, "The AI service didn't respond. Your transcript is saved; try generating the report again.");
  }
}
