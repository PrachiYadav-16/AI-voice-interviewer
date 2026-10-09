import { describe, expect, it } from "vitest";
import { initialLiveState, liveReducer, currentQuestion, hasCandidateSpeech, type LiveAction, type LiveState } from "@/lib/interview/session";

const run = (actions: LiveAction[], from: LiveState = initialLiveState) => actions.reduce(liveReducer, from);
const connected = () => run([{ type: "start" }, { type: "mic-granted" }, { type: "call-started", at: 1000 }]);
const final = (speaker: "interviewer" | "candidate", text: string, id = Math.random().toString()): LiveAction => ({
  type: "transcript",
  speaker,
  final: true,
  text,
  at: 1,
  id,
});

describe("live interview state machine", () => {
  it("moves through mic check and connection to active", () => {
    let s = liveReducer(initialLiveState, { type: "start" });
    expect(s.phase).toBe("requesting-mic");
    s = liveReducer(s, { type: "mic-granted" });
    expect(s.phase).toBe("connecting");
    s = liveReducer(s, { type: "call-started", at: 5 });
    expect(s).toMatchObject({ phase: "active", floor: "interviewer", startedAt: 5 });
  });

  it("reports microphone denial as a failure with a reason", () => {
    const s = run([{ type: "start" }, { type: "mic-error", kind: "mic-denied", message: "blocked" }]);
    expect(s.phase).toBe("failed");
    expect(s.error?.kind).toBe("mic-denied");
  });

  it("tracks who has the floor from speech updates", () => {
    let s = connected();
    s = liveReducer(s, { type: "speech", speaker: "interviewer", status: "stopped" });
    expect(s.floor).toBe("waiting");
    s = liveReducer(s, { type: "speech", speaker: "candidate", status: "started" });
    expect(s.floor).toBe("candidate");
    s = liveReducer(s, { type: "speech", speaker: "candidate", status: "stopped" });
    expect(s.floor).toBe("processing");
  });

  it("only stores final transcripts; partials are shown separately and cleared", () => {
    let s = connected();
    s = liveReducer(s, { type: "transcript", speaker: "candidate", final: false, text: "I worked", at: 1, id: "a" });
    s = liveReducer(s, { type: "transcript", speaker: "candidate", final: false, text: "I worked on React", at: 1, id: "b" });
    expect(s.turns).toHaveLength(0);
    expect(s.partial.candidate).toBe("I worked on React");
    s = liveReducer(s, final("candidate", "I worked on React apps."));
    expect(s.turns.map((t) => t.text)).toEqual(["I worked on React apps."]);
    expect(s.partial.candidate).toBeUndefined();
  });

  it("merges consecutive finals from one speaker and ignores duplicate deliveries", () => {
    let s = connected();
    s = liveReducer(s, final("candidate", "First part."));
    s = liveReducer(s, final("candidate", "Second part."));
    s = liveReducer(s, final("candidate", "Second part."));
    s = liveReducer(s, final("interviewer", "Thanks. Why?"));
    expect(s.turns).toHaveLength(2);
    expect(s.turns[0].text).toBe("First part. Second part.");
  });

  it("counts a question once per interviewer turn", () => {
    let s = connected();
    s = liveReducer(s, final("interviewer", "Hello, are you ready?"));
    s = liveReducer(s, final("interviewer", "Great, what about this?"));
    expect(s.questionsAsked).toBe(1);
    s = liveReducer(s, final("candidate", "Sure."));
    s = liveReducer(s, final("interviewer", "Next one?"));
    expect(s.questionsAsked).toBe(2);
    expect(currentQuestion(s.turns)).toBe("Next one?");
  });

  it("pauses and resumes only from valid states", () => {
    let s = connected();
    s = liveReducer(s, { type: "pause" });
    expect(s.phase).toBe("paused");
    expect(liveReducer(s, { type: "pause" })).toBe(s);
    s = liveReducer(s, { type: "resume" });
    expect(s.phase).toBe("active");
    expect(liveReducer(initialLiveState, { type: "resume" }).phase).toBe("idle");
  });

  it("ends a connected call as 'ended' and keeps the transcript", () => {
    let s = connected();
    s = liveReducer(s, final("candidate", "My answer here."));
    s = liveReducer(s, { type: "end-requested" });
    expect(s.phase).toBe("ending");
    s = liveReducer(s, { type: "call-ended", at: 9, reason: "customer-ended-call" });
    expect(s).toMatchObject({ phase: "ended", endedAt: 9, endedReason: "customer-ended-call" });
    expect(s.turns).toHaveLength(1);
  });

  it("treats a call that ends before connecting as a failure", () => {
    const s = run([{ type: "start" }, { type: "mic-granted" }, { type: "call-ended", at: 2 }]);
    expect(s.phase).toBe("failed");
  });

  it("keeps a failed call failed when teardown fires call-end", () => {
    let s = connected();
    s = liveReducer(s, { type: "error", kind: "network", message: "dropped" });
    s = liveReducer(s, { type: "call-ended", at: 3 });
    expect(s.phase).toBe("failed");
    expect(s.error?.kind).toBe("network");
  });

  it("ignores late errors after a clean end", () => {
    let s = connected();
    s = liveReducer(s, { type: "call-ended", at: 3 });
    s = liveReducer(s, { type: "error", kind: "unknown", message: "late" });
    expect(s.phase).toBe("ended");
  });

  it("detects whether the candidate said anything substantive", () => {
    expect(hasCandidateSpeech([{ id: "1", speaker: "candidate", text: "yes", at: 0 }])).toBe(false);
    expect(hasCandidateSpeech([{ id: "1", speaker: "candidate", text: "I built a dashboard", at: 0 }])).toBe(true);
  });
});
