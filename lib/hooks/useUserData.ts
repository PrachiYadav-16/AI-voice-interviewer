"use client";

import { useMemo, useSyncExternalStore } from "react";
import { KEYS, getProfile, listSessions, subscribe } from "@/lib/storage";
import type { InterviewSession } from "@/lib/interview/types";

const raw = (key: string) => () => (typeof window === "undefined" ? null : window.localStorage.getItem(key));
const serverNull = () => null;

/** Live view of this user's saved sessions; re-renders when storage changes (including other tabs). */
export function useSessions(userId: string): InterviewSession[] {
  const snap = useSyncExternalStore(subscribe, raw(KEYS.sessions(userId)), serverNull);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- snap is the change signal
  return useMemo(() => listSessions(userId), [snap, userId]);
}

export function useSession(userId: string, id: string): InterviewSession | undefined {
  const sessions = useSessions(userId);
  return sessions.find((s) => s.id === id);
}

export function useProfile(userId: string) {
  const snap = useSyncExternalStore(subscribe, raw(KEYS.profile(userId)), serverNull);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- snap is the change signal
  return useMemo(() => getProfile(userId), [snap, userId]);
}

