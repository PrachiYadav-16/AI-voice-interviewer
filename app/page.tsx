import Link from "next/link";
import { ArrowRight, Check, FileText, Mic, MessagesSquare, ShieldCheck, Target, X } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/Headers";
import { buttonClass } from "@/components/buttonClass";
import { CategoryIcon, TrackIcon } from "@/components/TrackIcon";
import { CATEGORIES, tracksFor } from "@/lib/interview/catalog";

const FAQ = [
  {
    q: "Are these the real questions from UPSC or a particular company?",
    a: "No. Questions are generated for practice based on the role, format and anything you share. IntervU has no access to official or confidential interview questions, and nothing here is guaranteed to come up.",
  },
  {
    q: "Which government recruitments actually have an interview?",
    a: "It varies. UPSC Civil Services and SSB include one; many banking officer and PSU recruitments do; most SSC and major RRB exams don't. Each government option in setup says which applies, and your official notification is the final word.",
  },
  {
    q: "Can I practise in Hindi?",
    a: "Yes. Interviews can run in English (Indian, US or UK), Hindi, or a natural Hindi–English mix.",
  },
  {
    q: "How is my answer scored?",
    a: "Each answer is rated from 1 to 5 against a rubric for that interview type, for example context, actions and outcome for behavioural questions. The overall number is the average of those ratings. There's no overall number if you answered fewer than three questions.",
  },
  {
    q: "Does it judge my confidence or body language?",
    a: "No. Feedback is based on the words in your transcript. IntervU doesn't measure tone, pace, emotion or body language, and it doesn't predict whether you'll be selected.",
  },
  {
    q: "Do I need headphones?",
    a: "They help. Without them, your speakers can feed the interviewer's voice back into your microphone. A quiet room helps it hear you clearly.",
  },
];

const STEPS = [
  {
    icon: Target,
    t: "Set up in a minute",
    d: "Pick a government or private-sector track, a role and a format. Add your resume or the job posting for questions about your own experience.",
  },
  {
    icon: Mic,
    t: "Answer out loud",
    d: "The interviewer asks one question at a time, waits while you think, and follows up on what you actually said. Pause, repeat or skip whenever you need.",
  },
  {
    icon: FileText,
    t: "Review every answer",
    d: "Ratings against a published rubric, the evidence from your own words, and a stronger version of each answer built from what you said.",
  },
];

