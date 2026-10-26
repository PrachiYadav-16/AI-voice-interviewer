"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, MessageSquareText, Pause, Play, Repeat2, SkipForward, Square, Volume2, VolumeX } from "lucide-react";
import { useVapiInterview } from "@/lib/hooks/useVapiInterview";
import { useSession } from "@/lib/hooks/useUserData";
import { buildAssistant } from "@/lib/interview/prompt";
import { FORMATS, estimatedMinutes } from "@/lib/interview/catalog";
import { currentQuestion, hasCandidateSpeech } from "@/lib/interview/session";
import { getSession, saveSession } from "@/lib/storage";
import { Logo } from "@/components/Headers";
import { Button, ButtonLink, ConfirmDialog, Notice } from "@/components/ui";
import { InterviewerPresence, MicMeter, statusLabel } from "@/components/live/Presence";
import { TranscriptList } from "@/components/live/TranscriptList";
import { cn } from "@/lib/utils";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

function formatClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function LiveInterview({ userId, sessionId }: { userId: string; sessionId: string }) {
  const router = useRouter();
  const session = useSession(userId, sessionId);
  const live = useVapiInterview({ publicKey: PUBLIC_KEY });
  const { state } = live;
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const finalised = useRef(false);

  const isLive = state.phase === "active" || state.phase === "paused";
  const busy = state.phase === "requesting-mic" || state.phase === "connecting";

  // Clock tick while the call is running.
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isLive]);

  // Persist the transcript as it grows, so a closed tab or crash doesn't lose the interview.
  useEffect(() => {
    if (!state.turns.length || finalised.current) return;
    const s = getSession(userId, sessionId);
    if (!s || s.status !== "in-progress") return;
    try {
      saveSession({ ...s, transcript: state.turns, startedAt: s.startedAt ?? state.startedAt });
    } catch {
      /* storage full: surfaced when the interview ends */
    }
  }, [state.turns, state.startedAt, userId, sessionId]);

  // Warn before leaving mid-interview.
  useEffect(() => {
    if (!isLive) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isLive]);

  // When the call ends, close out the session and move to the report.
  const [saveError, setSaveError] = useState<string>();
  useEffect(() => {
    if (state.phase !== "ended" || finalised.current) return;
    const s = getSession(userId, sessionId);
    if (!s) return;
    finalised.current = true;
    const answered = hasCandidateSpeech(state.turns);
    try {
      saveSession({
        ...s,
        transcript: state.turns,
        startedAt: s.startedAt ?? state.startedAt,
        endedAt: state.endedAt ?? Date.now(),
        endedReason: state.endedReason,
        status: answered ? "completed" : "abandoned",
      });
      router.replace(`/report/${sessionId}${answered ? "?generate=1" : ""}`);
    } catch (err) {
      finalised.current = false;
      queueMicrotask(() => setSaveError(err instanceof Error ? err.message : "Couldn't save the transcript."));
    }
  }, [state.phase, state.turns, state.startedAt, state.endedAt, state.endedReason, userId, sessionId, router]);

  const assistant = useMemo(
    () =>
      session
        ? buildAssistant(session.config, session.plan, {
            llmModel: process.env.NEXT_PUBLIC_VAPI_LLM_MODEL,
            voiceId: process.env.NEXT_PUBLIC_VAPI_VOICE_ID,
          })
        : null,
    [session],
  );

  if (!session) {
    return (
      <Centered>
        <h1 className="text-2xl">This interview doesn&apos;t exist on this device</h1>
        <p className="text-muted">It may have been deleted, or it was started in a different browser.</p>
        <ButtonLink href="/practice">Set up a new interview</ButtonLink>
      </Centered>
    );
  }

  if (session.status !== "in-progress" && state.phase === "idle") {
    return (
      <Centered>
        <h1 className="text-2xl">This interview has already finished</h1>
        <div className="flex gap-2">
          <ButtonLink href={`/report/${session.id}`}>See the report</ButtonLink>
          <ButtonLink href="/practice?repeat=1" variant="secondary">
            Practise again
          </ButtonLink>
        </div>
      </Centered>
    );
  }

  const config = session.config;
  const question = currentQuestion(state.turns);
  const elapsed = state.startedAt ? now - state.startedAt : 0;
  const progress = Math.min(state.questionsAsked, config.questionCount);
  const label = statusLabel(state.phase, state.floor, state.muted);

  // ───────────── Before the call ─────────────
  if (state.phase === "idle" || busy || (state.phase === "failed" && !state.turns.length)) {
    return (
      <Room>
        <div className="mx-auto grid max-w-3xl gap-8 py-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-5">
            <div>
              <p className="font-bold text-indigo">{FORMATS[config.format].title}</p>
              <h1 className="text-3xl sm:text-4xl">{config.roleTitle}</h1>
              <p className="mt-1 text-muted">
                About {estimatedMinutes(config.questionCount)} minutes · {config.questionCount} main questions
                {config.organization ? ` · ${config.organization}` : ""}
              </p>
            </div>
            <ul className="space-y-2 text-[0.95rem]">
              <li className="flex gap-2">
                <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />
                Headphones stop the interviewer hearing itself. A quiet room helps it hear you.
              </li>
              <li className="flex gap-2">
                <Pause className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />
                Pause any time. Say &ldquo;could you repeat that?&rdquo; or use the Repeat button.
              </li>
              <li className="flex gap-2">
                <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />
                Feedback comes after the interview, based on the transcript.
              </li>
            </ul>
            {state.phase === "failed" && state.error && (
              <Notice tone="error" role="alert" title="The interview couldn't start">
                {state.error.message}
              </Notice>
            )}
            {!PUBLIC_KEY && (
              <Notice tone="error" title="Voice isn't configured">
                Add NEXT_PUBLIC_VAPI_PUBLIC_KEY to the site&apos;s environment to run live interviews.
              </Notice>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={() => assistant && live.start(assistant)} loading={busy} disabled={!PUBLIC_KEY || !assistant}>
                {state.phase === "requesting-mic"
                  ? "Waiting for microphone…"
                  : state.phase === "connecting"
                    ? "Connecting…"
                    : state.phase === "failed"
                      ? "Try again"
                      : "Start interview"}
              </Button>
              <ButtonLink href="/practice" variant="ghost" size="lg">
                Change setup
              </ButtonLink>
            </div>
          </div>
          <div className="hidden justify-self-center md:block">
            <InterviewerPresence level={0} floor="waiting" phase={state.phase} />
          </div>
        </div>
      </Room>
    );
  }

  // ───────────── During / after the call ─────────────
  return (
    <Room
      right={
        <span className="font-mono text-sm tabular-nums text-muted" aria-label={`Elapsed ${formatClock(elapsed)}`}>
          {formatClock(elapsed)}
        </span>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="flex min-h-[60dvh] flex-col" aria-label="Interview">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-bold text-muted">
              Question {Math.max(progress, 1)} of about {config.questionCount}
            </p>
            <MicMeter level={live.micLevel} muted={state.muted || state.phase === "paused"} active={isLive} />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-indigo transition-[width]" style={{ width: `${(progress / config.questionCount) * 100}%` }} />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
            <InterviewerPresence level={live.interviewerLevel} floor={state.floor} phase={state.phase} />
            <p
              role="status"
              className={cn(
                "rounded-md px-3 py-1 text-sm font-bold",
                state.phase === "active" && state.floor === "candidate" ? "bg-marigold-soft text-[#7a4f00]" : "bg-surface text-muted",
              )}
            >
              {label}
            </p>
            <p className="max-w-2xl font-display text-2xl font-semibold leading-snug sm:text-3xl">
              {question ?? "Your interviewer will introduce the session in a moment."}
            </p>
            {state.partial.candidate && <p className="max-w-xl text-muted italic">{state.partial.candidate}</p>}
          </div>

          {live.audioBlocked && isLive && (
            <Notice tone="warning" title="Your browser blocked the interviewer's voice" className="mb-4" role="alert">
              <Button size="sm" className="mt-2" onClick={live.enableAudio}>
                Turn on sound
              </Button>
            </Notice>
          )}
          {state.phase === "paused" && (
            <Notice tone="info" title="Interview paused" className="mb-4">
              Your microphone is off and the interviewer is waiting. Resume when you&apos;re ready.
            </Notice>
          )}
          {state.phase === "failed" && state.error && (
            <Notice tone="error" role="alert" title="The connection was lost" className="mb-4">
              <p>{state.error.message}</p>
              <p className="mt-1">Your answers so far are saved. You can get feedback on them, or start a fresh interview.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const s = getSession(userId, sessionId);
                    if (s) {
                      saveSession({ ...s, transcript: state.turns, endedAt: Date.now(), status: hasCandidateSpeech(state.turns) ? "completed" : "abandoned", endedReason: "connection-lost" });
                      router.replace(`/report/${sessionId}?generate=1`);
                    }
                  }}
                >
                  Get feedback on what I said
                </Button>
                <ButtonLink href="/practice?repeat=1" size="sm" variant="secondary">
                  Start again
                </ButtonLink>
              </div>
            </Notice>
          )}
          {saveError && (
            <Notice tone="error" role="alert" className="mb-4">
              {saveError}
            </Notice>
          )}

          {/* Controls */}
          <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-[var(--radius-card)] sm:border sm:bg-surface">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => live.setMuted(!state.muted)}
                disabled={state.phase !== "active"}
                aria-pressed={state.muted}
              >
                {state.muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
                {state.muted ? "Unmute" : "Mute"}
              </Button>
              {state.phase === "paused" ? (
                <Button onClick={live.resume}>
                  <Play className="h-4 w-4" aria-hidden /> Resume
                </Button>
              ) : (
                <Button variant="secondary" onClick={live.pause} disabled={state.phase !== "active"}>
                  <Pause className="h-4 w-4" aria-hidden /> Pause
                </Button>
              )}
              <Button variant="secondary" onClick={live.repeat} disabled={state.phase !== "active"}>
                <Repeat2 className="h-4 w-4" aria-hidden /> Repeat
              </Button>
              <Button variant="secondary" onClick={live.skip} disabled={state.phase !== "active"}>
                <SkipForward className="h-4 w-4" aria-hidden /> Skip
              </Button>
              <Button variant="danger" onClick={() => setConfirmEnd(true)} disabled={!isLive}>
                <Square className="h-4 w-4" aria-hidden /> End
              </Button>
              <Button variant="ghost" className="lg:hidden" onClick={() => setShowTranscript((s) => !s)} aria-expanded={showTranscript}>
                <MessageSquareText className="h-4 w-4" aria-hidden /> Transcript
              </Button>
            </div>
          </div>
        </section>

        <aside
          className={cn(
            "rounded-[var(--radius-card)] border border-line bg-surface p-5 lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto",
            showTranscript ? "block" : "hidden",
          )}
          aria-label="Live transcript"
        >
          <h2 className="mb-4 text-lg">Transcript</h2>
          <TranscriptList turns={state.turns} partial={state.partial} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        title="End the interview?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
              Keep going
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmEnd(false);
                if (state.phase === "paused") live.resume();
                live.wrapUp();
              }}
              disabled={state.phase === "ending"}
            >
              Let the interviewer close
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmEnd(false);
                live.end();
              }}
            >
              End now
            </Button>
          </>
        }
      >
        Your answers so far will be saved and used for feedback. &ldquo;Let the interviewer close&rdquo; finishes the way a real interview would.
      </ConfirmDialog>
    </Room>
  );
}

function Room({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo className="text-lg" />
          {right ?? (
            <Link href="/dashboard" className="text-sm font-bold text-muted hover:text-ink">
              Leave
            </Link>
          )}
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Room>
      <div className="mx-auto grid max-w-lg justify-items-start gap-4 py-16">{children}</div>
    </Room>
  );
}
