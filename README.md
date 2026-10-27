# IntervU

Spoken mock interviews for government and private-sector roles. You talk with an AI interviewer that asks one question at a time, waits while you think and follows up on what you actually said. Afterwards you get rubric-based feedback on each answer.

- **Government and public sector:** UPSC Civil Services, State PSCs, SSB, banking officers and regulators, PSUs, teaching and research, international civil service, and custom posts. Each option states whether that recruitment normally includes an interview.
- **Private sector:** software, data and AI, design, product, business functions, people and support, healthcare/law/education, leadership, and campus placements.
- **Formats:** HR, behavioural (STAR), technical, situational, resume deep-dive, job-description match, company-focused, personality test, panel simulation, pressure round, custom.
- **Languages:** English (India, US, UK), Hindi, Hindi–English mix.

## How it works

| Part | Where |
| --- | --- |
| Interview catalog (tracks, roles, formats, styles) | `lib/interview/catalog.ts` — add a role or field by adding data here |
| Interviewer instructions and Vapi assistant config | `lib/interview/prompt.ts` |
| Live call state machine (pure, unit-tested) | `lib/interview/session.ts` |
| Vapi SDK wiring, mic checks, pause/mute/skip/end | `lib/hooks/useVapiInterview.ts` |
| Rubrics and the 1–5 scale | `lib/interview/rubrics.ts` |
| Overall score calculation | `lib/interview/scoring.ts` |
| Device accounts (PBKDF2-hashed passwords) | `lib/auth.ts` |
| Browser storage for profiles, sessions and reports | `lib/storage.ts` |
| Server routes | `app/api/parse-document`, `app/api/plan`, `app/api/evaluate`, `app/api/status` |