function LiveRoomPreview() {
  return (
    <figure className="relative">
      <div className="overflow-hidden rounded-[22px] border border-line bg-surface shadow-[var(--shadow-raised)]">
        <div className="flex items-center justify-between border-b border-line bg-paper/70 px-5 py-3 text-sm">
          <span className="flex items-center gap-2 font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marigold opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-marigold" />
            </span>
            Behavioural round
          </span>
          <span className="tabular-nums text-muted">Question 3 of 8</span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-indigo text-white">
              <div className="flex h-5 items-center gap-[3px]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-1 rounded-full bg-current" style={{ height: "100%", animation: `speaking 0.9s ease-in-out ${i * 0.12}s infinite` }} />
                ))}
              </div>
            </div>
            <p className="font-display text-lg font-extrabold leading-snug">Tell me about a time a project you were part of fell behind schedule.</p>
          </div>

          <div className="rounded-2xl bg-paper px-4 py-3 text-[0.95rem] text-ink/80">
            <span className="mb-1 block text-xs font-semibold text-muted">You</span>
            In our final-year project we were two weeks late on the prototype, so I reorganised how the team split the work and we caught up.
          </div>

          <div className="rounded-2xl border border-indigo/20 bg-indigo-soft/60 px-4 py-3">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-indigo">
              <MessagesSquare className="h-3.5 w-3.5" aria-hidden /> Follow-up
            </span>
            <p className="font-display font-extrabold leading-snug">
              You said you reorganised the work. What exactly did you change, and how did you know it was working?
            </p>
            <p className="mt-1.5 text-sm text-muted">Asked because the first answer named an action but not the details or the result.</p>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">Example of a follow-up question based on the candidate&apos;s answer</figcaption>
    </figure>
  );
}

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* Hero */}
        <section className="hero-wash border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-28 lg:pt-20">
            <div className="space-y-7">
              <p className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1 text-sm font-semibold text-muted">
                <Mic className="h-4 w-4 text-indigo" aria-hidden /> Voice mock interviews · English and Hindi
              </p>
              <h1 className="text-[2.75rem] font-extrabold leading-[1.04] sm:text-[3.75rem]">Practice Any Interview. Speak With Confidence.</h1>
              <p className="max-w-xl text-lg text-muted sm:text-xl">
                From UPSC and SSB boards to campus placements and private-sector roles. The interviewer listens to your answer and asks the follow-up a real
                panel would.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup?next=/practice" className={buttonClass("primary", "lg")}>
                  Start practising <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a href="#types" className={buttonClass("secondary", "lg")}>
                  Explore interview types
                </a>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                {["Government and private-sector tracks", "No audio recordings kept", "Runs in your browser"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-sage" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <LiveRoomPreview />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="mb-3 text-3xl sm:text-4xl">How it works</h2>
            <p className="mb-12 max-w-2xl text-lg text-muted">Three steps, about twenty minutes, and a report you can act on.</p>
            <ol className="grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.t} className="relative rounded-[var(--radius-card)] border border-line bg-paper/60 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo text-white shadow-[0_6px_16px_-6px_rgb(61_75_214/0.6)]">
                      <s.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="font-display text-sm font-extrabold text-muted">Step {i + 1}</span>
                  </div>
                  <h3 className="mb-2 text-xl">{s.t}</h3>
                  <p className="text-muted">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Interview types */}
        <section id="types" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="mb-3 text-3xl sm:text-4xl">Interview types</h2>
          <p className="mb-12 max-w-2xl text-lg text-muted">
            HR, behavioural, technical, situational, resume deep-dives, job-description matching, panel simulations and pressure rounds, from intern to
            leadership level.
          </p>
          <div className="grid gap-5 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-indigo-soft text-indigo">
                  <CategoryIcon id={c.id} className="h-5 w-5" />
                </span>
                <h3 className="mb-1 text-xl">{c.title}</h3>
                <p className="mb-5 text-sm text-muted">{c.description}</p>
                {c.id === "custom" ? (
                  <p className="text-[0.95rem] text-ink/80">
                    Type in any role (pharmacist, civil judge, content writer), choose a format, and add your own topics and questions. The interviewer asks
                    them as written and fills the rest.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {tracksFor(c.id).map((t) => (
                      <li key={t.id} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 py-1 text-sm">
                        <TrackIcon id={t.id} className="h-3.5 w-3.5 text-muted" />
                        {t.title}
                      </li>
                    ))}
                  </ul>
                )}
                {c.id === "government" && (
                  <p className="mt-5 rounded-xl bg-marigold-soft px-3 py-2 text-sm">
                    Not every exam has an interview. Each option says whether that recruitment usually includes one.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Feedback example */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div className="space-y-5">
              <h2 className="text-3xl sm:text-4xl">Feedback you can act on</h2>
              <p className="text-lg text-muted">
                Every rating points to what you said. Where an answer was missing something, the improved version leaves a gap in brackets for your real
                detail instead of inventing one.
              </p>
              <ul className="space-y-4">
                {[
                  ["Different rubrics for different interviews", "Technical answers are judged on correctness and trade-offs; personality tests on balanced reasoning and ethical judgement."],
                  ["Transparent scoring", "The overall number is an average of the ratings you can see."],
                  ["Progress over time", "Your dashboard tracks scores and your weakest criteria across sessions."],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-soft text-sage">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span>
                      <span className="font-semibold">{t}.</span> <span className="text-muted">{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[22px] border border-line bg-paper p-5 shadow-[var(--shadow-raised)] sm:p-7" aria-label="Example report excerpt">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-semibold text-muted">Example report excerpt</p>
                <span className="rounded-md bg-surface px-3 py-1 font-display text-sm font-extrabold tabular-nums shadow-[var(--shadow-card)]">58 / 100</span>
              </div>
              <p className="mb-4 font-display text-lg font-extrabold">Tell me about a time a project fell behind schedule.</p>
              <ul className="mb-5 space-y-2.5 text-[0.95rem]">
                {[
                  ["Context", "4/5 · Strong", "bg-sage-soft text-sage", "Final-year project, two weeks late on prototype."],
                  ["Actions", "2/5 · Weak", "bg-brick-soft text-brick", "“Reorganised how the team split the work”, but no specifics."],
                  ["Outcome", "2/5 · Weak", "bg-brick-soft text-brick", "“We caught up”, but no measure of the result."],
                ].map(([n, s, cls, e]) => (
                  <li key={n} className="grid gap-1 rounded-xl bg-surface px-3 py-2.5 sm:grid-cols-[5.5rem_auto_1fr] sm:items-baseline sm:gap-3">
                    <span className="font-semibold">{n}</span>
                    <span className={`w-fit rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>{s}</span>
                    <span className="text-sm text-muted">{e}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border-l-4 border-indigo bg-surface px-4 py-3">
                <p className="mb-1 text-sm font-semibold text-indigo">A stronger version of your answer</p>
                <p className="leading-relaxed">
                  Our final-year prototype was two weeks behind. I split the work by [component, e.g. hardware and app] instead of by person, and set [a short
                  daily check-in]. We delivered [how many days] late instead of two weeks, and I learned to [your lesson].
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Honest limits */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="mb-10 text-3xl sm:text-4xl">What IntervU measures, and what it doesn&apos;t</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="mb-3 flex items-center gap-2 text-lg text-sage">
                <Check className="h-5 w-5" aria-hidden /> From your words
              </h3>
              <p className="text-muted">
                Whether you answered the question, how well it was structured, how specific your examples were, and the knowledge you showed for the role.
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="mb-3 flex items-center gap-2 text-lg text-brick">
                <X className="h-5 w-5" aria-hidden /> Not measured
              </h3>
              <p className="text-muted">
                Your tone, pace, accent, confidence or body language, or your chances of selection. A score here is feedback on one practice session.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-line bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <h2 className="mb-8 text-3xl sm:text-4xl">Questions</h2>
            <div className="space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-line bg-paper/50 px-5 py-4 open:bg-surface open:shadow-[var(--shadow-card)]">
                  <summary className="cursor-pointer list-none font-semibold">
                    <span className="flex items-start justify-between gap-4">
                      {f.q}
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-lg leading-none text-muted transition-transform group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy + final CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 overflow-hidden rounded-[24px] bg-ink p-8 text-white sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-3">
              <h2 className="flex items-center gap-3 text-2xl sm:text-3xl">
                <ShieldCheck className="h-7 w-7 shrink-0 text-marigold" aria-hidden /> Your interviews stay with you
              </h2>
              <p className="max-w-2xl text-white/75">
                Transcripts, reports and your resume text are stored in your browser, not on our servers. Audio is processed live to run the interview and
                isn&apos;t kept by IntervU. You can download or delete everything at any time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup?next=/practice" className={buttonClass("primary", "lg")}>
                Start practising
              </Link>
              <Link href="/privacy" className={buttonClass("ghost", "lg", "text-white hover:bg-white/10")}>
                Privacy details
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
