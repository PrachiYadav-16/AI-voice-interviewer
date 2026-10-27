import { NextResponse, type NextRequest } from "next/server";
import { guard, jsonError, readJson } from "@/lib/server/guard";
import { LlmNotConfiguredError, chatJson } from "@/lib/server/llm";
import { InterviewConfigSchema, InterviewPlanSchema } from "@/lib/interview/types";
import { buildPlanPrompt } from "@/lib/interview/evaluatePrompt";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Builds a personalised question plan from the resume and/or job description. */
export async function POST(req: NextRequest) {
  const blocked = await guard(req, "plan", 30);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await readJson(req, 80_000);
  } catch {
    return jsonError(400, "The request was too large or not valid JSON.");
  }
  const parsed = InterviewConfigSchema.safeParse((body as { config?: unknown })?.config);
  if (!parsed.success) return jsonError(400, "The interview settings are incomplete or invalid.");
  const config = parsed.data;
  if (!config.resumeText && !config.jobDescription) {
    return jsonError(400, "Add a resume or job description to build a personalised plan.");
  }

  try {
    const { system, user } = buildPlanPrompt(config);
    const raw = await chatJson({ system, user, maxTokens: 2500, temperature: 0.4, timeoutMs: 45_000 });
    const plan = InterviewPlanSchema.safeParse(raw);
    if (!plan.success) return jsonError(502, "The AI returned an unusable plan. Try again, or start without one.");
    return NextResponse.json({ plan: plan.data });
  } catch (err) {
    if (err instanceof LlmNotConfiguredError) {
      return jsonError(503, "Personalised planning isn't configured on this site. You can still start a role-based interview.", { code: "llm-not-configured" });
    }
    return jsonError(502, "The AI service didn't respond. Try again, or start without a plan.");
  }
}
