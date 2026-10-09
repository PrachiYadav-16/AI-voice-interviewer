import type { CriterionAverage, EvaluationOutput, InterviewReport, RubricId } from "./types";
import { RUBRICS } from "./rubrics";

/** Minimum answered questions before we show an overall number. */
export const MIN_ANSWERS_FOR_SCORE = 3;
/** Minimum individual criterion ratings before we show an overall number. */
export const MIN_RATINGS_FOR_SCORE = 6;

/**
 * Turns the evaluator's per-question criterion ratings into report numbers.
 * The overall score is computed here, deterministically, from the 1–5 ratings —
 * the model is never asked to invent a headline number.
 */
export function buildReport(output: EvaluationOutput, rubricId: RubricId, now = Date.now()): InterviewReport {
  const rubric = RUBRICS[rubricId];
  const answered = output.questions.filter((q) => q.answered);

  const criterionAverages: CriterionAverage[] = rubric.criteria.map((c) => {
    const ratings = answered
      .flatMap((q) => q.criteria)
      .filter((r) => normalise(r.criterion) === normalise(c.name) && r.score !== null)
      .map((r) => r.score as number);
    return {
      criterion: c.name,
      rated: ratings.length,
      average: ratings.length ? round1(mean(ratings)) : null,
    };
  });

  const allRatings = answered.flatMap((q) => q.criteria.map((r) => r.score)).filter((s): s is number => s !== null);

  let overallScore: number | null = null;
  let scoreNote: string;
  if (answered.length < MIN_ANSWERS_FOR_SCORE || allRatings.length < MIN_RATINGS_FOR_SCORE) {
    scoreNote = `No overall score: at least ${MIN_ANSWERS_FOR_SCORE} answered questions are needed for a meaningful number. Per-question feedback is still shown.`;
  } else {
    // Map the 1–5 mean onto 0–100 (1 → 0, 5 → 100).
    overallScore = Math.round(((mean(allRatings) - 1) / 4) * 100);
    scoreNote = `Average of ${allRatings.length} criterion ratings across ${answered.length} answers, on a 1–5 scale mapped to 0–100. It reflects this practice session only and does not predict selection.`;
  }

  return {
    ...output,
    rubricId,
    generatedAt: now,
    overallScore,
    criterionAverages,
    answeredCount: answered.length,
    scoreNote,
  };
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}
