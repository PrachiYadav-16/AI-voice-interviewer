"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InterviewSession } from "@/lib/interview/types";
import {
  getProfile,
  listSessions,
  replaceProfile,
  replaceSessions,
  setSyncAdapter,
  type SyncAdapter,
  type UserProfile,
} from "@/lib/storage";

/**
 * Mirrors the local cache to Supabase. Writes are debounced per record and retried
 * with backoff, so a flaky connection never loses an interview: the browser copy
 * stays the source the UI reads, and the cloud catches up.
 */

const DEBOUNCE_MS = 1200;
const RETRY_MS = [3000, 10000, 30000, 60000];

type Op =
  | { kind: "upsert-session"; session: InterviewSession }
  | { kind: "delete-session"; id: string }
  | { kind: "clear-sessions" }
  | { kind: "upsert-profile"; profile: UserProfile };

export interface SyncStatus {
  pending: number;
  error: string | null;
}

/** Newest copy of each session wins. Missing updatedAt counts as oldest. */
export function mergeSessions(local: InterviewSession[], remote: InterviewSession[]): {
  merged: InterviewSession[];
  toUpload: InterviewSession[];
} {
  const byId = new Map<string, InterviewSession>();
  for (const r of remote) byId.set(r.id, r);
  const toUpload: InterviewSession[] = [];
  for (const l of local) {
    const r = byId.get(l.id);
    if (!r || (l.updatedAt ?? 0) > (r.updatedAt ?? 0)) {
      byId.set(l.id, l);
      toUpload.push(l);
    }
  }
  return { merged: [...byId.values()], toUpload };
}

interface Row {
  id: string;
  data: InterviewSession;
  updated_at: string;
}

export class CloudSync implements SyncAdapter {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private queue = new Map<string, Op>();
  private inflight = new Set<Promise<void>>();
  private attempts = new Map<string, number>();
  private listeners = new Set<() => void>();
  private status: SyncStatus = { pending: 0, error: null };
  private stopped = false;

  constructor(
    private sb: SupabaseClient,
    private userId: string,
  ) {}

  // ───────────── Initial pull ─────────────

  /** Loads the cloud copy into the browser cache, uploading anything only this browser has. */
  async pull(): Promise<void> {
    const [sessionsRes, profileRes] = await Promise.all([
      this.sb.from("sessions").select("id, data, updated_at").eq("user_id", this.userId).order("updated_at", { ascending: false }).limit(200),
      this.sb.from("profiles").select("data").eq("id", this.userId).maybeSingle(),
    ]);
    if (sessionsRes.error) throw new Error("Couldn't load your interviews.");
    if (profileRes.error) throw new Error("Couldn't load your profile.");

    const remote = ((sessionsRes.data ?? []) as Row[]).map((r) => ({
      ...r.data,
      id: r.id,
      userId: this.userId,
      updatedAt: r.data.updatedAt ?? Date.parse(r.updated_at),
    }));
    const { merged, toUpload } = mergeSessions(listSessions(this.userId), remote);
    replaceSessions(this.userId, merged);
    toUpload.forEach((s) => this.sessionSaved(s));

    const remoteProfile = (profileRes.data?.data ?? null) as UserProfile | null;
    const localProfile = getProfile(this.userId);
    if (remoteProfile) {
      replaceProfile(this.userId, { ...localProfile, ...remoteProfile });
    } else if (Object.keys(localProfile).length) {
      this.profileSaved(this.userId, localProfile);
    }
  }

  // ───────────── SyncAdapter ─────────────

  sessionSaved(session: InterviewSession): void {
    if (session.userId !== this.userId) return;
    this.schedule(`s:${session.id}`, { kind: "upsert-session", session });
  }

  sessionDeleted(userId: string, id: string): void {
    if (userId !== this.userId) return;
    this.schedule(`s:${id}`, { kind: "delete-session", id }, 0);
  }

  sessionsCleared(userId: string): void {
    if (userId !== this.userId) return;
    for (const key of [...this.queue.keys()]) if (key.startsWith("s:")) this.cancel(key);
    this.schedule("clear", { kind: "clear-sessions" }, 0);
  }

