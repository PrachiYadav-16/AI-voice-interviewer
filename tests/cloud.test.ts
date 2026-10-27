import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { installLocalStorage, makeConfig } from "./helpers";
import type { InterviewSession } from "@/lib/interview/types";

const store = installLocalStorage();
const storage = await import("@/lib/storage");
const { CloudSync, mergeSessions } = await import("@/lib/cloud");

const session = (id: string, updatedAt: number, userId = "u1"): InterviewSession => ({
  id,
  userId,
  config: makeConfig(),
  createdAt: 1000,
  status: "completed",
  transcript: [],
  updatedAt,
});

/** Minimal in-memory stand-in for the parts of supabase-js the sync engine uses. */
function fakeSupabase(opts: { rows?: { id: string; data: InterviewSession; updated_at: string }[]; profile?: object | null; failWrites?: number } = {}) {
  const calls: { table: string; op: string; arg?: unknown; filters: [string, unknown][] }[] = [];
  let failures = opts.failWrites ?? 0;
  const result = () => {
    if (failures > 0) {
      failures--;
      return { error: { message: "network" } };
    }
    return { error: null };
  };
  const from = (table: string) => {
    const filters: [string, unknown][] = [];
    const q = {
      select: () => q,
      order: () => q,
      limit: () => Promise.resolve({ data: opts.rows ?? [], error: null }),
      maybeSingle: () => Promise.resolve({ data: opts.profile ? { data: opts.profile } : null, error: null }),
      eq: (col: string, val: unknown) => {
        filters.push([col, val]);
        return Object.assign(Promise.resolve(lastResult), q);
      },
      upsert: (arg: unknown) => {
        calls.push({ table, op: "upsert", arg, filters });
        return Promise.resolve(result());
      },
      delete: () => {
        const call = { table, op: "delete", filters };
        calls.push(call);
        lastResult = result();
        return q;
      },
    };
    let lastResult: { error: unknown } = { error: null };
    return q;
  };
  return { client: { from } as unknown as SupabaseClient, calls };
}

describe("merging local and cloud interviews", () => {
  it("keeps the newest copy of each interview and uploads only local-newer ones", () => {
    const { merged, toUpload } = mergeSessions(
      [session("a", 5), session("b", 1), session("local-only", 3)],
      [session("a", 2), session("b", 9), session("cloud-only", 4)],
    );
    const byId = Object.fromEntries(merged.map((s) => [s.id, s.updatedAt]));
    expect(byId).toEqual({ a: 5, b: 9, "local-only": 3, "cloud-only": 4 });
    expect(toUpload.map((s) => s.id).sort()).toEqual(["a", "local-only"]);
  });
});

describe("cloud sync engine", () => {
  beforeEach(() => {
    store.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    storage.setSyncAdapter(null);
  });

  it("loads the account's interviews and profile into the browser on sign-in", async () => {
    const { client } = fakeSupabase({
      rows: [{ id: "abcdef12", data: session("abcdef12", 7), updated_at: new Date(7).toISOString() }],
      profile: { resumeText: "my cv", avatar: "x" },
    });
    const sync = new CloudSync(client, "u1");
    await sync.pull();
    expect(storage.listSessions("u1").map((s) => s.id)).toEqual(["abcdef12"]);
    expect(storage.getProfile("u1")).toMatchObject({ resumeText: "my cv", avatar: "x" });
    sync.stop();
  });

  it("debounces rapid saves of one interview into a single upload", async () => {
    const { client, calls } = fakeSupabase();
    const sync = new CloudSync(client, "u1");
    storage.setSyncAdapter(sync);
    for (let i = 0; i < 5; i++) storage.saveSession({ ...session("live1234", 0), transcript: [{ id: `t${i}`, speaker: "candidate", text: "hi", at: i }] });
    expect(sync.getStatus().pending).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    const upserts = calls.filter((c) => c.table === "sessions" && c.op === "upsert");
    expect(upserts).toHaveLength(1);
    expect((upserts[0].arg as { data: InterviewSession }).data.transcript).toHaveLength(1);
    expect(sync.getStatus()).toEqual({ pending: 0, error: null });
    sync.stop();
  });

  it("retries failed writes and reports the problem until they succeed", async () => {
    const { client, calls } = fakeSupabase({ failWrites: 2 });
    const sync = new CloudSync(client, "u1");
    storage.setSyncAdapter(sync);
    storage.saveSession(session("retry123", 0));
    await vi.advanceTimersByTimeAsync(1300);
    expect(sync.getStatus().error).toMatch(/Retrying/);
    await vi.advanceTimersByTimeAsync(3100);
    expect(sync.getStatus().error).toMatch(/Retrying/);
    await vi.advanceTimersByTimeAsync(10100);
    expect(sync.getStatus()).toEqual({ pending: 0, error: null });
    expect(calls.filter((c) => c.op === "upsert")).toHaveLength(3);
    sync.stop();
  });

  it("deletes in the cloud and ignores other users' records", async () => {
    const { client, calls } = fakeSupabase();
    const sync = new CloudSync(client, "u1");
    storage.setSyncAdapter(sync);
    storage.saveSession(session("other123", 0, "u2"));
    storage.deleteSession("u1", "gone1234");
    await vi.advanceTimersByTimeAsync(1500);
    expect(calls.some((c) => c.op === "upsert")).toBe(false);
    const del = calls.find((c) => c.op === "delete")!;
    expect(del.filters).toEqual([
      ["id", "gone1234"],
      ["user_id", "u1"],
    ]);
    sync.stop();
  });

  it("flushes pending changes immediately before sign-out", async () => {
    const { client, calls } = fakeSupabase();
    const sync = new CloudSync(client, "u1");
    storage.setSyncAdapter(sync);
    storage.updateProfile("u1", { resumeText: "cv" });
    const flushed = sync.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(await flushed).toBe(true);
    expect(calls.find((c) => c.table === "profiles")?.arg).toMatchObject({ id: "u1", data: { resumeText: "cv" } });
    sync.stop();
  });
});