**Voice.** The browser runs the call with the Vapi Web SDK (`@vapi-ai/web` 2.7) using a transient assistant built per interview. Turn-taking uses Vapi's smart endpointing for English and transcription endpointing for Hindi, requires two spoken words before the interviewer stops talking, and nudges once after 25 seconds of silence. Pause mutes your mic and the interviewer; skip, repeat and wrap-up send control messages. The call's hard limit is set from the interview length (Vapi's default is 10 minutes).

**Feedback.** After the call, the transcript is sent to `/api/evaluate`, which asks an OpenAI-compatible model to rate each answer 1–5 against the rubric for that interview type, with evidence from your words. IntervU computes the overall score itself as the average rating mapped to 0–100, and shows no overall score when fewer than three answers were rated. Feedback covers the words only: tone, pace, confidence and body language are not measured.

**Data.** With Supabase configured, accounts use Supabase Auth (email confirmation, email password reset) and interviews are stored in two tables protected by Row Level Security, so each user can only read their own rows (`supabase/schema.sql`). The app is local-first: pages read from a browser cache, and `lib/cloud.ts` mirrors every change to the database with debounced, retried writes, then fills the cache on sign-in. Without Supabase, everything stays in each browser's `localStorage`. See `/privacy` in the app.

## Setup

Requirements: Node.js 20.9 or later (tested on 22), npm.

```bash
git clone https://github.com/PrachiYadav-16/AI-voice-interviewer.git
cd AI-voice-interviewer
npm ci
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Needed for | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Accounts and database | Supabase → Project Settings → API Keys (or the project home page) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Accounts and database | Same page → **Publishable key** (`sb_publishable_...`). Never use the secret / `service_role` key. |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Live interviews | [Vapi dashboard](https://dashboard.vapi.ai) → API Keys → **Public** key. Restrict it to your domains. Never use the private key here. |
| `LLM_API_KEY` | Feedback reports, personalised question plans | An OpenAI API key, or a key for any OpenAI-compatible provider |
| `LLM_BASE_URL` | Optional | Defaults to `https://api.openai.com/v1` |
| `LLM_MODEL` | Optional | Defaults to `gpt-4.1-mini`; must support JSON response format |
| `NEXT_PUBLIC_VAPI_LLM_MODEL` | Optional | Interviewer model, default `gpt-4.1` |
| `NEXT_PUBLIC_VAPI_VOICE_ID` | Optional | ElevenLabs voice ID, default `21m00Tcm4TlvDq8ikWAM` |

Without `NEXT_PUBLIC_VAPI_PUBLIC_KEY` the app runs but interviews can't start (the UI says so). Without `LLM_API_KEY` interviews run and transcripts are saved, but reports and plans show a "not configured" message. Vapi usage is billed to the Vapi account, including the speech, model and voice providers it calls.

Microphone access needs HTTPS in production (`localhost` is allowed in development).

### Supabase setup (accounts and database)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and click **Run**. This creates the `profiles` and `sessions` tables, Row Level Security policies, and the `delete_my_account` function.
3. **Authentication → URL Configuration**: set **Site URL** to your site (e.g. `http://localhost:3000` while developing) and add `http://localhost:3000/**` plus your deployed domain with `/**` to **Redirect URLs**. Confirmation and password-reset emails link back here.
4. Copy the project URL and publishable key into `.env.local` and restart `npm run dev`.

Supabase's built-in email sender is rate-limited and meant for testing. For real users, add your own SMTP provider under **Authentication → Emails → SMTP Settings**.

With Supabase set, the AI routes (`/api/evaluate`, `/api/plan`, `/api/parse-document`) also require a signed-in user, which stops other people from spending your AI credits.

### Scripts

```bash
npm run dev         # development server
npm run build       # production build
npm start           # serve the production build
npm test            # unit and API tests (Vitest)
npm run typecheck   # TypeScript
npm run lint        # ESLint, zero warnings allowed
npm run check       # all three
```

Browser smoke test (optional): `npm i -D playwright && npx playwright install chromium`, start the app, then `node tests/e2e/smoke.mjs`. It uses a fake microphone and does not test a real conversation.

## Deploying

Vercel works out of the box:

1. Import the repository in Vercel.
2. Add the environment variables above (Production and Preview).
3. Deploy. The API routes run on the Node.js runtime; `/api/evaluate` may take up to 90 seconds, so use a plan whose function timeout allows that.
4. In the Vapi dashboard, restrict the public key to your deployed domain.

Any host that runs `next start` on Node 20.9+ also works.

## Known limitations

- **Without Supabase, accounts are per browser.** They keep profiles separate on a shared device but are not server-side authentication, and data doesn't sync across devices.
- **Device accounts aren't migrated.** Interviews saved under a browser-only account don't move to a Supabase account automatically.
- **Sync conflicts:** if the same interview is edited on two devices at once, the most recent save wins.
- **Rate limiting is in-memory**, so on serverless hosts it applies per instance. Put a shared store or the host's firewall in front for strict limits.
- **Current affairs.** No live news source is connected. The interviewer is told not to assert recent facts, and reports note that recent claims can't be verified.
- **Progress counter is approximate.** "Question n of about N" counts interviewer turns that ask a question; follow-ups can make it run ahead.
- **Speech-to-text errors** can affect feedback; the evaluator is told to ignore obvious transcription mistakes.
- **Older `.doc` files and scanned PDFs** can't be read; paste the text instead.
- **`npm audit`** reports a moderate advisory in `sprintf-js`, reached only through mammoth's command-line argument parser, which IntervU never calls. The suggested fix downgrades mammoth to a 2015 release, so it hasn't been applied.

## Security notes

- Secret keys (`LLM_API_KEY`) are only read on the server. `/api/status` exposes booleans, never values.
- AI routes reject cross-site requests, validate input with Zod, cap request sizes and are rate-limited.
- Uploaded files are identified by their bytes, limited to 5 MB, parsed in memory and not stored.
- Resume and job-description text is fenced as untrusted input in prompts.
- Security headers restrict microphone use to this site and block framing.
- An earlier version of this repository committed a Vapi key as a fallback in `app/page.tsx`. It has been removed from the code but remains in git history, so **rotate that key in the Vapi dashboard**.
