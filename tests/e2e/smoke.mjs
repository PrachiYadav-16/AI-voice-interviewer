/**
 * Browser smoke test for IntervU's main journeys.
 *   npm i -D playwright && npx playwright install chromium
 *   npm run build && npm start   (in another terminal; set NEXT_PUBLIC_VAPI_PUBLIC_KEY and EXPECT_KEY=1 to test the start path)
 *   node tests/e2e/smoke.mjs
 * Uses a fake microphone. It does not test a real voice conversation.
 */
import { chromium as pw } from "playwright";
import assert from "node:assert/strict";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = new URL("../e2e-output/", import.meta.url).pathname;
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await pw.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, permissions: ["microphone"] });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(`${page.url()} :: ${m.text()}`));
page.on("pageerror", (e) => consoleErrors.push(`${page.url()} :: PAGEERROR ${e.message}`));
const results = [];
const step = async (name, fn) => {
  try {
    await fn();
    results.push(`PASS ${name}`);
  } catch (e) {
    results.push(`FAIL ${name}: ${e.message.split("\n")[0]}`);
    await page.screenshot({ path: `${OUT}fail-${name.replace(/\W+/g, "-")}.png` }).catch(() => {});
  }
};

await step("landing renders hero and CTA", async () => {
  await page.goto(BASE + "/");
  await page.getByRole("heading", { name: "Practice Any Interview. Speak With Confidence." }).waitFor();
  await page.getByRole("link", { name: "Start practising" }).first().waitFor();
  await page.screenshot({ path: OUT + "01-landing.png", fullPage: true });
});

await step("protected route redirects to login when signed out", async () => {
  await page.goto(BASE + "/dashboard");
  await page.waitForURL(/\/login\?next=%2Fdashboard/);
});

await step("signup validates input", async () => {
  await page.goto(BASE + "/signup");
  await page.getByLabel("Name").fill("Shubham");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("12345678");
  await page.getByLabel("Confirm password").fill("12345678");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("alert").filter({ hasText: "valid email" }).waitFor();
  await page.getByLabel("Email").fill("shubham@example.com");
  await page.getByLabel("Confirm password").fill("different");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("alert").filter({ hasText: "don't match" }).waitFor();
});

await step("signup succeeds and lands on setup; password not stored", async () => {
  await page.getByLabel("Confirm password").fill("12345678");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/practice/);
  const raw = await page.evaluate(() => localStorage.getItem("intervu.users"));
  assert.ok(raw && !raw.includes("12345678"), "plaintext password found in storage");
});

await step("government track shows honest selection note", async () => {
  await page.getByRole("button", { name: /Government and public sector/ }).click();
  await page.getByRole("button", { name: /SSC and other central recruitment/ }).waitFor();
  await page.screenshot({ path: OUT + "02-gov-tracks.png", fullPage: true });
  await page.getByRole("button", { name: /SSC and other central recruitment/ }).click();
  await page.getByText("Most SSC examinations, including CGL, CHSL and MTS").waitFor();
  await page.getByRole("button", { name: "Change field" }).click();
  await page.getByRole("button", { name: /UPSC Civil Services/ }).click();
  await page.getByText(/Personality Test is the final stage/).waitFor();
  await page.getByLabel("Your background").waitFor();
  assert.equal(await page.getByText("Job description", { exact: true }).count(), 0, "JD shown for government track");
  await page.screenshot({ path: OUT + "03-gov-setup.png", fullPage: true });
});

