import { describe, expect, it } from "vitest";
import { buildReport } from "@/lib/interview/scoring";
import { summarise } from "@/lib/interview/progress";
import { makeConfig, makeOutput } from "./helpers";
import type { InterviewSession } from "@/lib/interview/types";

describe("report scoring", () => {
  it("withholds an overall score when fewer than three answers were rated", () => {
    const r = buildReport(makeOutput([[4, 4, 4], [4, 4, 4]]), "technical");
    expect(r.overallScore).toBeNull();
    expect(r.scoreNote).toMatch(/at least 3/);
  });

  it("maps the 1–5 mean onto 0–100 deterministically", () => {
    expect(buildReport(makeOutput([[3, 3], [3, 3], [3, 3]]), "technical").overallScore).toBe(50);
    expect(buildReport(makeOutput([[5, 5], [5, 5], [5, 5]]), "technical").overallScore).toBe(100);
    expect(buildReport(makeOutput([[1, 1], [1, 1], [1, 1]]), "technical").overallScore).toBe(0);
  });

  it("ignores null ratings and unanswered questions", () => {
    const out = makeOutput([[4, null, 4], [4, null, 4], [4, 4], []]);
    const r = buildReport(out, "technical");
    expect(r.answeredCount).toBe(3);
    expect(r.overallScore).toBe(75);
    const reasoning = r.criterionAverages.find((c) => c.criterion === "Reasoning")!;
    expect(reasoning).toMatchObject({ average: 4, rated: 1 });
  });

  it("matches criterion names loosely but only to the selected rubric", () => {
    const out = makeOutput([[2], [4], [3]], ["trade offs"]);
    const r = buildReport(out, "technical");
    expect(r.criterionAverages.find((c) => c.criterion === "Trade-offs")?.average).toBe(3);
    expect(r.criterionAverages.find((c) => c.criterion === "Correctness")?.average).toBeNull();
  });
});

describe("dashboard summary", () => {
  const session = (id: string, at: number, score: number | null): InterviewSession => ({
    id,
    userId: "u",
    config: makeConfig(),
    createdAt: at,
    status: "completed",
    transcript: [{ id: "t", speaker: "candidate", text: "an answer here", at }],
    report: score === null ? undefined : { ...buildReport(makeOutput([[3], [3], [3]]), "technical"), overallScore: score },
  });

  it("builds the trend only from real scored reports, oldest first", () => {
    const p = summarise([session("b", 2, 60), session("a", 1, 40), session("c", 3, null)]);
    expect(p.scoreSeries.map((s) => s.score)).toEqual([40, 60]);
    expect(p.averageRecent).toBe(50);
    expect(p.needsReport.map((s) => s.id)).toEqual(["c"]);
  });

  it("is empty for a new user", () => {
    const p = summarise([]);
    expect(p).toMatchObject({ completed: 0, reported: 0, averageRecent: null, weakest: [], strongest: [] });
  });
});
