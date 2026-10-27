import { z } from "zod";

/** Top-level grouping shown in setup. */
export const CATEGORY_IDS = ["government", "private", "custom"] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const FORMAT_IDS = [
  "hr",
  "behavioral",
  "technical",
  "situational",
  "resume",
  "job-description",
  "company",
  "government-personality",
  "panel",
  "stress",
  "custom",
] as const;
export type FormatId = (typeof FORMAT_IDS)[number];

export const LEVEL_IDS = ["intern", "entry", "mid", "senior", "leadership"] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

export const STYLE_IDS = ["friendly", "neutral", "formal", "challenging"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export const DIFFICULTY_IDS = ["easy", "standard", "hard"] as const;
export type DifficultyId = (typeof DIFFICULTY_IDS)[number];

export const LANGUAGE_IDS = ["en-IN", "en-US", "en-GB", "hi", "hinglish"] as const;
export type LanguageId = (typeof LANGUAGE_IDS)[number];

/** Which evaluation rubric applies. Chosen from format + field. */
export const RUBRIC_IDS = [
  "behavioral",
  "technical",
  "design",
  "product",
  "data",
  "government",
  "general",
] as const;
export type RubricId = (typeof RUBRIC_IDS)[number];

const shortText = (max: number) => z.string().trim().max(max);

/** Everything needed to run one interview. Validated on the client and again on the server. */
export const InterviewConfigSchema = z.object({
  category: z.enum(CATEGORY_IDS),
  trackId: shortText(80),
  roleTitle: shortText(120).min(2, "Enter the role you are preparing for"),
  field: shortText(80),
  organization: shortText(120).optional().default(""),
  level: z.enum(LEVEL_IDS),
  format: z.enum(FORMAT_IDS),
  style: z.enum(STYLE_IDS),
  difficulty: z.enum(DIFFICULTY_IDS),
  language: z.enum(LANGUAGE_IDS),
  questionCount: z.number().int().min(3).max(15),
  focusTopics: z.array(shortText(80)).max(12).default([]),
  customQuestions: z.array(shortText(400)).max(10).default([]),
  jobDescription: shortText(12000).optional().default(""),
  resumeText: shortText(16000).optional().default(""),
  /** Extra guidance specific to the government track (e.g. optional subject, home state). */
  backgroundNotes: shortText(1500).optional().default(""),
});
export type InterviewConfig = z.infer<typeof InterviewConfigSchema>;

/** Output of /api/plan: personalisation extracted from resume + JD. */
export const InterviewPlanSchema = z.object({
  summary: z.string().max(600),
  skills: z.array(z.string().max(80)).max(20),
  responsibilities: z.array(z.string().max(200)).max(12),
  resumeClaims: z.array(z.string().max(240)).max(12),
  questions: z
    .array(
      z.object({
        question: z.string().max(400),
        why: z.string().max(300),
        source: z.enum(["resume", "job-description", "role", "custom"]),
      }),
    )
    .max(15),
});
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

export type Speaker = "interviewer" | "candidate";

export interface TranscriptTurn {
  id: string;
  speaker: Speaker;
  text: string;
  /** ms since epoch when the first final segment of this turn arrived */
  at: number;
}

export const TranscriptTurnSchema = z.object({
  id: z.string().max(64),
  speaker: z.enum(["interviewer", "candidate"]),
  text: z.string().max(6000),
  at: z.number(),
});

export type SessionStatus = "in-progress" | "completed" | "abandoned";

export interface InterviewSession {
  id: string;
  userId: string;
  config: InterviewConfig;
  plan?: InterviewPlan;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  status: SessionStatus;
  endedReason?: string;
  transcript: TranscriptTurn[];
  report?: InterviewReport;
  reportError?: string;
  /** ms since epoch of the last local change; used to merge with the cloud copy. */
  updatedAt?: number;
}

/** Per-criterion rating returned by the evaluator. null = could not assess from the transcript. */
export const CriterionScoreSchema = z.object({
  criterion: z.string().max(60),
  score: z.number().int().min(1).max(5).nullable(),
  evidence: z.string().max(500),
});

export const QuestionFeedbackSchema = z.object({
  question: z.string().max(600),
  answerSummary: z.string().max(600),
  answered: z.boolean(),
  criteria: z.array(CriterionScoreSchema).max(8),
  whatWorked: z.string().max(600),
  improve: z.string().max(800),
  suggestedStructure: z.string().max(500),
  improvedAnswer: z.string().max(1500),
});
export type QuestionFeedback = z.infer<typeof QuestionFeedbackSchema>;

/** Shape the LLM must return. Overall numbers are computed by us, not by the model. */
export const EvaluationOutputSchema = z.object({
  questions: z.array(QuestionFeedbackSchema).max(25),
  strengths: z.array(z.string().max(300)).max(6),
  improvements: z.array(z.string().max(300)).max(6),
  communication: z.object({
    clarity: z.string().max(500),
    conciseness: z.string().max(500),
  }),
  nextPractice: z.object({
    format: z.enum(FORMAT_IDS),
    reason: z.string().max(300),
  }),
  limitations: z.array(z.string().max(300)).max(5),
});
export type EvaluationOutput = z.infer<typeof EvaluationOutputSchema>;

export interface CriterionAverage {
  criterion: string;
  average: number | null;
  rated: number;
}

export interface InterviewReport extends EvaluationOutput {
  rubricId: RubricId;
  generatedAt: number;
  /** 0–100, or null when there was not enough rated material to justify a number. */
  overallScore: number | null;
  criterionAverages: CriterionAverage[];
  answeredCount: number;
  scoreNote: string;
}
