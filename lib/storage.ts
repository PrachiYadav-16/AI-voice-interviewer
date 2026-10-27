"use client";

import type { InterviewConfig, InterviewSession } from "@/lib/interview/types";

/**
 * Local-first persistence. The UI always reads from this browser's localStorage,
 * scoped per account id. When Supabase is configured, a sync adapter (lib/cloud.ts)
 * mirrors every change to the database and fills this cache on sign-in.
 */

export const KEYS = {
  users: "intervu.users",
  current: "intervu.current",
  profile: (userId: string) => `intervu.u.${userId}.profile`,
  sessions: (userId: string) => `intervu.u.${userId}.sessions`,
  // Legacy keys from the original version, migrated on first load.
  legacyUsers: "intervu_users",
  legacyCurrent: "intervu_user",
  legacyResume: (userId: string) => `intervu_resume_${userId}`,
} as const;

export const MAX_SESSIONS = 60;

export class StorageFullError extends Error {
  constructor() {
    super("This browser's storage for IntervU is full. Delete some old interviews from History and try again.");
    this.name = "StorageFullError";
  }
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: number;
  passwordHash: string;
  salt: string;
}

export interface UserProfile {
  avatar?: string;
  resumeText?: string;
  resumeFileName?: string;
  resumeNeedsReupload?: boolean;
  lastConfig?: Partial<InterviewConfig>;
}

/** Receives every local change so it can be mirrored to the cloud. */
export interface SyncAdapter {
  sessionSaved(session: InterviewSession): void;
  sessionDeleted(userId: string, id: string): void;
  sessionsCleared(userId: string): void;
  profileSaved(userId: string, profile: UserProfile): void;
}

let adapter: SyncAdapter | null = null;
export function setSyncAdapter(next: SyncAdapter | null): void {
  adapter = next;
}

const listeners = new Set<() => void>();
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith("intervu")) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
function notify() {
  listeners.forEach((fn) => fn());
}

export function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (err instanceof DOMException && (err.name === "QuotaExceededError" || err.code === 22)) {
      throw new StorageFullError();
    }
    throw err;
  } finally {
    notify();
  }
}

export function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } finally {
    notify();
  }
}

// ───────────── Profile ─────────────

export function getProfile(userId: string): UserProfile {
  return read<UserProfile>(KEYS.profile(userId), {});
}

export function updateProfile(userId: string, patch: Partial<UserProfile>): UserProfile {
  const next = { ...getProfile(userId), ...patch };
  write(KEYS.profile(userId), next);
  adapter?.profileSaved(userId, next);
  return next;
}

/** Replaces the cached profile with the cloud copy. Does not sync back. */
export function replaceProfile(userId: string, profile: UserProfile): void {
  write(KEYS.profile(userId), profile);
}

// ───────────── Sessions ─────────────

export function listSessions(userId: string): InterviewSession[] {
  const all = read<InterviewSession[]>(KEYS.sessions(userId), []);
  // Defensive: never return another user's record even if storage was edited.
  return all.filter((s) => s.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
}

export function getSession(userId: string, id: string): InterviewSession | undefined {
  return listSessions(userId).find((s) => s.id === id);
}

export function saveSession(session: InterviewSession): void {
  const all = listSessions(session.userId).filter((s) => s.id !== session.id);
  // The live call needs the resume; afterwards it lives once in the profile, not in every session.
  const base: InterviewSession =
    session.status === "in-progress" ? session : { ...session, config: { ...session.config, resumeText: "" } };
  const slim: InterviewSession = { ...base, updatedAt: Date.now() };
  const next = [slim, ...all].slice(0, MAX_SESSIONS);
  write(KEYS.sessions(session.userId), next);
  adapter?.sessionSaved(slim);
}

/** Replaces the cached sessions with a merged cloud copy. Does not sync back. */
export function replaceSessions(userId: string, sessions: InterviewSession[]): void {
  write(
    KEYS.sessions(userId),
    sessions.filter((s) => s.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_SESSIONS),
  );
}

export function deleteSession(userId: string, id: string): void {
  write(
    KEYS.sessions(userId),
    listSessions(userId).filter((s) => s.id !== id),
  );
  adapter?.sessionDeleted(userId, id);
}

export function deleteAllSessions(userId: string): void {
  remove(KEYS.sessions(userId));
  adapter?.sessionsCleared(userId);
}

/** Removes this user's cached data from the browser only (cloud copy untouched). */
export function clearLocalCache(userId: string): void {
  remove(KEYS.sessions(userId));
  remove(KEYS.profile(userId));
}

export function deleteAllUserData(userId: string): void {
  deleteAllSessions(userId);
  remove(KEYS.profile(userId));
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
