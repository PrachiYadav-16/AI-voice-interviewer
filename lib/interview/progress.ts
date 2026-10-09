import type { InterviewSession } from "./types";

export interface ProgressSummary {
  completed: number;
  reported: number;
  /** Chronological overall scores (only sessions that earned one). */
  scoreSeries: { id: string; at: number; score: number }[];
  averageRecent: number | null;
  /** Weakest and strongest rubric criteria across recent reports, by average rating. */
  weakest: { criterion: string; average: number }[];
  strongest: { criterion: string; average: number }[];
  needsReport: InterviewSession[];
}

/** Everything the dashboard shows, derived only from saved sessions. */
export function summarise(sessions: InterviewSession[], recentN = 5): ProgressSummary {
  const finished = sessions.filter((s) => s.status === "completed" || (s.status === "in-progress" && s.transcript.length > 0));
  const withReport = sessions.filter((s) => s.report);
  const scoreSeries = withReport
    .filter((s) => s.report!.overallScore !== null)
    .map((s) => ({ id: s.id, at: s.createdAt, score: s.report!.overallScore as number }))
    .sort((a, b) => a.at - b.at);

  const recent = scoreSeries.slice(-recentN);
  const averageRecent = recent.length ? Math.round(recent.reduce((a, b) => a + b.score, 0) / recent.length) : null;

  const totals = new Map<string, { sum: number; n: number }>();
  withReport
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, recentN)
    .forEach((s) =>
      s.report!.criterionAverages.forEach((c) => {
        if (c.average === null) return;
        const t = totals.get(c.criterion) ?? { sum: 0, n: 0 };
        totals.set(c.criterion, { sum: t.sum + c.average * c.rated, n: t.n + c.rated });
      }),
    );
  const ranked = [...totals.entries()]
    .filter(([, t]) => t.n >= 2)
    .map(([criterion, t]) => ({ criterion, average: Math.round((t.sum / t.n) * 10) / 10 }))
    .sort((a, b) => a.average - b.average);

  return {
    completed: finished.length,
    reported: withReport.length,
    scoreSeries,
    averageRecent,
    weakest: ranked.filter((r) => r.average < 3.5).slice(0, 3),
    strongest: ranked
      .filter((r) => r.average >= 3.5)
      .reverse()
      .slice(0, 3),
    needsReport: sessions.filter((s) => !s.report && s.transcript.some((t) => t.speaker === "candidate")),
  };
}
