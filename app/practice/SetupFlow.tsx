"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Clock, Info } from "lucide-react";
import type { PublicUser } from "@/lib/auth";
import {
  CATEGORIES,
  DIFFICULTIES,
  FORMATS,
  LANGUAGES,
  LEVELS,
  STYLES,
  estimatedMinutes,
  getTrack,
  tracksFor,
  type Track,
} from "@/lib/interview/catalog";
import {
  InterviewConfigSchema,
  type CategoryId,
  type FormatId,
  type InterviewConfig,
  type InterviewPlan,
} from "@/lib/interview/types";
import { getProfile, newId, saveSession, StorageFullError, updateProfile } from "@/lib/storage";
import { useServiceStatus } from "@/lib/hooks/useServiceStatus";
import { Button, Card, ChoiceGroup, Notice, PageTitle, SelectField, TextArea, TextField } from "@/components/ui";
import { DocumentInput } from "@/components/DocumentInput";
import { cn } from "@/lib/utils";

const QUESTION_COUNTS = [5, 8, 12] as const;

const AVAILABILITY_LABEL = {
  yes: "Includes an interview",
  "some-posts": "Interview for some posts",
  rare: "Usually no interview",
} as const;

function defaultsFor(track: Track, prev?: Partial<InterviewConfig>): InterviewConfig {
  return {
    category: track.category,
    trackId: track.id,
    roleTitle: track.roles[0]?.title ?? "",
    field: track.field,
    organization: "",
    level: prev?.level ?? "entry",
    format: track.defaultFormat,
    style: prev?.style ?? (track.category === "government" ? "formal" : "neutral"),
    difficulty: prev?.difficulty ?? "standard",
    language: prev?.language ?? "en-IN",
    questionCount: prev?.questionCount ?? 8,
    focusTopics: [],
    customQuestions: [],
    jobDescription: "",
    resumeText: "",
    backgroundNotes: "",
  };
}

const splitLines = (s: string) =>
  s
    .split(/\n|,(?![^(]*\))/)
    .map((x) => x.trim())
    .filter(Boolean);

