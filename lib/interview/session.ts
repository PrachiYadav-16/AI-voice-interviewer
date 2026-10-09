import type { Speaker, TranscriptTurn } from "./types";

/**
 * Live-call state as a pure reducer. The Vapi hook only translates SDK events into
 * these actions, which keeps the transition logic testable without audio.
 */

export type Phase =
  | "idle"
  | "requesting-mic"
  | "connecting"
  | "active"
  | "paused"
  | "ending"
  | "ended"
  | "failed";

/** Who holds the floor while the call is active. */
export type Floor = "interviewer" | "candidate" | "processing" | "waiting";

export interface LiveState {
  phase: Phase;
  floor: Floor;
  muted: boolean;
  turns: TranscriptTurn[];
  /** In-progress (partial) text per speaker, cleared when a final arrives. */
  partial: Partial<Record<Speaker, string>>;
  error?: { kind: ErrorKind; message: string };
  endedReason?: string;
  startedAt?: number;
  endedAt?: number;
  /** Number of interviewer turns that contained a question mark: a rough progress signal. */
  questionsAsked: number;
}

export type ErrorKind = "mic-denied" | "mic-missing" | "config" | "connect" | "network" | "unknown";

export type LiveAction =
  | { type: "start" }
  | { type: "mic-granted" }
  | { type: "mic-error"; kind: "mic-denied" | "mic-missing"; message: string }
  | { type: "call-started"; at: number }
  | { type: "speech"; speaker: Speaker; status: "started" | "stopped" }
  | { type: "transcript"; speaker: Speaker; final: boolean; text: string; at: number; id: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "set-muted"; muted: boolean }
  | { type: "end-requested" }
  | { type: "call-ended"; at: number; reason?: string }
  | { type: "error"; kind: ErrorKind; message: string }
  | { type: "reset" };

export const initialLiveState: LiveState = {
  phase: "idle",
  floor: "waiting",
  muted: false,
  turns: [],
  partial: {},
  questionsAsked: 0,
};

const isLive = (p: Phase) => p === "active" || p === "paused";

export function liveReducer(state: LiveState, action: LiveAction): LiveState {
  switch (action.type) {
    case "start":
      if (state.phase !== "idle" && state.phase !== "failed") return state;
      return { ...initialLiveState, phase: "requesting-mic" };

    case "mic-granted":
      return state.phase === "requesting-mic" ? { ...state, phase: "connecting" } : state;

    case "mic-error":
      return { ...state, phase: "failed", error: { kind: action.kind, message: action.message } };

    case "call-started":
      if (state.phase !== "connecting") return state;
      return { ...state, phase: "active", floor: "interviewer", startedAt: action.at, error: undefined };

    case "speech": {
      if (!isLive(state.phase)) return state;
      if (action.speaker === "interviewer") {
        return { ...state, floor: action.status === "started" ? "interviewer" : "waiting" };
      }
      // Candidate stopped talking: the model is now working on a reply.
      return { ...state, floor: action.status === "started" ? "candidate" : "processing" };
    }

    case "transcript": {
      if (!isLive(state.phase) && state.phase !== "ending") return state;
      const text = action.text.trim();
      if (!text) return state;
      if (!action.final) {
        return { ...state, partial: { ...state.partial, [action.speaker]: text } };
      }
      const partial = { ...state.partial };
      delete partial[action.speaker];
      const turns = appendFinal(state.turns, action.speaker, text, action.at, action.id);
      // Count a question when an interviewer turn gains its first "?".
      const last = turns[turns.length - 1];
      const prev = state.turns[state.turns.length - 1];
      const gainedQuestion =
        action.speaker === "interviewer" &&
        last.text.includes("?") &&
        !(prev && prev.id === last.id && prev.text.includes("?"));
      return {
        ...state,
        turns,
        partial,
        questionsAsked: state.questionsAsked + (gainedQuestion ? 1 : 0),
      };
    }

    case "pause":
      return state.phase === "active" ? { ...state, phase: "paused", floor: "waiting" } : state;

    case "resume":
      return state.phase === "paused" ? { ...state, phase: "active", floor: "interviewer" } : state;

    case "set-muted":
      return isLive(state.phase) ? { ...state, muted: action.muted } : state;

    case "end-requested":
      return isLive(state.phase) || state.phase === "connecting" ? { ...state, phase: "ending" } : state;

    case "call-ended":
      // A failed call stays failed: the SDK's teardown fires call-end after errors.
      if (state.phase === "ended" || state.phase === "idle" || state.phase === "failed") return state;
      // A call that never connected is a failure, not a finished interview.
      if (state.phase === "connecting" || state.phase === "requesting-mic") {
        return {
          ...state,
          phase: "failed",
          error: state.error ?? { kind: "connect", message: "The call ended before it connected." },
        };
      }
      return { ...state, phase: "ended", floor: "waiting", endedAt: action.at, endedReason: action.reason, partial: {} };

    case "error":
      // After the call has ended, late errors from teardown are irrelevant.
      if (state.phase === "ended") return state;
      return { ...state, phase: "failed", error: { kind: action.kind, message: action.message }, endedAt: state.endedAt };

    case "reset":
      return initialLiveState;
  }
}

/** Consecutive final segments from the same speaker merge into one turn. */
export function appendFinal(
  turns: TranscriptTurn[],
  speaker: Speaker,
  text: string,
  at: number,
  id: string,
): TranscriptTurn[] {
  const last = turns[turns.length - 1];
  if (last && last.speaker === speaker) {
    // Guard against the same final being delivered twice.
    if (last.text.endsWith(text)) return turns;
    return [...turns.slice(0, -1), { ...last, text: `${last.text} ${text}` }];
  }
  return [...turns, { id, speaker, text, at }];
}

/** Latest interviewer turn: what the candidate is currently answering. */
export function currentQuestion(turns: TranscriptTurn[]): string | undefined {
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].speaker === "interviewer") return turns[i].text;
  }
  return undefined;
}

/** Turns worth keeping for evaluation: at least one candidate turn. */
export function hasCandidateSpeech(turns: TranscriptTurn[]): boolean {
  return turns.some((t) => t.speaker === "candidate" && t.text.split(/\s+/).length >= 3);
}

export function vapiRoleToSpeaker(role: unknown): Speaker | null {
  if (role === "assistant") return "interviewer";
  if (role === "user") return "candidate";
  return null;
}