await step("private setup requires consent and format inputs", async () => {
  await page.getByRole("button", { name: "Change field" }).click();
  await page.getByRole("button", { name: /Private sector/ }).click();
  await page.getByRole("button", { name: /Software engineering and IT/ }).click();
  await page.getByText("Resume deep-dive").click();
  await page.getByRole("button", { name: "Go to interview room" }).click();
  const errs = page.getByRole("alert").filter({ hasText: "Before you start" });
  await errs.waitFor();
  const text = await errs.innerText();
  assert.match(text, /needs your resume/);
  assert.match(text, /Confirm that you're happy/);
});

await step("resume paste + consent starts a session", async () => {
  await page.getByRole("tab", { name: "Paste text" }).first().click();
  await page.getByLabel("Resume text").fill("Priya Sharma. Frontend developer. Built a React dashboard used by 200 clinic staff. Reduced load time by 40% with code-splitting.");
  await page.getByRole("checkbox", { name: /voice is sent to the voice provider/ }).check();
  await page.screenshot({ path: OUT + "04-private-setup.png", fullPage: true });
  await page.getByRole("button", { name: "Go to interview room" }).click();
  await page.waitForURL(/\/interview\/[\w-]+/);
  await page.getByRole("heading", { name: "Frontend Developer" }).waitFor();
});

await step("interview room explains missing voice configuration", async () => {
  const hasKey = process.env.EXPECT_KEY === "1";
  if (!hasKey) {
    await page.getByText("Voice isn't configured").first().waitFor();
    assert.ok(await page.getByRole("button", { name: "Start interview" }).isDisabled());
  }
  await page.screenshot({ path: OUT + "05-room.png", fullPage: true });
});

if (process.env.EXPECT_KEY === "1") {
  await step("start with fake mic reaches the voice service and fails gracefully", async () => {
    await page.getByRole("button", { name: "Start interview" }).click();
    await page.getByRole("alert").filter({ hasText: /couldn't start|rejected|connection|Connecting took too long|could not be started|went wrong/i }).waitFor({ timeout: 40000 });
    await page.screenshot({ path: OUT + "06-start-failure.png", fullPage: true });
    await page.getByRole("button", { name: "Try again" }).waitFor();
  });
}

const sessionId = page.url().split("/").pop();

await step("seeded report renders with rubric and computed score", async () => {
  // UI rendering check only: inject a finished session with a report into this test browser's storage.
  await page.evaluate((id) => {
    const userId = JSON.parse(localStorage.getItem("intervu.current")).userId;
    const key = `intervu.u.${userId}.sessions`;
    const all = JSON.parse(localStorage.getItem(key));
    const s = all.find((x) => x.id === id);
    const crit = (n, sc, ev) => ({ criterion: n, score: sc, evidence: ev });
    s.status = "completed";
    s.startedAt = Date.now() - 14 * 60000;
    s.endedAt = Date.now();
    s.transcript = [
      { id: "1", speaker: "interviewer", text: "How did you cut the dashboard's load time?", at: 1 },
      { id: "2", speaker: "candidate", text: "I split the bundle by route and lazy-loaded the charts, which cut load time by about 40 percent.", at: 2 },
    ];
    s.report = {
      rubricId: "technical", generatedAt: Date.now(), overallScore: 63, answeredCount: 3,
      scoreNote: "Average of 9 criterion ratings across 3 answers, on a 1–5 scale mapped to 0–100. It reflects this practice session only and does not predict selection.",
      criterionAverages: [
        { criterion: "Correctness", average: 4, rated: 3 }, { criterion: "Reasoning", average: 3.3, rated: 3 },
        { criterion: "Approach", average: 3.5, rated: 2 }, { criterion: "Trade-offs", average: 2, rated: 1 }, { criterion: "Explanation", average: null, rated: 0 },
      ],
      questions: [{
        question: "How did you cut the dashboard's load time?", answerSummary: "Route-based code splitting and lazy-loading charts; ~40% faster.", answered: true,
        criteria: [crit("Correctness", 4, "Route-based splitting is a valid technique."), crit("Trade-offs", 2, "Didn't mention the cost of extra requests.")],
        whatWorked: "Concrete technique and a measured result.", improve: "Mention how you measured the 40% and what you traded off.",
        suggestedStructure: "Problem → measurement → change → result → trade-off", improvedAnswer: "Initial load was [X seconds] on [device]. I split the bundle by route and lazy-loaded the charts, which cut load time by about 40%, measured with [tool]. The trade-off was [extra request on first chart view].",
      }],
      strengths: ["Gave a measurable result for the performance work."], improvements: ["State how results were measured."],
      communication: { clarity: "Easy to follow.", conciseness: "Answers were appropriately brief." },
      nextPractice: { format: "behavioral", reason: "Technical depth was solid; practise teamwork stories next." }, limitations: [],
    };
    localStorage.setItem(key, JSON.stringify(all));
  }, sessionId);
  await page.goto(`${BASE}/report/${sessionId}`);
  await page.getByText("63", { exact: true }).waitFor();
  await page.getByText("A stronger version of your answer").waitFor();
  await page.getByText("How this was scored").click();
  await page.getByText(/calculated by IntervU, not chosen by the AI/).waitFor();
  await page.screenshot({ path: OUT + "07-report.png", fullPage: true });
});

await step("dashboard shows real data only", async () => {
  await page.goto(BASE + "/dashboard");
  await page.getByRole("heading", { name: /^Hi, Shubham/ }).waitFor();
  await page.getByText(/One scored interview so far \(63\/100\)/).waitFor();
  await page.screenshot({ path: OUT + "08-dashboard.png", fullPage: true });
});

await step("keyboard focus is visible", async () => {
  await page.goto(BASE + "/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  assert.notEqual(outline, "none");
});

await step("mobile layouts", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, name] of [["/", "m-landing"], ["/practice", "m-setup"], [`/report/${sessionId}`, "m-report"]]) {
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `${path} overflows horizontally by ${overflow}px`);
    await page.screenshot({ path: `${OUT}09-${name}.png`, fullPage: true });
  }
});

await step("logout protects pages again", async () => {
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.goto(BASE + "/settings");
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(BASE + "/");
  await page.goto(BASE + "/history");
  await page.waitForURL(/\/login/);
});

await browser.close();
console.log(results.join("\n"));
const relevant = consoleErrors.filter((e) => !/dicebear|Failed to load resource/.test(e));
console.log(`\nconsole errors: ${relevant.length}`);
relevant.slice(0, 15).forEach((e) => console.log("  " + e.slice(0, 300)));
const ignored = consoleErrors.length - relevant.length;
if (ignored) console.log(`(ignored ${ignored} external-avatar/resource load errors: sandbox blocks external hosts)`);
