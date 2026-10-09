import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/Headers";
import { buttonClass } from "@/components/buttonClass";
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
    a: "Each answer is rated from 1 to 5 against a rubric for that interview type — for example context, actions and outcome for behavioural questions. The overall number is the average of those ratings. There's no overall number if you answered fewer than three questions.",
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

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-20">
          <div className="space-y-6">
            <h1 className="text-[2.6rem] font-bold leading-[1.05] sm:text-6xl">Practice Any Interview. Speak With Confidence.</h1>
            <p className="max-w-xl text-lg text-muted sm:text-xl">
              Spoken mock interviews for UPSC and state PSC boards, SSB, banking, campus placements and private-sector roles. The interviewer listens
              to your answer and asks the follow-up a real panel would.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup?next=/practice" className={buttonClass("primary", "lg")}>
                Start practising
              </Link>
              <a href="#types" className={buttonClass("secondary", "lg")}>
                Explore interview types
              </a>
            </div>
          </div>

          {/* Signature: a follow-up that depends on what was said */}
          <figure className="rounded-[18px] border border-line bg-surface p-5 shadow-[0_1px_0_var(--color-line),0_18px_40px_-24px_rgba(23,32,51,0.35)] sm:p-7">
            <figcaption className="mb-5 flex items-center justify-between text-sm text-muted">
              <span>Example conversation</span>
              <span className="flex items-center gap-1.5 font-bold text-[#7a4f00]">
                <span className="h-2 w-2 rounded-full bg-marigold" aria-hidden /> Listening
              </span>
            </figcaption>
            <ol className="space-y-5">
              <li className="grid grid-cols-[5.5rem_1fr] gap-3">
                <span className="pt-0.5 text-sm font-bold text-indigo">Interviewer</span>
                <p>Tell me about a time a project you were part of fell behind schedule.</p>
              </li>
              <li className="grid grid-cols-[5.5rem_1fr] gap-3">
                <span className="pt-0.5 text-sm font-bold">You</span>
                <p className="text-ink/80">
                  In our final-year project we were two weeks late on the prototype, so I reorganised how the team split the work and we caught up.
                </p>
              </li>
              <li className="grid grid-cols-[5.5rem_1fr] gap-3 rounded-[10px] bg-indigo-soft/60 py-3 pr-3">
                <span className="pl-3 pt-0.5 text-sm font-bold text-indigo">Follow-up</span>
                <div>
                  <p className="font-display text-lg font-semibold leading-snug">
                    You said you reorganised the work. What exactly did you change, and how did you know it was working?
                  </p>
                  <p className="mt-2 text-sm text-muted">Asked because the first answer named an action but not the details or the result.</p>
                </div>
              </li>
            </ol>
          </figure>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="mb-10 text-3xl font-bold sm:text-4xl">How it works</h2>
            <ol className="grid gap-10 md:grid-cols-3">
              {[
                {
                  t: "Set up in a minute",
                  d: "Pick a government or private-sector track, a role and a format. Add your resume or the job posting if you want questions about your own experience.",
                },
                {
                  t: "Answer out loud",
                  d: "Talk with an AI interviewer that asks one question at a time, waits while you think, and follows up on what you actually said. Pause, repeat or skip whenever you need.",
                },
                {
                  t: "Review every answer",
                  d: "Get ratings against a published rubric, the evidence from your own words, and a stronger version of each answer built from what you said.",
                },
              ].map((s, i) => (
                <li key={s.t} className="space-y-2">
                  <span className="font-display text-4xl font-bold text-indigo">{i + 1}</span>
                  <h3 className="text-xl font-bold">{s.t}</h3>
                  <p className="text-muted">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Interview types */}
        <section id="types" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Interview types</h2>
          <p className="mb-10 max-w-2xl text-lg text-muted">
            HR, behavioural, technical, situational, resume deep-dives, job-description matching, panel simulations and pressure rounds — at intern,
            fresher, mid, senior and leadership level.
          </p>
          <div className="grid gap-10 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c.id}>
                <h3 className="mb-3 border-b-2 border-ink pb-2 text-xl font-bold">{c.title}</h3>
                {c.id === "custom" ? (
                  <p className="text-muted">
                    Type in any role — pharmacist, civil judge, content writer — choose a format, and add your own topics and questions. The interviewer
                    asks them as written and fills the rest.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {tracksFor(c.id).map((t) => (
                      <li key={t.id}>
                        <span className="font-bold">{t.title}</span>
                        <span className="block text-sm text-muted">{t.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {c.id === "government" && (
                  <p className="mt-4 rounded-[10px] bg-marigold-soft px-3 py-2 text-sm">
                    Not every exam has an interview. Each option says whether that recruitment usually includes one.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Feedback example */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold sm:text-4xl">Feedback you can act on</h2>
              <p className="text-lg text-muted">
                Every rating points to what you said. Where an answer was missing something, the improved version leaves a gap in brackets for your
                real detail instead of inventing one.
              </p>
              <ul className="space-y-2 text-[0.95rem]">
                <li>
                  <strong>Different rubrics for different interviews.</strong> Technical answers are judged on correctness and trade-offs; personality
                  tests on balanced reasoning and ethical judgement.
                </li>
                <li>
                  <strong>Transparent scoring.</strong> The overall number is an average of the ratings you can see.
                </li>
                <li>
                  <strong>Progress over time.</strong> Your dashboard tracks scores and your weakest criteria across sessions.
                </li>
              </ul>
            </div>
            <div className="rounded-[18px] border border-line bg-paper p-5 sm:p-6" aria-label="Example report excerpt">
              <p className="mb-3 text-sm text-muted">Example report excerpt</p>
              <p className="mb-4 font-bold">Tell me about a time a project fell behind schedule.</p>
              <ul className="mb-4 space-y-2 text-[0.95rem]">
                {[
                  ["Context", "4/5 · Strong", "bg-sage-soft text-sage", "Final-year project, two weeks late on prototype."],
                  ["Actions", "2/5 · Weak", "bg-brick-soft text-brick", "“Reorganised how the team split the work” — no specifics."],
                  ["Outcome", "2/5 · Weak", "bg-brick-soft text-brick", "“We caught up” — no measure of the result."],
                ].map(([n, s, cls, e]) => (
                  <li key={n} className="grid gap-1 sm:grid-cols-[6rem_auto_1fr] sm:items-baseline sm:gap-3">
                    <span className="font-bold">{n}</span>
                    <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{s}</span>
                    <span className="text-sm text-muted">{e}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-[10px] border-l-4 border-indigo bg-indigo-soft/50 px-4 py-3">
                <p className="mb-1 text-sm font-bold text-indigo">A stronger version of your answer</p>
                <p className="leading-relaxed">
                  Our final-year prototype was two weeks behind. I split the work by [component, e.g. hardware and app] instead of by person, and set
                  [a short daily check-in]. We delivered [how many days] late instead of two weeks, and I learned to [your lesson].
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Honest limits */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-3xl font-bold sm:text-4xl">What IntervU measures, and what it doesn&apos;t</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-bold text-sage">From your words</h3>
              <p className="text-muted">
                Whether you answered the question, how well it was structured, how specific your examples were, and the knowledge you showed for the
                role.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-brick">Not measured</h3>
              <p className="text-muted">
                Your tone, pace, accent, confidence or body language — and your chances of selection. A score here is feedback on one practice session.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <h2 className="mb-8 text-3xl font-bold sm:text-4xl">Questions</h2>
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="cursor-pointer list-none font-bold">
                    <span className="flex items-start justify-between gap-4">
                      {f.q}
                      <span className="text-xl leading-none text-muted transition-transform group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy summary */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 rounded-[18px] border border-line bg-surface p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Your interviews stay with you</h2>
              <p className="max-w-2xl text-muted">
                Transcripts, reports and your resume text are stored in your browser, not on our servers. Audio is processed live to run the interview
                and isn&apos;t kept by IntervU. You can download or delete everything at any time.
              </p>
            </div>
            <Link href="/privacy" className={buttonClass("secondary")}>
              Read the privacy details
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