export function SetupFlow({ user }: { user: PublicUser }) {
  const router = useRouter();
  const params = useSearchParams();
  const status = useServiceStatus();
  const profile = useMemo(() => getProfile(user.id), [user.id]);

  // ?repeat=1 restores the last setup; ?format=x preselects a suggested format.
  const initial = useMemo(() => {
    const last = profile.lastConfig;
    if (params.get("repeat") && last?.trackId) {
      const t = getTrack(last.trackId);
      if (t) return { ...defaultsFor(t, last), ...last, resumeText: "", jobDescription: last.jobDescription ?? "" } as InterviewConfig;
    }
    return null;
  }, [params, profile.lastConfig]);

  const initialConfig = useMemo<InterviewConfig | null>(() => {
    if (initial) return initial;
    const fmt = params.get("format") as FormatId | null;
    const trackId = params.get("track");
    const t = trackId ? getTrack(trackId) : undefined;
    if (t) return { ...defaultsFor(t, profile.lastConfig), ...(fmt && t.formats.includes(fmt) ? { format: fmt } : {}) };
    return null;
  }, [initial, params, profile.lastConfig]);
  const [category, setCategory] = useState<CategoryId | null>(initialConfig?.category ?? null);
  const [config, setConfig] = useState<InterviewConfig | null>(initialConfig);
  const [useSavedResume, setUseSavedResume] = useState(Boolean(profile.resumeText));
  const [resumeFileName, setResumeFileName] = useState<string | undefined>();
  const [topicsText, setTopicsText] = useState(initial?.focusTopics.join(", ") ?? "");
  const [questionsText, setQuestionsText] = useState(initial?.customQuestions.join("\n") ?? "");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [planState, setPlanState] = useState<{ status: "idle" | "loading" | "ready" | "error"; plan?: InterviewPlan; message?: string }>({
    status: "idle",
  });
  const [starting, setStarting] = useState(false);

  const track = config ? getTrack(config.trackId) : undefined;
  const update = (patch: Partial<InterviewConfig>) => {
    setConfig((c) => (c ? { ...c, ...patch } : c));
    if (planState.status !== "idle") setPlanState({ status: "idle" });
  };

  const chooseTrack = (t: Track) => setConfig(defaultsFor(t, profile.lastConfig));

  /** Assemble the final config, folding in saved resume and free-text lists. */
  const finalConfig = (): InterviewConfig | null => {
    if (!config) return null;
    return {
      ...config,
      resumeText: useSavedResume && profile.resumeText ? profile.resumeText : config.resumeText,
      focusTopics: splitLines(topicsText).slice(0, 12),
      customQuestions: questionsText
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean)
        .slice(0, 10),
    };
  };

  const validate = (c: InterviewConfig): string[] => {
    const problems: string[] = [];
    const parsed = InterviewConfigSchema.safeParse(c);
    if (!parsed.success) problems.push(...parsed.error.issues.map((i) => i.message));
    const needs = FORMATS[c.format].needs;
    if (needs === "resume" && !c.resumeText) problems.push("A resume deep-dive needs your resume. Upload or paste it below.");
    if (needs === "job-description" && !c.jobDescription) problems.push("A job description match needs the job posting. Paste it below.");
    if (needs === "organization" && !c.organization) problems.push("Enter the organisation you're targeting.");
    if (!consent) problems.push("Confirm that you're happy for your voice to be processed for this interview.");
    return Array.from(new Set(problems));
  };

  const buildPlan = async () => {
    const c = finalConfig();
    if (!c) return;
    const problems = validate(c);
    setErrors(problems);
    if (problems.length) return;
    setPlanState({ status: "loading" });
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: c }),
      });
      const data = (await res.json().catch(() => ({}))) as { plan?: InterviewPlan; error?: string };
      if (!res.ok || !data.plan) {
        setPlanState({ status: "error", message: data.error || "Couldn't build a plan. You can still start the interview." });
        return;
      }
      setPlanState({ status: "ready", plan: data.plan });
    } catch {
      setPlanState({ status: "error", message: "Couldn't reach the server. You can still start the interview." });
    }
  };

  const start = () => {
    const c = finalConfig();
    if (!c) return;
    const problems = validate(c);
    setErrors(problems);
    if (problems.length) {
      document.getElementById("setup-errors")?.focus();
      return;
    }
    setStarting(true);
    try {
      const id = newId();
      saveSession({
        id,
        userId: user.id,
        config: InterviewConfigSchema.parse(c),
        plan: planState.status === "ready" ? planState.plan : undefined,
        createdAt: Date.now(),
        status: "in-progress",
        transcript: [],
      });
      // Remember the setup (without the resume, which is saved separately) for quick restarts.
      const { resumeText: _omit, ...rest } = c;
      void _omit;
      updateProfile(user.id, { lastConfig: rest });
      router.push(`/interview/${id}`);
    } catch (err) {
      setStarting(false);
      setErrors([err instanceof StorageFullError ? err.message : "Couldn't save the session in this browser."]);
    }
  };

  // ───────────── Step 1: category ─────────────
  if (!category || !config) {
    return (
      <>
        <PageTitle title="Set up an interview" description="Choose what you're preparing for. Everything else has sensible defaults." />
        <div className="grid gap-3 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategory(c.id);
                if (c.id === "custom") chooseTrack(tracksFor("custom")[0]);
                else setConfig(null);
              }}
              aria-pressed={category === c.id}
              className={cn(
                "rounded-[var(--radius-card)] border bg-surface p-5 text-left transition-colors hover:border-ink",
                category === c.id ? "border-indigo shadow-[inset_0_0_0_1px_var(--color-indigo)]" : "border-line",
              )}
            >
              <span className="block font-display text-xl font-bold">{c.title}</span>
              <span className="mt-1 block text-muted">{c.description}</span>
            </button>
          ))}
        </div>

        {category && category !== "custom" && (
          <section className="mt-10" aria-labelledby="track-heading">
            <h2 id="track-heading" className="mb-4 text-2xl font-bold">
              {category === "government" ? "Which recruitment?" : "Which field?"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tracksFor(category).map((t) => (
                <button
                  key={t.id}
                  onClick={() => chooseTrack(t)}
                  className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 text-left transition-colors hover:border-ink"
                >
                  <span className="font-bold">{t.title}</span>
                  <span className="mt-1 text-sm text-muted">{t.description}</span>
                  {t.interviewAvailability && (
                    <span
                      className={cn(
                        "mt-3 self-start rounded-full px-2.5 py-0.5 text-xs font-bold",
                        t.interviewAvailability === "yes" && "bg-sage-soft text-sage",
                        t.interviewAvailability === "some-posts" && "bg-indigo-soft text-indigo",
                        t.interviewAvailability === "rare" && "bg-marigold-soft text-[#7a4f00]",
                      )}
                    >
                      {AVAILABILITY_LABEL[t.interviewAvailability]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  // ───────────── Step 2: details ─────────────
  const isGov = config.category === "government";
  const isCustom = config.category === "custom";
  const format = FORMATS[config.format];
  const resumeAvailable = useSavedResume ? Boolean(profile.resumeText) : Boolean(config.resumeText);
  const canPlan = Boolean(status?.ai) && (resumeAvailable || Boolean(config.jobDescription));

  return (
    <>
      <button
        onClick={() => {
          setConfig(null);
          if (isCustom) setCategory(null);
        }}
        className="mb-4 inline-flex items-center gap-1.5 font-bold text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {isCustom ? "Change category" : "Change field"}
      </button>
      <PageTitle
        title={isCustom ? "Build your own interview" : track?.title ?? "Interview setup"}
        description={
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden /> About {estimatedMinutes(config.questionCount)} minutes, {config.questionCount} main questions
          </span>
        }
      />

      {track?.selectionNote && (
        <Notice tone={track.interviewAvailability === "rare" ? "warning" : "info"} title="About this selection process" className="mb-6">
          {track.selectionNote}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-xl font-bold">The role</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {isCustom || (track && track.roles.length === 1 && !track.roles[0].title) ? (
                <TextField
                  label="Role or post"
                  placeholder="e.g. Pharmacist, Civil Judge, Content Writer"
                  value={config.roleTitle}
                  onChange={(e) => update({ roleTitle: e.target.value })}
                  maxLength={120}
                  required
                />
              ) : (
                <SelectField
                  label="Role"
                  value={config.roleTitle}
                  onChange={(e) => update({ roleTitle: e.target.value })}
                  options={track!.roles.map((r) => ({ value: r.title, label: r.title }))}
                />
              )}
              {isCustom && (
                <TextField label="Field or industry" placeholder="e.g. Pharmaceuticals" value={config.field === "Custom" ? "" : config.field} onChange={(e) => update({ field: e.target.value || "Custom" })} maxLength={80} />
              )}
              <TextField
                label={isGov ? "Organisation or board (optional)" : "Target company (optional)"}
                placeholder={isGov ? "e.g. UPSC, KPSC, SBI" : "e.g. Infosys"}
                value={config.organization}
                onChange={(e) => update({ organization: e.target.value })}
                maxLength={120}
                hint={!isGov ? "Questions about the company will use only widely known public information." : undefined}
              />
              <SelectField
                label="Your level"
                value={config.level}
                onChange={(e) => update({ level: e.target.value as InterviewConfig["level"] })}
                options={LEVELS.map((l) => ({ value: l.id, label: l.title }))}
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl font-bold">The interview</h2>
            <div className="space-y-6">
              <ChoiceGroup
                legend="Format"
                name="format"
                value={config.format}
                onChange={(v) => update({ format: v })}
                options={(track?.formats ?? []).map((f) => ({ value: f, label: FORMATS[f].title, description: FORMATS[f].description }))}
                columns="sm:grid-cols-2 xl:grid-cols-3"
              />
              <ChoiceGroup
                legend="Interviewer style"
                name="style"
                value={config.style}
                onChange={(v) => update({ style: v })}
                options={STYLES.map((s) => ({ value: s.id, label: s.title, description: s.description }))}
                columns="grid-cols-2 lg:grid-cols-4"
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField
                  label="Difficulty"
                  value={config.difficulty}
                  onChange={(e) => update({ difficulty: e.target.value as InterviewConfig["difficulty"] })}
                  options={DIFFICULTIES.map((d) => ({ value: d.id, label: d.title }))}
                />
                <SelectField
                  label="Length"
                  value={String(config.questionCount)}
                  onChange={(e) => update({ questionCount: Number(e.target.value) })}
                  options={QUESTION_COUNTS.map((n) => ({ value: String(n), label: `${n} questions · ~${estimatedMinutes(n)} min` }))}
                />
                <SelectField
                  label="Language"
                  value={config.language}
                  onChange={(e) => update({ language: e.target.value as InterviewConfig["language"] })}
                  options={LANGUAGES.map((l) => ({ value: l.id, label: l.title }))}
                />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-1 text-xl font-bold">Personalise (optional)</h2>
            <p className="mb-5 text-muted">Questions follow your actual resume and the posting. Skip this for a role-based interview.</p>
            <div className="space-y-6">
              {profile.resumeText && (
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--color-indigo)]"
                    checked={useSavedResume}
                    onChange={(e) => {
                      setUseSavedResume(e.target.checked);
                      setPlanState({ status: "idle" });
                    }}
                  />
                  <span>
                    <span className="font-bold">Use my saved resume</span>
                    <span className="block text-sm text-muted">{profile.resumeFileName ?? "Saved text"} · change it in Settings</span>
                  </span>
                </label>
              )}
              {profile.resumeNeedsReupload && !profile.resumeText && (
                <Notice tone="warning">Your earlier resume file couldn&apos;t be used for interviews. Upload it again below or in Settings.</Notice>
              )}
              {!(useSavedResume && profile.resumeText) && (
                <DocumentInput
                  label="Resume"
                  description={format.needs === "resume" ? "Required for this format." : undefined}
                  value={config.resumeText}
                  fileName={resumeFileName}
                  maxChars={16000}
                  onChange={(text, name) => {
                    update({ resumeText: text });
                    setResumeFileName(name);
                  }}
                  placeholder="Paste your resume text"
                />
              )}
              {!(useSavedResume && profile.resumeText) && config.resumeText && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    updateProfile(user.id, { resumeText: config.resumeText, resumeFileName: resumeFileName ?? "Pasted resume", resumeNeedsReupload: false });
                    setUseSavedResume(true);
                  }}
                >
                  Save this resume for next time
                </Button>
              )}
              {!isGov && (
                <DocumentInput
                  label="Job description"
                  description={format.needs === "job-description" ? "Required for this format." : "Paste the posting to get questions mapped to its requirements."}
                  value={config.jobDescription}
                  maxChars={12000}
                  onChange={(text) => update({ jobDescription: text })}
                  placeholder="Paste the job posting"
                />
              )}
              {isGov && (
                <TextArea
                  label="Your background"
                  hint={track?.backgroundPrompt ? `For example: ${track.backgroundPrompt}.` : undefined}
                  value={config.backgroundNotes}
                  maxLength={1500}
                  onChange={(e) => update({ backgroundNotes: e.target.value })}
                />
              )}
              <TextField
                label="Topics to focus on"
                hint="Separate with commas."
                placeholder={isGov ? "e.g. agriculture policy, ethics case studies" : "e.g. system design, stakeholder conflict"}
                value={topicsText}
                onChange={(e) => {
                  setTopicsText(e.target.value);
                  setPlanState({ status: "idle" });
                }}
              />
              <TextArea
                label="Your own questions"
                hint="One per line, up to 10. The interviewer will ask them as written."
                value={questionsText}
                onChange={(e) => {
                  setQuestionsText(e.target.value);
                  setPlanState({ status: "idle" });
                }}
              />
            </div>
          </Card>
        </div>

        {/* Summary + start */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4">
            <h2 className="text-xl font-bold">Ready when you are</h2>
            <dl className="space-y-1.5 text-[0.95rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Role</dt>
                <dd className="text-right font-bold">{config.roleTitle || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Format</dt>
                <dd className="text-right">{format.title}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Length</dt>
                <dd className="text-right">~{estimatedMinutes(config.questionCount)} min</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Personalised with</dt>
                <dd className="text-right">
                  {[resumeAvailable && "resume", config.jobDescription && "job post", config.backgroundNotes && "background"].filter(Boolean).join(", ") || "role only"}
                </dd>
              </div>
            </dl>

            {status && !status.voice && (
              <Notice tone="error" title="Voice isn't configured">
                This site has no voice key set, so interviews can&apos;t start. The site owner needs to add NEXT_PUBLIC_VAPI_PUBLIC_KEY.
              </Notice>
            )}

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--color-indigo)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                I understand my voice is sent to the voice provider (Vapi) to run this interview, and the transcript is saved in this browser.
              </span>
            </label>

            {errors.length > 0 && (
              <div id="setup-errors" tabIndex={-1}>
                <Notice tone="error" role="alert" title="Before you start">
                  <ul className="list-disc space-y-1 pl-4">
                    {errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </Notice>
              </div>
            )}

            {canPlan && planState.status !== "ready" && (
              <Button type="button" variant="secondary" className="w-full" loading={planState.status === "loading"} onClick={buildPlan}>
                {planState.status === "loading" ? "Reading your documents…" : "Preview personalised questions"}
              </Button>
            )}
            {planState.status === "error" && <Notice tone="warning">{planState.message}</Notice>}

            <Button type="button" size="lg" className="w-full" onClick={start} loading={starting} disabled={status ? !status.voice : false}>
              Go to interview room
            </Button>
            <p className="flex gap-2 text-sm text-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> You&apos;ll check your microphone before the interviewer starts speaking.
            </p>
          </Card>
        </aside>
      </div>

      {planState.status === "ready" && planState.plan && (
        <Card className="mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Your question plan</h2>
              <p className="text-muted">{planState.plan.summary}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={buildPlan}>
              Regenerate
            </Button>
          </div>
          <ol className="space-y-3">
            {planState.plan.questions.map((q, i) => (
              <li key={i} className="grid grid-cols-[2rem_1fr] gap-2 border-t border-line pt-3">
                <span className="font-display text-lg font-bold text-muted">{i + 1}</span>
                <div>
                  <p className="font-bold">{q.question}</p>
                  <p className="text-sm text-muted">
                    <span className="font-bold">
                      {q.source === "resume" ? "From your resume" : q.source === "job-description" ? "From the job post" : q.source === "custom" ? "Your question" : "Role question"}
                      :
                    </span>{" "}
                    {q.why}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">The interviewer uses this as a guide and adds follow-ups based on your answers, so the order and wording will vary.</p>
        </Card>
      )}
    </>
  );
}