  profileSaved(userId: string, profile: UserProfile): void {
    if (userId !== this.userId) return;
    this.schedule("profile", { kind: "upsert-profile", profile });
  }

  // ───────────── Queue ─────────────

  private schedule(key: string, op: Op, delay = DEBOUNCE_MS) {
    if (this.stopped) return;
    this.cancel(key);
    this.queue.set(key, op);
    this.timers.set(
      key,
      setTimeout(() => void this.run(key), delay),
    );
    this.setStatus({ pending: this.queue.size });
  }

  private cancel(key: string) {
    const t = this.timers.get(key);
    if (t) clearTimeout(t);
    this.timers.delete(key);
    this.queue.delete(key);
  }

  private run(key: string): Promise<void> {
    const op = this.queue.get(key);
    this.timers.delete(key);
    if (!op) return Promise.resolve();
    const p = this.execute(op)
      .then(() => {
        if (this.queue.get(key) === op) this.queue.delete(key);
        this.attempts.delete(key);
        this.setStatus({ pending: this.queue.size, error: this.queue.size ? this.status.error : null });
      })
      .catch(() => {
        if (this.queue.get(key) !== op || this.stopped) return;
        const n = this.attempts.get(key) ?? 0;
        this.attempts.set(key, n + 1);
        this.timers.set(
          key,
          setTimeout(() => void this.run(key), RETRY_MS[Math.min(n, RETRY_MS.length - 1)]),
        );
        this.setStatus({ pending: this.queue.size, error: "Changes aren't saved to your account yet. Retrying…" });
      })
      .finally(() => this.inflight.delete(p));
    this.inflight.add(p);
    return p;
  }

  private async execute(op: Op): Promise<void> {
    let res: { error: unknown };
    switch (op.kind) {
      case "upsert-session":
        res = await this.sb.from("sessions").upsert({
          id: op.session.id,
          user_id: this.userId,
          data: op.session,
          created_at: new Date(op.session.createdAt).toISOString(),
          updated_at: new Date(op.session.updatedAt ?? Date.now()).toISOString(),
        });
        break;
      case "delete-session":
        res = await this.sb.from("sessions").delete().eq("id", op.id).eq("user_id", this.userId);
        break;
      case "clear-sessions":
        res = await this.sb.from("sessions").delete().eq("user_id", this.userId);
        break;
      case "upsert-profile":
        res = await this.sb.from("profiles").upsert({ id: this.userId, data: op.profile, updated_at: new Date().toISOString() });
        break;
    }
    if (res.error) throw res.error;
  }

  /** Sends everything queued now and waits for it (used before signing out). */
  async flush(timeoutMs = 8000): Promise<boolean> {
    for (const key of [...this.timers.keys()]) {
      clearTimeout(this.timers.get(key));
      void this.run(key);
    }
    const done = Promise.allSettled([...this.inflight]).then(() => this.queue.size === 0);
    const timeout = new Promise<boolean>((r) => setTimeout(() => r(false), timeoutMs));
    return Promise.race([done, timeout]);
  }

  stop() {
    this.stopped = true;
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.queue.clear();
    this.listeners.clear();
  }

  // ───────────── Status for the UI ─────────────

  getStatus = (): SyncStatus => this.status;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private setStatus(patch: Partial<SyncStatus>) {
    const next = { ...this.status, ...patch };
    if (next.pending === this.status.pending && next.error === this.status.error) return;
    this.status = next;
    this.listeners.forEach((fn) => fn());
  }
}

// ───────────── Active instance ─────────────

let active: CloudSync | null = null;

export async function startCloudSync(sb: SupabaseClient, userId: string): Promise<CloudSync> {
  if (active) {
    active.stop();
    setSyncAdapter(null);
  }
  const sync = new CloudSync(sb, userId);
  active = sync;
  setSyncAdapter(sync);
  await sync.pull();
  return sync;
}

export async function stopCloudSync(): Promise<void> {
  if (!active) return;
  await active.flush();
  active.stop();
  active = null;
  setSyncAdapter(null);
}

export function activeSync(): CloudSync | null {
  return active;
}
