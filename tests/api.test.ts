import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as evaluate } from "@/app/api/evaluate/route";
import { POST as plan } from "@/app/api/plan/route";
import { GET as status } from "@/app/api/status/route";
import { rateLimit, sameOrigin } from "@/lib/server/guard";
import { makeConfig, makeOutput } from "./helpers";

let ipCounter = 0;
function req(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
      origin: "http://localhost:3000",
      // Unique IP per request so the rate limiter doesn't interfere across tests.
      "x-forwarded-for": `10.0.0.${++ipCounter}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const transcript = [
  { id: "1", speaker: "interviewer", text: "Explain the virtual DOM?", at: 1 },
  { id: "2", speaker: "candidate", text: "It is an in-memory tree React diffs before updating the real DOM.", at: 2 },
];

function mockProvider(content: unknown, statusCode = 200) {
  const fn = vi.fn(async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }] }), {
      status: statusCode,
    }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("/api/evaluate", () => {
  beforeEach(() => {
    vi.stubEnv("LLM_API_KEY", "test-key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 503 with a clear code when no AI provider is configured", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    const res = await evaluate(req("/api/evaluate", { config: makeConfig(), transcript }));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("llm-not-configured");
  });

  it("rejects cross-site requests", async () => {
    const res = await evaluate(req("/api/evaluate", { config: makeConfig(), transcript }, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("rejects invalid JSON and invalid configs", async () => {
    expect((await evaluate(req("/api/evaluate", "{not json"))).status).toBe(400);
    expect((await evaluate(req("/api/evaluate", { config: { ...makeConfig(), level: "god" }, transcript }))).status).toBe(400);
  });

  it("refuses to score a transcript with no candidate speech", async () => {
    const res = await evaluate(req("/api/evaluate", { config: makeConfig(), transcript: [transcript[0]] }));
    expect(res.status).toBe(422);
  });

  it("builds a report from the provider output and computes the score itself", async () => {
    const fetchMock = mockProvider(makeOutput([[4, 4], [4, 4], [4, 4]]));
    const res = await evaluate(req("/api/evaluate", { config: makeConfig(), transcript }));
    expect(res.status).toBe(200);
    const { report } = await res.json();
    expect(report.overallScore).toBe(75);
    expect(report.rubricId).toBe("technical");
    // The transcript reached the provider; the API key went only in the auth header.
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(init.body)).toContain("virtual DOM");
    expect(String(init.body)).not.toContain("test-key");
  });

  it("returns 502 when the provider's JSON doesn't match the report shape", async () => {
    mockProvider({ questions: "nope" });
    const res = await evaluate(req("/api/evaluate", { config: makeConfig(), transcript }));
    expect(res.status).toBe(502);
  });

  it("does not leak provider error details", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("internal secret stack", { status: 401 })));
    const res = await evaluate(req("/api/evaluate", { config: makeConfig(), transcript }));
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});

describe("/api/plan", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requires a resume or job description", async () => {
    vi.stubEnv("LLM_API_KEY", "k");
    const res = await plan(req("/api/plan", { config: makeConfig() }));
    expect(res.status).toBe(400);
  });

  it("returns a validated plan", async () => {
    vi.stubEnv("LLM_API_KEY", "k");
    mockProvider({
      summary: "Tests React depth.",
      skills: ["React"],
      responsibilities: [],
      resumeClaims: ["Built a dashboard used by 200 staff"],
      questions: [{ question: "Walk me through the dashboard.", why: "Resume claim.", source: "resume" }],
    });
    const res = await plan(req("/api/plan", { config: makeConfig({ resumeText: "Built a dashboard used by 200 staff" }) }));
    expect(res.status).toBe(200);
    expect((await res.json()).plan.questions[0].source).toBe("resume");
  });
});

describe("/api/status", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("reports configuration as booleans only", async () => {
    vi.stubEnv("LLM_API_KEY", "super-secret");
    vi.stubEnv("NEXT_PUBLIC_VAPI_PUBLIC_KEY", "");
    const body = await (await status()).json();
    expect(body).toEqual({ voice: false, ai: true });
  });
});

describe("abuse protection", () => {
  it("rate-limits per key within a window and resets afterwards", () => {
    const key = `t-${Math.random()}`;
    expect(rateLimit(key, 2, 1000, 0).ok).toBe(true);
    expect(rateLimit(key, 2, 1000, 1).ok).toBe(true);
    const blocked = rateLimit(key, 2, 1000, 2);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(1);
    expect(rateLimit(key, 2, 1000, 1001).ok).toBe(true);
  });

  it("accepts same-origin and rejects other origins", () => {
    const mk = (origin?: string) =>
      new NextRequest("http://localhost:3000/api/x", { method: "POST", headers: { host: "localhost:3000", ...(origin ? { origin } : {}) } });
    expect(sameOrigin(mk("http://localhost:3000"))).toBe(true);
    expect(sameOrigin(mk("https://other.site"))).toBe(false);
  });
});

describe("signed-in check when accounts are enabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const enableCloud = () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    vi.stubEnv("LLM_API_KEY", "k");
  };

  it("rejects AI requests without a valid session", async () => {
    enableCloud();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await evaluate(req("/api/evaluate", { config: makeConfig(), transcript }, { authorization: "Bearer bad-token" }));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("auth");
    const noHeader = await evaluate(req("/api/evaluate", { config: makeConfig(), transcript }));
    expect(noHeader.status).toBe(401);
  });

  it("accepts a verified user and checks the token with Supabase", async () => {
    enableCloud();
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes("/auth/v1/user")) return new Response(JSON.stringify({ id: "user-1" }), { status: 200 });
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(makeOutput([[4], [4], [4]])) } }] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = await evaluate(req("/api/evaluate", { config: makeConfig(), transcript }, { authorization: "Bearer good-token-1" }));
    expect(res.status).toBe(200);
    const authCall = fetchMock.mock.calls.find(([u]) => String(u).includes("/auth/v1/user")) as unknown as [string, RequestInit];
    expect(authCall[0]).toBe("https://example.supabase.co/auth/v1/user");
    expect(new Headers(authCall[1].headers).get("Authorization")).toBe("Bearer good-token-1");
  });
});
