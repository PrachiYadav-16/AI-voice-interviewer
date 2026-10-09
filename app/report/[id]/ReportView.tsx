"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { useSession } from "@/lib/hooks/useUserData";
import { generateReport } from "@/lib/client/reports";
import { deleteSession } from "@/lib/storage";
import { FORMATS, rubricFor } from "@/lib/interview/catalog";
import { RUBRICS, SCALE } from "@/lib/interview/rubrics";
import { hasCandidateSpeech } from "@/lib/interview/session";
import type { InterviewSession, QuestionFeedback } from "@/lib/interview/types";
import { Button, ButtonLink, Card, ConfirmDialog, Notice, PageTitle } from "@/components/ui";
import { CriterionBar, ScoreChip } from "@/components/report/ScoreBits";
import { TranscriptList } from "@/components/live/TranscriptList";

function minutes(s: InterviewSession) {
  if (!s.startedAt || !s.endedAt) return null;
  return Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000));
}

export function ReportView({ userId, sessionId }: { userId: string; sessionId: string }) {
  const session = useSession(userId, sessionId);
  const router = useRouter();
  const params = useSearchParams();
  const [generating, setGenerating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const autoStarted = useRef(false);

  const run = async () => {
    if (!session) return;
    setGenerating(true);
    await generateReport(session);
    setGenerating(false);
  };

  // Generate automatically once when arriving from a finished interview.
  useEffect(() => {
    if (autoStarted.current || !session || session.report || session.reportError) return;
    if (params.get("generate") !== "1" || !hasCandidateSpeech(session.transcript)) return;
    autoStarted.current = true;
    queueMicrotask(() => setGenerating(true));
    void generateReport(session).finally(() => setGenerating(false));
  }, [session, params]);

  if (!session) {
    return (
      <div className="space-y-4 py-10">
        <h1 className="text-2xl font-bold">Report not found</h1>
        <p className="text-muted">It may have been deleted, or it&apos;s stored in a different browser.</p>
        <ButtonLink href="/history">Back to history</ButtonLink>
      </div>
    );
  }

  const { config, report } = session;
  const rubric = RUBRICS[report?.rubricId ?? rubricFor(config.trackId, config.format)];
  const dur = minutes(session);
  const answered = hasCandidateSpeech(session.transcript);
  const date = new Date(session.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  const deleteDialog = (
    <ConfirmDialog
      open={confirmDelete}
      onClose={() => setConfirmDelete(false)}
      title="Delete this interview?"
      actions={
        <>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteSession(userId, sessionId);
              router.replace("/history");
            }}
          >
            Delete permanently
          </Button>
        </>
      }
    >
      The transcript and report will be removed from this browser. This can&apos;t be undone.
    </ConfirmDialog>
  );

  const header = (
    <PageTitle
      title={config.roleTitle}
      description={
        <>
          {FORMATS[config.format].title}
          {config.organization ? ` · ${config.organization}` : ""} · {date}
          {dur ? ` · ${dur} min` : ""}
        </>
      }
      actions={
        <>
          <ButtonLink href={`/practice?repeat=1`} variant="secondary">
            Practise again
          </ButtonLink>
          <Button variant="ghost" onClick={() => setConfirmDelete(true)} aria-label="Delete this interview">
            <Trash2 className="h-4 w-4" aria-hidden /> Delete
          </Button>
        </>
      }
    />
  );

  // ───────────── No report yet ─────────────
  if (!report) {
    return (
      <>
        {header}
        <div className="max-w-2xl space-y-4">
          {session.status === "in-progress" && (
            <Notice tone="warning" title="This interview didn't finish">
              The call was interrupted before it ended. {answered ? "You can still get feedback on what you said." : ""}
            </Notice>
          )}
          {!answered ? (
            <Notice tone="info" title="Not enough to review">
              There&apos;s too little of your speech in this transcript to give useful feedback. Start a new interview when you&apos;re ready.
            </Notice>
          ) : generating ? (
            <Card>
              <div className="flex items-center gap-3" role="status">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo border-r-transparent" aria-hidden />
                <div>
                  <p className="font-bold">Reviewing your answers…</p>
                  <p className="text-sm text-muted">This usually takes 20–40 seconds. You can leave this page; the report will be saved.</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="space-y-3">
              {session.reportError && (
                <Notice tone="error" role="alert">
                  {session.reportError}
                </Notice>
              )}
              <p>Your transcript is saved. Generate a report to see feedback on each answer.</p>
              <Button onClick={run}>{session.reportError ? "Try again" : "Generate report"}</Button>
            </Card>
          )}
          <Transcript session={session} defaultOpen />
        </div>
        {deleteDialog}
      </>
    );
  }

  // ───────────── Report ─────────────
  return (
    <>
      {header}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="text-center sm:pr-6 sm:text-left">
              {report.overallScore !== null ? (
                <>
                  <p className="font-display text-6xl font-bold leading-none tabular-nums">{report.overallScore}</p>
                  <p className="mt-1 text-sm text-muted">out of 100</p>
                </>
              ) : (
                <p className="max-w-[10rem] font-display text-xl font-bold">No overall score</p>
              )}
            </div>
            <div className="space-y-2.5">
              {report.criterionAverages.map((c) => (
                <CriterionBar key={c.criterion} name={c.criterion} average={c.average} rated={c.rated} />
              ))}
              <p className="pt-1 text-sm text-muted">{report.scoreNote}</p>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-xl font-bold text-sage">What went well</h2>
              <ul className="list-disc space-y-2 pl-5">
                {report.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-3 text-xl font-bold text-brick">What to work on</h2>
              <ol className="list-decimal space-y-2 pl-5">
                {report.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </Card>
          </div>

          <section aria-labelledby="qa-heading" className="space-y-3">
            <h2 id="qa-heading" className="text-2xl font-bold">
              Answer by answer
            </h2>
            {report.questions.map((q, i) => (
              <QuestionCard key={i} q={q} index={i} defaultOpen={i === 0} />
            ))}
          </section>

          <Transcript session={session} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <h2 className="mb-2 text-lg font-bold">Practise next</h2>
            <p className="mb-1 font-bold">{FORMATS[report.nextPractice.format].title}</p>
            <p className="mb-4 text-muted">{report.nextPractice.reason}</p>
            <ButtonLink href={`/practice?track=${config.trackId}&format=${report.nextPractice.format}`} className="w-full">
              Set it up
            </ButtonLink>
          </Card>
          <Card>
            <h2 className="mb-3 text-lg font-bold">Communication</h2>
            <p className="mb-2">
              <span className="font-bold">Clarity: </span>
              {report.communication.clarity}
            </p>
            <p className="mb-3">
              <span className="font-bold">Conciseness: </span>
              {report.communication.conciseness}
            </p>
            <p className="text-sm text-muted">Judged from the transcript only. Tone, pace, confidence and body language aren&apos;t measured.</p>
          </Card>
          {rubric.framework && (
            <Card>
              <h2 className="mb-2 text-lg font-bold">The {rubric.framework.name} method</h2>
              <p className="text-[0.95rem]">{rubric.framework.explanation}</p>
            </Card>
          )}
          <Card>
            <details>
              <summary className="cursor-pointer text-lg font-bold">How this was scored</summary>
              <div className="mt-3 space-y-3 text-[0.95rem]">
                <p>
                  Each answer was rated against the <strong>{rubric.title.toLowerCase()}</strong> rubric. The overall number is the average of those ratings,
                  calculated by IntervU — not chosen by the AI.
                </p>
                <ul className="space-y-1">
                  {rubric.criteria.map((c) => (
                    <li key={c.name}>
                      <strong>{c.name}:</strong> {c.description}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-0.5 text-muted">
                  {SCALE.map((s) => (
                    <li key={s.score}>
                      {s.score} {s.label}: {s.meaning}
                    </li>
                  ))}
                </ul>
                {report.limitations.length > 0 && (
                  <>
                    <p className="font-bold">Limits of this review</p>
                    <ul className="list-disc pl-5 text-muted">
                      {report.limitations.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="text-muted">AI feedback can be wrong. Use it as a coach&apos;s second opinion, not a verdict.</p>
              </div>
            </details>
          </Card>
        </aside>
      </div>
      {deleteDialog}
    </>
  );
}

function QuestionCard({ q, index, defaultOpen }: { q: QuestionFeedback; index: number; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-[var(--radius-card)] border border-line bg-surface" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-start gap-3 p-5">
        <span className="font-display text-lg font-bold text-muted">{index + 1}</span>
        <span className="flex-1">
          <span className="block font-bold">{q.question}</span>
          {!q.answered && <span className="text-sm text-muted">Skipped or not answered</span>}
        </span>
        <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-4 border-t border-line p-5">
        <p className="text-muted">
          <span className="font-bold text-ink">You said: </span>
          {q.answerSummary}
        </p>
        {q.criteria.length > 0 && (
          <ul className="space-y-2">
            {q.criteria.map((c) => (
              <li key={c.criterion} className="grid gap-1 sm:grid-cols-[10rem_auto_1fr] sm:items-baseline sm:gap-3">
                <span className="font-bold">{c.criterion}</span>
                <ScoreChip score={c.score} />
                <span className="text-sm text-muted">{c.evidence}</span>
              </li>
            ))}
          </ul>
        )}
        {q.whatWorked && (
          <p>
            <span className="font-bold text-sage">Worked: </span>
            {q.whatWorked}
          </p>
        )}
        {q.improve && (
          <p>
            <span className="font-bold text-brick">Improve: </span>
            {q.improve}
          </p>
        )}
        {q.suggestedStructure && (
          <p>
            <span className="font-bold">Structure to try: </span>
            {q.suggestedStructure}
          </p>
        )}
        {q.improvedAnswer && (
          <div className="rounded-[var(--radius-control)] border-l-4 border-indigo bg-indigo-soft/50 px-4 py-3">
            <p className="mb-1 text-sm font-bold text-indigo">A stronger version of your answer</p>
            <p className="leading-relaxed">{q.improvedAnswer}</p>
            <p className="mt-2 text-xs text-muted">Built from what you said. Fill the [bracketed] parts with your real details.</p>
          </div>
        )}
      </div>
    </details>
  );
}

function Transcript({ session, defaultOpen }: { session: InterviewSession; defaultOpen?: boolean }) {
  return (
    <details className="rounded-[var(--radius-card)] border border-line bg-surface" open={defaultOpen}>
      <summary className="cursor-pointer p-5 text-lg font-bold">Full transcript</summary>
      <div className="border-t border-line p-5">
        <TranscriptList turns={session.transcript} autoScroll={false} />
      </div>
    </details>
  );
}
