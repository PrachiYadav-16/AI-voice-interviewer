"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/Headers";
import { Activity, Award, ClipboardCheck, Crosshair } from "lucide-react";
import { ButtonLink, Card, PageTitle, StatTile } from "@/components/ui";
import { useProfile, useSessions } from "@/lib/hooks/useUserData";
import { summarise } from "@/lib/interview/progress";
import { FORMATS } from "@/lib/interview/catalog";
import { SessionList } from "@/components/SessionList";
import type { PublicUser } from "@/lib/auth";

export default function DashboardPage() {
  return (
    <AppShell>
      <RequireAuth>{(user) => <Dashboard user={user} />}</RequireAuth>
    </AppShell>
  );
}

function Dashboard({ user }: { user: PublicUser }) {
  const sessions = useSessions(user.id);
  const profile = useProfile(user.id);
  const p = summarise(sessions);
  const last = profile.lastConfig;
  const latestReport = sessions.find((s) => s.report);
  const firstName = user.name.split(" ")[0];

  if (!sessions.length) {
    return (
      <>
        <PageTitle title={`Welcome, ${firstName}`} description="Your first interview takes about five minutes to set up and start." />
        <Card className="max-w-3xl space-y-4 p-8 sm:p-10">
          <h2 className="text-2xl">Start with a practice interview</h2>
          <p className="text-muted">
            Choose a government or private-sector role, talk through the questions out loud, then get feedback on each answer. Your progress will show
            up here after your first report.
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/practice" size="lg">
              Set up an interview
            </ButtonLink>
            <ButtonLink href="/practice?track=campus-general" size="lg" variant="secondary">
              Try a quick HR round
            </ButtonLink>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title={`Hi, ${firstName}`}
        actions={
          <>
            {last?.trackId && (
              <ButtonLink href="/practice?repeat=1" variant="secondary">
                Repeat last setup
              </ButtonLink>
            )}
            <ButtonLink href="/practice">New interview</ButtonLink>
          </>
        }
      />

      {p.needsReport.length > 0 && (
        <Card className="mb-6 border-marigold/50 bg-marigold-soft/40">
          <h2 className="text-lg">Waiting for feedback</h2>
          <ul className="mt-2 space-y-1">
            {p.needsReport.slice(0, 3).map((s) => (
              <li key={s.id}>
                <Link href={`/report/${s.id}`} className="font-bold text-indigo underline">
                  {s.config.roleTitle}
                </Link>{" "}
                <span className="text-muted">· {new Date(s.createdAt).toLocaleDateString()} · {s.reportError ? "report failed, try again" : "report not generated yet"}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Interviews done" value={p.completed} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatTile
          label="Latest score"
          value={p.scoreSeries.length ? p.scoreSeries[p.scoreSeries.length - 1].score : <span className="text-xl text-muted">Not yet</span>}
          hint={p.scoreSeries.length ? "out of 100" : "after 3+ answers"}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatTile
          label="Recent average"
          value={p.averageRecent ?? <span className="text-xl text-muted">Not yet</span>}
          hint={p.averageRecent !== null ? `last ${Math.min(5, p.scoreSeries.length)} scored` : "no scores yet"}
          icon={<Award className="h-4 w-4" />}
        />
        <StatTile
          label="Focus area"
          value={<span className="text-xl">{p.weakest[0]?.criterion ?? "Not yet"}</span>}
          hint={p.weakest[0] ? `${p.weakest[0].average.toFixed(1)}/5 average` : "appears after reports"}
          icon={<Crosshair className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-xl">Score trend</h2>
            <span className="text-sm text-muted">
              {p.completed} interview{p.completed === 1 ? "" : "s"} · {p.reported} report{p.reported === 1 ? "" : "s"}
            </span>
          </div>
          {p.scoreSeries.length >= 2 ? (
            <>
              <Trend points={p.scoreSeries} />
              <p className="mt-3 text-sm text-muted">
                Average of your last {Math.min(5, p.scoreSeries.length)} scored interviews: <strong className="text-ink">{p.averageRecent}</strong>. Scores
                from different interview types use different rubrics, so compare like with like.
              </p>
            </>
          ) : (
            <p className="text-muted">
              {p.scoreSeries.length === 1
                ? `One scored interview so far (${p.scoreSeries[0].score}/100). Your trend appears after the second.`
                : "Scores appear once an interview has at least three answered questions."}
            </p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-xl">Focus areas</h2>
          {p.weakest.length ? (
            <>
              <p className="mb-2 text-sm text-muted">Lowest-rated criteria in recent reports</p>
              <ul className="space-y-1.5">
                {p.weakest.map((w) => (
                  <li key={w.criterion} className="flex justify-between">
                    <span>{w.criterion}</span>
                    <span className="font-bold tabular-nums">{w.average.toFixed(1)}/5</span>
                  </li>
                ))}
              </ul>
              {p.strongest.length > 0 && (
                <>
                  <p className="mb-2 mt-4 text-sm text-muted">Strongest</p>
                  <ul className="space-y-1.5">
                    {p.strongest.map((w) => (
                      <li key={w.criterion} className="flex justify-between">
                        <span>{w.criterion}</span>
                        <span className="font-bold tabular-nums">{w.average.toFixed(1)}/5</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="text-muted">Strengths and focus areas appear after a couple of reports.</p>
          )}
        </Card>

        {latestReport?.report && (
          <Card>
            <h2 className="mb-2 text-xl">Suggested next</h2>
            <p className="font-bold">{FORMATS[latestReport.report.nextPractice.format].title}</p>
            <p className="mb-4 text-muted">{latestReport.report.nextPractice.reason}</p>
            <ButtonLink href={`/practice?track=${latestReport.config.trackId}&format=${latestReport.report.nextPractice.format}`} variant="secondary">
              Set it up
            </ButtonLink>
          </Card>
        )}

        <Card className={latestReport?.report ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl">Recent interviews</h2>
            <Link href="/history" className="font-bold text-indigo underline">
              All history
            </Link>
          </div>
          <SessionList sessions={sessions.slice(0, 5)} />
        </Card>
      </div>
    </>
  );
}

/** Small SVG line chart of real scores (0–100). */
function Trend({ points }: { points: { id: string; at: number; score: number }[] }) {
  const w = 600;
  const h = 160;
  const pad = 24;
  const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1));
  const ys = points.map((p) => h - pad - (p.score / 100) * (h - pad * 2));
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" role="img" aria-label={`Scores over time: ${points.map((p) => p.score).join(", ")}`}>
      {[0, 50, 100].map((v) => {
        const y = h - pad - (v / 100) * (h - pad * 2);
        return (
          <g key={v}>
            <line x1={pad} x2={w - pad} y1={y} y2={y} stroke="var(--color-line)" />
            <text x={0} y={y + 4} fontSize="11" fill="var(--color-muted)">
              {v}
            </text>
          </g>
        );
      })}
      <path d={d} fill="none" stroke="var(--color-indigo)" strokeWidth="2.5" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={points[i].id} cx={x} cy={ys[i]} r="4" fill="var(--color-surface)" stroke="var(--color-indigo)" strokeWidth="2" />
      ))}
    </svg>
  );
}
