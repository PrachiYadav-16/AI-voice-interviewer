import type { InterviewConfig } from "@/lib/interview/types";
import type { EvaluationOutput } from "@/lib/interview/types";

export function makeConfig(overrides: Partial<InterviewConfig> = {}): InterviewConfig {
  return {
    category: "private",
    trackId: "software",
    roleTitle: "Frontend Developer",
    field: "Software engineering",
    organization: "",
    level: "entry",
    format: "technical",
    style: "neutral",
    difficulty: "standard",
    language: "en-IN",
    questionCount: 8,
    focusTopics: [],
    customQuestions: [],
    jobDescription: "",
    resumeText: "",
    backgroundNotes: "",
    ...overrides,
  };
}

export function makeOutput(scores: (number | null)[][], criteria = ["Correctness", "Reasoning", "Approach", "Trade-offs", "Explanation"]): EvaluationOutput {
  return {
    questions: scores.map((row, i) => ({
      question: `Q${i + 1}`,
      answerSummary: "summary",
      answered: row.length > 0,
      criteria: row.map((s, j) => ({ criterion: criteria[j], score: s, evidence: "e" })),
      whatWorked: "",
      improve: "",
      suggestedStructure: "",
      improvedAnswer: "",
    })),
    strengths: [],
    improvements: [],
    communication: { clarity: "", conciseness: "" },
    nextPractice: { format: "behavioral", reason: "" },
    limitations: [],
  };
}

/** Minimal in-memory localStorage for code that runs in the browser. */
export function installLocalStorage() {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  const win = { localStorage: ls, addEventListener() {}, removeEventListener() {} };
  Object.assign(globalThis, { window: win, localStorage: ls });
  return store;
}
